import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Regression cover for the startup auth race.
 *
 * On a full page load the in-memory access token is gone and has to be restored
 * from the HttpOnly cookie. React runs child effects before parent effects, so a
 * page's data-loading effect fires before AuthProvider has started that restore.
 * Without the gate in _http.ts those requests go out unauthenticated, 401, and
 * surface to the user as a missing resource (e.g. /documents/17 rendering
 * "Document Not Found" for a document that exists).
 *
 * Each test re-imports the module so it starts from a closed gate, exactly as it
 * would on a fresh page load.
 */
async function freshHttp() {
  vi.resetModules();
  return import('@/lib/api/_http');
}

describe('_http session-restore gate', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('holds direct-to-backend requests until the session is restored', async () => {
    const { fetchWithRetry, setAccessToken, endSessionRestore } = await freshHttp();

    const pending = fetchWithRetry('https://api.example.com/api/v1/documents/17');

    // The gate is closed, so nothing has reached the network yet.
    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();

    // Session restore completes and supplies the token.
    setAccessToken('restored-token');
    await pending;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const headers = new Headers(fetchMock.mock.calls[0][1].headers);
    expect(headers.get('authorization')).toBe('Bearer restored-token');

    endSessionRestore();
  });

  it('never holds same-origin BFF routes — /api/auth/me is what opens the gate', async () => {
    const { fetchWithRetry, endSessionRestore } = await freshHttp();

    // No token has been set and the gate is still closed; this must not deadlock.
    await fetchWithRetry('/api/auth/me');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/me');

    endSessionRestore();
  });

  it('releases waiting requests when the restore finds no session', async () => {
    const { fetchWithRetry, endSessionRestore } = await freshHttp();

    const pending = fetchWithRetry('https://api.example.com/api/v1/documents/17');
    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();

    // Logged out, or the backend is unreachable: AuthProvider opens the gate
    // anyway, since waiting longer cannot produce a token.
    endSessionRestore();
    await pending;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const headers = new Headers(fetchMock.mock.calls[0][1].headers ?? {});
    expect(headers.get('authorization')).toBeNull();
  });

  it('opens the gate on a timeout so a missing AuthProvider cannot hang the app', async () => {
    vi.useFakeTimers();
    const { fetchWithRetry } = await freshHttp();

    const pending = fetchWithRetry('https://api.example.com/api/v1/documents/17');
    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(15_000);
    await pending;

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not gate requests once a token is already in memory', async () => {
    const { fetchWithRetry, setAccessToken } = await freshHttp();

    setAccessToken('live-token'); // e.g. straight after an interactive login
    await fetchWithRetry('https://api.example.com/api/v1/documents/17');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
