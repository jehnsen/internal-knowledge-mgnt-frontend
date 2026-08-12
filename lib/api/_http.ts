// ---------------------------------------------------------------------------
// Shared HTTP primitives — internal to lib/api/, not part of the public API
// ---------------------------------------------------------------------------

// Call the backend directly. The BFF proxy layer has been removed; auth is
// handled by injecting the Bearer token stored in _accessToken below.
export const BFF_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1`;

export const DEFAULT_TIMEOUT_MS = 30_000;   // 30 s
export const UPLOAD_TIMEOUT_MS  = 120_000;  // 2 min for file uploads / downloads
export const MAX_RETRIES = 2;               // 3 total attempts (initial + 2 retries)

// ---------------------------------------------------------------------------
// In-memory token storage — populated after login / session restore.
// The token itself never touches the DOM; it lives only in this module scope.
// ---------------------------------------------------------------------------
let _accessToken: string | null = null;

// ---------------------------------------------------------------------------
// Session-restore gate
// ---------------------------------------------------------------------------
// On a full page load the token is gone (it only ever lived in this module) and
// has to be fetched back from the HttpOnly cookie via GET /api/auth/me.  React
// runs child effects BEFORE parent effects, so a page's data-loading effect
// fires before AuthProvider has even started that request — the call would go
// out with no Authorization header, 401, and surface to the user as "not
// found" on a perfectly valid resource.
//
// So the module starts life closed: any direct-to-backend request waits here
// until the session has been restored (or has definitively failed).  Requests
// to same-origin `/api/*` BFF routes never wait — they authenticate with the
// cookie and must not, since /api/auth/me is what opens the gate.
// ---------------------------------------------------------------------------
const RESTORE_TIMEOUT_MS = 15_000;

let _sessionRestore: Promise<void> | null = null;
let _openGate: (() => void) | null = null;
let _restoreTimer: ReturnType<typeof setTimeout> | null = null;

function beginSessionRestore(): void {
  if (_sessionRestore) return;
  _sessionRestore = new Promise<void>(resolve => { _openGate = resolve; });
  // Safety valve: never let a failure to call endSessionRestore() hang the app.
  _restoreTimer = setTimeout(endSessionRestore, RESTORE_TIMEOUT_MS);
}

/**
 * Releases any requests waiting on the session restore.  Called once the
 * startup /auth/me check has settled — on success, failure, or "not logged in"
 * alike, since in every case waiting longer cannot help.
 */
export function endSessionRestore(): void {
  if (_restoreTimer) { clearTimeout(_restoreTimer); _restoreTimer = null; }
  _openGate?.();
  _openGate = null;
  _sessionRestore = null;
}

// Close the gate at module load — before any component renders, which is the
// whole point.  Server-side there is no session to restore, so skip it.
if (typeof window !== 'undefined') beginSessionRestore();

export function setAccessToken(token: string | null): void {
  _accessToken = token;
  // A token arriving means the restore succeeded; stop holding requests.
  if (token) endSessionRestore();
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrapper around `fetch` that adds:
 * - Authorization: Bearer header when a token is available
 * - An AbortController-based timeout (default 30 s)
 * - Automatic exponential-backoff retry for network errors and 5xx responses
 *   (4xx responses are returned immediately — retrying won't help)
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = MAX_RETRIES,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  // Relative URLs are same-origin BFF routes authenticated by cookie; they
  // need no token and must never wait (GET /api/auth/me opens the gate).
  const isBffRoute = url.startsWith('/');
  if (!isBffRoute && _sessionRestore) await _sessionRestore;

  // Inject Authorization header once, before the retry loop
  if (_accessToken) {
    const headers = new Headers(options.headers);
    if (!headers.has('authorization')) {
      headers.set('authorization', `Bearer ${_accessToken}`);
    }
    options = { ...options, headers };
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      // Exponential delay with ±50 % jitter: 500–1 000 ms, 1–2 s, 2–4 s …
      const base   = Math.min(1_000 * Math.pow(2, attempt - 1), 8_000);
      const jitter = 0.5 + Math.random() * 0.5;
      await sleep(base * jitter);
    }

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });

      // 4xx — client error; return immediately (retrying won't change outcome)
      if (response.status < 500) return response;

      // 5xx — release the connection body before retrying
      try { response.body?.cancel(); } catch { /* ignore */ }

      // Last attempt — re-fetch without aborting so handleResponse can read the body
      if (attempt === retries) {
        clearTimeout(timeoutId);
        return fetch(url, options);
      }
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      if (attempt === retries) {
        throw new Error(
          isAbort
            ? 'Request timed out. Please check your connection and try again.'
            : 'Network error. Please check your connection and try again.',
        );
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Unreachable — TypeScript requires a return path
  throw new Error('Request failed');
}

/** JSON Content-Type header — Authorization is injected automatically by fetchWithRetry. */
export function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

/** Parses an API response, throws a descriptive Error on failure. */
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // 401 means the token itself is missing/invalid/expired — the session is
    // genuinely gone, so log the user out. 403 means the token is valid but
    // the user lacks permission for this specific resource (e.g. a non-admin
    // hitting an admin-only endpoint) — that must NOT log the user out.
    if (response.status === 401) {
      // Only signal expiry when we actually had a token stored.
      // If _accessToken is null the request raced ahead of session-init;
      // ProtectedRoute will handle any redirect that is needed.
      if (_accessToken) {
        _accessToken = null; // Clear immediately so parallel calls don't repeat the event
        // Dispatch a DOM event — AuthContext listens and clears the user so
        // ProtectedRoute can redirect cleanly, without a direct window.location hack.
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
        }
      }
      throw new Error('Your session has expired. Please log in again.');
    }

    if (response.status === 403) {
      let detail = 'You do not have permission to perform this action.';
      try {
        const error = await response.json();
        detail = error.detail || error.message || detail;
      } catch { /* fall back to default message */ }
      throw new Error(detail);
    }

    let errorDetail = 'An error occurred';
    try {
      const error = await response.json();
      errorDetail = error.detail || error.message || errorDetail;
    } catch {
      try {
        const text = await response.text();
        if (text) errorDetail = text.substring(0, 200);
      } catch {
        errorDetail = `API Error: ${response.status} ${response.statusText}`;
      }
    }
    throw new Error(errorDetail);
  }

  try {
    return await response.json();
  } catch {
    throw new Error('Invalid response format from server');
  }
}
