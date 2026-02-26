import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch {
    return NextResponse.json({ detail: 'Backend unreachable' }, { status: 502 });
  }

  if (!backendRes.ok) {
    const error = await backendRes.json().catch(() => ({ detail: 'Unauthorized' }));
    // Clear stale cookies on backend auth failure
    if (backendRes.status === 401 || backendRes.status === 403) {
      const res = NextResponse.json(error, { status: backendRes.status });
      res.cookies.set('access_token', '', { httpOnly: true, maxAge: 0, path: '/' });
      res.cookies.set('refresh_token', '', { httpOnly: true, maxAge: 0, path: '/' });
      return res;
    }
    return NextResponse.json(error, { status: backendRes.status });
  }

  const user = await backendRes.json();
  // Include the access_token so the client can restore its in-memory Bearer
  // token after a page reload (token is HttpOnly so JS cannot read it directly).
  return NextResponse.json({ ...user, _token: token });
}
