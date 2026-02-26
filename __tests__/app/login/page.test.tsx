import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter:      () => ({ replace: mockReplace }),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/app/login/page';

// ---------------------------------------------------------------------------
// Helper to configure the auth context mock for each test
// ---------------------------------------------------------------------------
function mockAuth(overrides: {
  isAuthenticated?: boolean;
  isLoading?: boolean;
} = {}) {
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    sessionInitError: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    ...overrides,
  } as any);
}

// ---------------------------------------------------------------------------
// callbackUrl redirect logic
// ---------------------------------------------------------------------------
describe('LoginPage – callbackUrl redirect', () => {
  beforeEach(() => vi.clearAllMocks());

  it('redirects to /search when no callbackUrl param is present', async () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as any);
    mockAuth({ isAuthenticated: true });

    render(<LoginPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/search'));
  });

  it('redirects to a valid relative callbackUrl', async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('callbackUrl=/documents/42') as any,
    );
    mockAuth({ isAuthenticated: true });

    render(<LoginPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/documents/42'));
  });

  it('falls back to /search for an absolute HTTP URL (open-redirect prevention)', async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('callbackUrl=https://evil.com') as any,
    );
    mockAuth({ isAuthenticated: true });

    render(<LoginPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/search'));
  });

  it('falls back to /search for a protocol-relative URL (//evil.com)', async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      // URLSearchParams auto-encodes so pass the raw value via the object form
      new URLSearchParams({ callbackUrl: '//evil.com/steal' }) as any,
    );
    mockAuth({ isAuthenticated: true });

    render(<LoginPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/search'));
  });

  it('falls back to /search for an empty string callbackUrl', async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams({ callbackUrl: '' }) as any,
    );
    mockAuth({ isAuthenticated: true });

    render(<LoginPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/search'));
  });
});

// ---------------------------------------------------------------------------
// Guard: must not redirect before auth loading completes or when not signed in
// ---------------------------------------------------------------------------
describe('LoginPage – redirect guards', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not redirect while auth is still loading', () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as any);
    mockAuth({ isAuthenticated: true, isLoading: true });

    render(<LoginPage />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('does not redirect when the user is not authenticated', () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as any);
    mockAuth({ isAuthenticated: false });

    render(<LoginPage />);

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
