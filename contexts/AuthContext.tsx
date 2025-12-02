"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthAPI, User } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string, fullName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const loadUser = async () => {
      if (AuthAPI.isAuthenticated()) {
        try {
          const currentUser = await AuthAPI.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Silently handle authentication errors (token expired, etc.)
          // Just clear the invalid token
          AuthAPI.logout();
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    await AuthAPI.login({ username, password });
    const currentUser = await AuthAPI.getCurrentUser();
    setUser(currentUser);
  };

  const logout = () => {
    AuthAPI.logout();
    setUser(null);
  };

  const register = async (username: string, email: string, password: string, fullName: string) => {
    const newUser = await AuthAPI.register({
      username,
      email,
      password,
      full_name: fullName,
    });
    // Auto-login after registration
    await login(username, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
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
