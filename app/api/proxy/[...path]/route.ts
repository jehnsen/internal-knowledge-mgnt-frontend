import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000';

/** Wraps fetch with an AbortController-based deadline. */
function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id),
  );
}

/**
 * Attempt to refresh the access token using the refresh token cookie.
 * Returns the new access token string on success, or null on failure.
 */
async function tryRefreshToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `${BACKEND_URL}/api/v1/auth/refresh`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
      10_000, // token refresh should be fast
    );
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.access_token === 'string' ? data.access_token : null;
  } catch {
    return null;
  }
}

/** Stamp a NextResponse with expired-cookie headers to force client logout. */
function clearAuthCookies(res: NextResponse): NextResponse {
  res.cookies.set('access_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  res.cookies.set('refresh_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  return res;
}

async function proxyRequest(
  request: NextRequest,
  path: string[],
): Promise<NextResponse> {
  const accessToken  = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // Build the backend URL, preserving query string
  const backendPath = path.join('/');
  const search = request.nextUrl.search;
  const backendUrl = `${BACKEND_URL}/api/v1/${backendPath}${search}`;

  const contentType = request.headers.get('content-type');

  // Read body once for mutating methods (includes multipart/form-data)
  let body: ArrayBuffer | null = null;
  if (!['GET', 'HEAD'].includes(request.method)) {
    body = await request.arrayBuffer();
  }

  // Give large file uploads up to 5 minutes; everything else 30 seconds.
  const isUpload = contentType?.includes('multipart/form-data') ?? false;
  const timeoutMs = isUpload ? 5 * 60_000 : 30_000;

  const buildHeaders = (token: string | undefined) => {
    const h = new Headers();
    if (contentType) h.set('content-type', contentType);
    if (token) h.set('authorization', `Bearer ${token}`);
    return h;
  };

  let backendRes: Response;
  try {
    backendRes = await fetchWithTimeout(
      backendUrl,
      { method: request.method, headers: buildHeaders(accessToken), body: body ?? undefined },
      timeoutMs,
    );
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ detail: 'Backend request timed out' }, { status: 504 });
    }
    return NextResponse.json({ detail: 'Backend unreachable' }, { status: 502 });
  }

  // Build response headers (forward content-type & content-disposition)
  const makeResponseHeaders = (res: Response) => {
    const h = new Headers();
    const ct = res.headers.get('content-type');
    if (ct) h.set('content-type', ct);
    const cd = res.headers.get('content-disposition');
    if (cd) h.set('content-disposition', cd);
    return h;
  };

  // --- Token rotation on 401 ---
  if (backendRes.status === 401 && refreshToken) {
    const newAccessToken = await tryRefreshToken(refreshToken);

    if (!newAccessToken) {
      // Refresh also failed — force logout
      const errorBody = await backendRes.arrayBuffer();
      const res = new NextResponse(errorBody, {
        status: 401,
        headers: makeResponseHeaders(backendRes),
      });
      return clearAuthCookies(res);
    }

    // Retry the original request with the fresh token
    let retryRes: Response;
    try {
      retryRes = await fetchWithTimeout(
        backendUrl,
        { method: request.method, headers: buildHeaders(newAccessToken), body: body ?? undefined },
        timeoutMs,
      );
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return NextResponse.json({ detail: 'Backend request timed out' }, { status: 504 });
      }
      return NextResponse.json({ detail: 'Backend unreachable' }, { status: 502 });
    }

    const retryBody = await retryRes.arrayBuffer();
    const res = new NextResponse(retryBody, {
      status: retryRes.status,
      headers: makeResponseHeaders(retryRes),
    });
    // Persist the new access token in the HttpOnly cookie (7-day refresh window
    // minus however long we'll use the new 24 h access token is fine to keep
    // at 24 h here — the important thing is it replaces the expired one).
    res.cookies.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    return res;
  }

  // Clear stale cookies when the backend rejects them (no refresh token available,
  // or a 403 Forbidden that a refresh cannot fix)
  if (backendRes.status === 401 || backendRes.status === 403) {
    const errorBody = await backendRes.arrayBuffer();
    const res = new NextResponse(errorBody, {
      status: backendRes.status,
      headers: makeResponseHeaders(backendRes),
    });
    return clearAuthCookies(res);
  }

  const responseBody = await backendRes.arrayBuffer();
  return new NextResponse(responseBody, {
    status: backendRes.status,
    headers: makeResponseHeaders(backendRes),
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(request, path);
}
