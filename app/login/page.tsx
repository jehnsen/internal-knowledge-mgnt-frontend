"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell } from "@/components/AuthShell";
import { useAuth } from "@/contexts/AuthContext";

const FIELD_CLASSES = "h-12 rounded-lg border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/30";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: "alice.chen",
    password: "Test1234!",
  });
  const [error, setError] = useState("");
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect once the auth context confirms the user is authenticated.
  // This handles both a successful login and navigating to /login while already
  // signed in.  We wait until authIsLoading is false so we never redirect
  // before the startup session check has completed.
  useEffect(() => {
    if (!authIsLoading && isAuthenticated) {
      const raw = searchParams.get('callbackUrl') || '/search';
      // Only allow relative paths to prevent open-redirect attacks.
      // A valid relative path starts with '/' but NOT '//' (protocol-relative URL).
      const callbackUrl = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/search';
      router.replace(callbackUrl);
    }
  }, [isAuthenticated, authIsLoading, router, searchParams]);

  // Check if user was redirected due to session expiration
  useEffect(() => {
    if (searchParams.get('sessionExpired') === 'true') {
      setSessionExpiredMessage('Your session has expired. Please log in again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(formData.username, formData.password);
      // Navigation is handled reactively by the useEffect watching isAuthenticated.
      // Keep the spinner visible (do not reset isLoading) until the redirect fires.
    } catch (err: any) {
      setError(err.message || "Failed to login. Please check your credentials.");
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <AuthShell>
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="px-0 pb-8">
            <p className="eyebrow mb-3">Welcome to your workspace</p>
            <CardTitle className="text-3xl font-semibold tracking-tight">Welcome back.</CardTitle>
            <CardDescription className="pt-2 text-sm leading-6">Sign in to discover, share, and build on your team’s knowledge.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {sessionExpiredMessage && (
                <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200">
                  <AlertDescription>{sessionExpiredMessage}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="border-destructive/30 bg-destructive/10 text-destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  required
                  disabled={isLoading}
                  className={FIELD_CLASSES}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="rounded text-sm text-primary transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                    className={`${FIELD_CLASSES} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={isLoading}
                    className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-lg text-sm font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Don&apos;t have an account? </span>
                <Link
                  href="/register"
                  className="rounded font-medium text-primary transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthShell><div role="status" aria-label="Loading sign in" className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></AuthShell>}>
      <LoginForm />
    </Suspense>
  );
}
