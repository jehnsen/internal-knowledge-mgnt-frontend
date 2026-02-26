import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before the imports they affect.
// Vitest hoists vi.mock() calls so the mocked versions are resolved first.
// ---------------------------------------------------------------------------
vi.mock('@/lib/api', () => ({
  AuthAPI: {
    checkSession:   vi.fn(),
    login:          vi.fn(),
    getCurrentUser: vi.fn(),
    logout:         vi.fn(),
    register:       vi.fn(),
  },
}));

vi.mock('@/lib/audit', () => ({
  AuditLog: {
    login:    vi.fn(),
    logout:   vi.fn(),
    register: vi.fn(),
  },
}));

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthAPI } from '@/lib/api';
import { AuditLog } from '@/lib/audit';

// ---------------------------------------------------------------------------
// Helper consumer component — surfaces auth state via data-testid attributes
// and exposes login / logout buttons for user-event interaction.
// ---------------------------------------------------------------------------
function AuthConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(auth.isLoading)}</span>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="username">{auth.user?.username ?? 'none'}</span>
      <span data-testid="error">{auth.sessionInitError ?? 'none'}</span>
      <button onClick={() => auth.login('alice', 'pass')}>login</button>
      <button onClick={() => auth.logout()}>logout</button>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>,
  );
}

// ---------------------------------------------------------------------------
// Session initialisation
// ---------------------------------------------------------------------------
describe('AuthProvider – session initialisation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts in loading state before the session check resolves', () => {
    vi.mocked(AuthAPI.checkSession).mockReturnValue(new Promise(() => {})); // never resolves
    renderWithAuth();
    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it('authenticates the user when checkSession returns a user', async () => {
    vi.mocked(AuthAPI.checkSession).mockResolvedValue({
      id: '1', username: 'alice', role: 'employee',
    } as any);
    renderWithAuth();

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false'),
    );
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('username').textContent).toBe('alice');
    expect(screen.getByTestId('error').textContent).toBe('none');
  });

  it('stays unauthenticated without error when checkSession returns null (not logged in)', async () => {
    vi.mocked(AuthAPI.checkSession).mockResolvedValue(null);
    renderWithAuth();

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false'),
    );
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('error').textContent).toBe('none');
  });

  it('sets sessionInitError when the backend throws (unreachable / 5xx)', async () => {
    vi.mocked(AuthAPI.checkSession).mockRejectedValue(new Error('Service unavailable'));
    renderWithAuth();

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false'),
    );
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('error').textContent).toBe('Service unavailable');
  });

  it('uses a fallback message when the thrown value is not an Error', async () => {
    vi.mocked(AuthAPI.checkSession).mockRejectedValue('raw string error');
    renderWithAuth();

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false'),
    );
    expect(screen.getByTestId('error').textContent).toBe('Service temporarily unavailable.');
  });
});

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
describe('AuthProvider – login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AuthAPI.checkSession).mockResolvedValue(null);
  });

  it('sets the user and clears sessionInitError after a successful login', async () => {
    const user = userEvent.setup();
    const mockUser = { id: '2', username: 'bob', role: 'admin' };
    vi.mocked(AuthAPI.login).mockResolvedValue(undefined as any);
    vi.mocked(AuthAPI.getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(AuditLog.login).mockResolvedValue(undefined as any);

    renderWithAuth();
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false'),
    );

    await user.click(screen.getByText('login'));

    await waitFor(() =>
      expect(screen.getByTestId('username').textContent).toBe('bob'),
    );
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('error').textContent).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
describe('AuthProvider – logout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clears the user after logout', async () => {
    const user = userEvent.setup();
    vi.mocked(AuthAPI.checkSession).mockResolvedValue({
      id: '1', username: 'alice', role: 'employee',
    } as any);
    vi.mocked(AuthAPI.logout).mockResolvedValue(undefined as any);
    vi.mocked(AuditLog.logout).mockReturnValue(undefined as any);

    renderWithAuth();
    await waitFor(() =>
      expect(screen.getByTestId('authenticated').textContent).toBe('true'),
    );

    await user.click(screen.getByText('logout'));

    await waitFor(() =>
      expect(screen.getByTestId('authenticated').textContent).toBe('false'),
    );
    expect(screen.getByTestId('username').textContent).toBe('none');
  });
});
