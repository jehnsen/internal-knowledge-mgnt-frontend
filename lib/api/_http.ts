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

export function setAccessToken(token: string | null): void {
  _accessToken = token;
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
    if (response.status === 401 || response.status === 403) {
      const message = response.status === 401
        ? 'Your session has expired. Please log in again.'
        : 'Authentication failed. Please log in again.';

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
      throw new Error(message);
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
