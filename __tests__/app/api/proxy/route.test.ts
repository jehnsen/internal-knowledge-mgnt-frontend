import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Stub global fetch before the route module is imported so that every
// fetch() call inside the handler goes through the mock.
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { GET, POST } from '@/app/api/proxy/[...path]/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(url: string, init: RequestInit = {}): NextRequest {
  return new NextRequest(url, init);
}

function pathParams(path: string[]) {
  return { params: Promise.resolve({ path }) } as any;
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

// ---------------------------------------------------------------------------
// Network errors
// ---------------------------------------------------------------------------
describe('BFF proxy – network errors', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 502 when the backend is unreachable', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    const req = makeRequest('http://localhost:3000/api/proxy/documents');
    const res = await GET(req, pathParams(['documents']));

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.detail).toBe('Backend unreachable');
  });

  it('returns 504 when fetch throws an AbortError (timeout)', async () => {
    const abortError = Object.assign(new Error('The operation was aborted.'), {
      name: 'AbortError',
    });
    mockFetch.mockRejectedValue(abortError);

    const req = makeRequest('http://localhost:3000/api/proxy/documents');
    const res = await GET(req, pathParams(['documents']));

    expect(res.status).toBe(504);
    const body = await res.json();
    expect(body.detail).toBe('Backend request timed out');
  });
});

// ---------------------------------------------------------------------------
// 5xx passthrough
// ---------------------------------------------------------------------------
describe('BFF proxy – 5xx responses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes a 500 backend response straight through to the client', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ detail: 'Internal Server Error' }, 500));

    const req = makeRequest('http://localhost:3000/api/proxy/documents');
    const res = await GET(req, pathParams(['documents']));

    expect(res.status).toBe(500);
  });

  it('passes a 503 backend response straight through to the client', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ detail: 'Service Unavailable' }, 503));

    const req = makeRequest('http://localhost:3000/api/proxy/documents');
    const res = await GET(req, pathParams(['documents']));

    expect(res.status).toBe(503);
  });
});

// ---------------------------------------------------------------------------
// 401 token rotation
// ---------------------------------------------------------------------------
describe('BFF proxy – 401 token rotation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retries with a refreshed access token and returns the success response', async () => {
    mockFetch
      // 1. Initial request → 401
      .mockResolvedValueOnce(jsonResponse({ detail: 'Unauthorized' }, 401))
      // 2. Token refresh → success
      .mockResolvedValueOnce(jsonResponse({ access_token: 'new_token' }, 200))
      // 3. Retry with fresh token → success
      .mockResolvedValueOnce(jsonResponse({ data: 'ok' }, 200));

    const req = makeRequest('http://localhost:3000/api/proxy/documents', {
      headers: { cookie: 'access_token=old; refresh_token=valid_refresh' },
    });
    const res = await GET(req, pathParams(['documents']));

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('returns 401 and clears auth cookies when token refresh also fails', async () => {
    mockFetch
      // 1. Initial request → 401
      .mockResolvedValueOnce(jsonResponse({ detail: 'Unauthorized' }, 401))
      // 2. Token refresh → also fails
      .mockResolvedValueOnce(jsonResponse({ detail: 'Invalid token' }, 401));

    const req = makeRequest('http://localhost:3000/api/proxy/documents', {
      headers: { cookie: 'access_token=old; refresh_token=bad_refresh' },
    });
    const res = await GET(req, pathParams(['documents']));

    expect(res.status).toBe(401);
    // Both cookies must be expired
    const setCookie = res.headers.getSetCookie?.() ?? [res.headers.get('set-cookie') ?? ''];
    const joined = setCookie.join(' ');
    expect(joined).toMatch(/access_token=/i);
    expect(joined).toMatch(/Max-Age=0/i);
  });

  it('clears auth cookies on 401 when no refresh token is present', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ detail: 'Unauthorized' }, 401));

    // No refresh_token cookie → falls straight to the clear-cookies path
    const req = makeRequest('http://localhost:3000/api/proxy/documents', {
      headers: { cookie: 'access_token=expired' },
    });
    const res = await GET(req, pathParams(['documents']));

    expect(res.status).toBe(401);
    const setCookie = res.headers.getSetCookie?.() ?? [res.headers.get('set-cookie') ?? ''];
    expect(setCookie.join(' ')).toMatch(/access_token=/i);
  });

  it('returns 504 when the retry fetch also times out', async () => {
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    mockFetch
      // 1. Initial request → 401
      .mockResolvedValueOnce(jsonResponse({ detail: 'Unauthorized' }, 401))
      // 2. Refresh succeeds
      .mockResolvedValueOnce(jsonResponse({ access_token: 'new_token' }, 200))
      // 3. Retry times out
      .mockRejectedValueOnce(abortError);

    const req = makeRequest('http://localhost:3000/api/proxy/documents', {
      headers: { cookie: 'access_token=old; refresh_token=valid_refresh' },
    });
    const res = await GET(req, pathParams(['documents']));

    expect(res.status).toBe(504);
  });
});

// ---------------------------------------------------------------------------
// POST with body forwarding
// ---------------------------------------------------------------------------
describe('BFF proxy – POST request', () => {
  beforeEach(() => vi.clearAllMocks());

  it('forwards JSON body to the backend and returns its response', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: 1 }, 201));

    const req = makeRequest('http://localhost:3000/api/proxy/documents', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Test' }),
    });
    const res = await POST(req, pathParams(['documents']));

    expect(res.status).toBe(201);
    expect(mockFetch).toHaveBeenCalledOnce();
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('POST');
  });
});
