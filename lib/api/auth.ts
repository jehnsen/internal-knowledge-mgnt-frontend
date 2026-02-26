import { BFF_BASE, fetchWithRetry, jsonHeaders, handleResponse, setAccessToken } from './_http';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role?: 'admin' | 'user';
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
}

export class AuthAPI {
  static async register(data: RegisterRequest): Promise<User> {
    const response = await fetchWithRetry(`${BFF_BASE}/auth/register`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(response);
  }

  /** Calls the dedicated BFF login route which sets HttpOnly cookies. */
  static async login(data: LoginRequest): Promise<void> {
    const response = await fetchWithRetry('/api/auth/login', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ username: data.username, password: data.password }),
    });

    if (!response.ok) {
      let errorDetail = 'Login failed';
      try {
        const error = await response.json();
        errorDetail = error.detail || error.message || errorDetail;
      } catch { /* ignore */ }
      throw new Error(errorDetail);
    }

    // Store the access token in memory so fetchWithRetry attaches it as a
    // Bearer header for direct backend calls (proxy removed).
    const result = await response.json().catch(() => null);
    if (result?.access_token) setAccessToken(result.access_token);
  }

  /** Used for mid-session calls where a 401 should trigger a redirect. */
  static async getCurrentUser(): Promise<User> {
    const response = await fetchWithRetry('/api/auth/me');
    const data = await handleResponse<User & { _token?: string }>(response);
    if (data._token) setAccessToken(data._token);
    const { _token: _, ...user } = data;
    return user as User;
  }

  /**
   * Silent session check for app startup.
   * Returns null on 401/403 (not logged in) instead of redirecting.
   * Throws only for genuine network / server failures.
   */
  static async checkSession(): Promise<User | null> {
    const response = await fetchWithRetry('/api/auth/me');

    if (response.status === 401 || response.status === 403) return null;

    if (!response.ok) {
      let detail = `Service error: ${response.status}`;
      try {
        const body = await response.json();
        detail = body.detail || body.message || detail;
      } catch { /* ignore */ }
      throw new Error(detail);
    }

    const data = await response.json() as User & { _token?: string };
    if (data._token) setAccessToken(data._token);
    const { _token: _, ...user } = data;
    return user as User;
  }

  /** Calls the dedicated BFF logout route which clears the HttpOnly cookies. */
  static async logout(): Promise<void> {
    await fetchWithRetry('/api/auth/logout', { method: 'POST' });
    setAccessToken(null);
  }

  /**
   * Request a password-reset email.
   * No auth required — token is omitted automatically when not set.
   */
  static async requestPasswordReset(email: string): Promise<void> {
    const response = await fetchWithRetry(`${BFF_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      let detail = 'Failed to send reset email';
      try {
        const body = await response.json();
        detail = body.detail || body.message || detail;
      } catch { /* ignore */ }
      throw new Error(detail);
    }
  }

  /**
   * Confirm a password reset using the one-time token from the email link.
   * Expects the backend route POST /api/v1/auth/reset-password with body
   * { token, new_password }.
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await fetchWithRetry(`${BFF_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    if (!response.ok) {
      let detail = 'Password reset failed';
      try {
        const body = await response.json();
        detail = body.detail || body.message || detail;
      } catch { /* ignore */ }
      throw new Error(detail);
    }
  }
}
