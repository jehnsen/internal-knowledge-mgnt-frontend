import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid request body' }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ detail: 'Backend unreachable' }, { status: 502 });
  }

  if (!backendRes.ok) {
    const error = await backendRes.json().catch(() => ({ detail: 'Login failed' }));
    return NextResponse.json(error, { status: backendRes.status });
  }

  const tokens = await backendRes.json() as {
    access_token: string;
    refresh_token: string;
    token_type: string;
  };

  const isProduction = process.env.NODE_ENV === 'production';
  // Return access_token in the body so the client can store it in memory
  // and attach it as a Bearer header when calling the backend directly.
  const res = NextResponse.json({ token_type: tokens.token_type, access_token: tokens.access_token });

  res.cookies.set('access_token', tokens.access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  res.cookies.set('refresh_token', tokens.refresh_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}
