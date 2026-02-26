"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthAPI, User } from "@/lib/api";
import { AuditLog } from "@/lib/audit";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /**
   * Set when the startup session check fails for a reason other than "not
   * logged in" — e.g. the backend is unreachable or timed out.
   * Components can surface this as a banner so users know the service is
   * temporarily unavailable rather than silently ending up on the login page.
   */
  sessionInitError: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string, fullName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionInitError, setSessionInitError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        // checkSession returns null (not an error) when the user simply isn't
        // logged in, and throws only for genuine failures (network, 5xx).
        const currentUser = await AuthAPI.checkSession();
        if (currentUser) setUser(currentUser);
      } catch (err) {
        // Backend unreachable, timed out, or returned an unexpected 5xx.
        // Do NOT redirect to login — that would be misleading.
        const message =
          err instanceof Error ? err.message : 'Service temporarily unavailable.';
        setSessionInitError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // When a direct backend call receives a 401 mid-session, _http.ts dispatches
    // this event instead of hard-navigating.  Clearing the user here lets
    // ProtectedRoute redirect to login in the normal React way.
    const handleSessionExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth:sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('auth:sessionExpired', handleSessionExpired);
  }, []);

  const login = async (username: string, password: string) => {
    await AuthAPI.login({ username, password });
    const currentUser = await AuthAPI.getCurrentUser();
    setUser(currentUser);
    setSessionInitError(null);

    // Log audit event for successful login
    await AuditLog.login(currentUser.id, currentUser.username);
  };

  const logout = async () => {
    // Fire audit event first (cookie is still valid at this point)
    if (user) {
      AuditLog.logout(user.id, user.username);
    }

    // Clear HttpOnly cookies server-side, then clear client state
    await AuthAPI.logout();
    setUser(null);
  };

  const register = async (username: string, email: string, password: string, fullName: string) => {
    const newUser = await AuthAPI.register({
      username,
      email,
      password,
      full_name: fullName,
    });

    // Log audit event for registration
    await AuditLog.register(newUser.id, newUser.username, newUser.email);

    // Auto-login after registration
    await login(username, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        sessionInitError,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
