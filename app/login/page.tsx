"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthBackground } from "@/components/AuthBackground";
import { useAuth } from "@/contexts/AuthContext";

/**
 * The auth screens commit to a dark canvas regardless of the app theme — the
 * backdrop is the design, and inverting it would gut it. Every control below
 * therefore carries explicit light-on-dark colours rather than relying on the
 * theme tokens, which resolve to the light palette here.
 */
const FIELD_CLASSES =
  "h-11 rounded-lg border-white/10 bg-white/[0.06] text-slate-100 shadow-inner shadow-black/20 " +
  "placeholder:text-slate-500 transition-colors " +
  "hover:border-white/20 focus-visible:border-indigo-400/50 focus-visible:ring-2 focus-visible:ring-indigo-400/40";

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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
      <AuthBackground />

      <div className="relative z-10 w-full max-w-md animate-slide-in-from-bottom">
        {/* Rotating conic sheen behind the card edge. The inner square is
            oversized so its corners always sweep past the card's diagonal. */}
        <div className="absolute -inset-px overflow-hidden rounded-2xl bg-white/10">
          <div className="absolute left-1/2 top-1/2 aspect-square w-[220%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(129,140,248,0.85)_50deg,transparent_130deg,transparent_230deg,rgba(34,211,238,0.7)_290deg,transparent_360deg)] motion-safe:animate-spin-slow" />
        </div>

        <Card className="relative rounded-2xl border-0 bg-slate-950/70 shadow-2xl shadow-indigo-950/60 backdrop-blur-2xl">
          {/* Specular highlight along the top edge — the glass tell */}
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

          <CardHeader className="space-y-4 pb-4 text-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-indigo-500/25 blur-xl motion-safe:animate-glow-breathe" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-indigo-500/40 ring-1 ring-white/20">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <CardTitle className="bg-gradient-to-b from-white to-slate-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
                Welcome back
              </CardTitle>
              <CardDescription className="text-base text-slate-400">
                Sign in to your knowledge base
              </CardDescription>
            </div>

            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-indigo-200">
                <Sparkles className="h-3 w-3" />
                AI-powered retrieval with cited sources
              </span>
            </div>
          </CardHeader>

          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {sessionExpiredMessage && (
                <Alert className="border-amber-400/30 bg-amber-400/10 text-amber-200">
                  <AlertDescription>{sessionExpiredMessage}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="border-red-400/30 bg-red-500/10 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">
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
                  <Label htmlFor="password" className="text-slate-300">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="rounded text-sm text-indigo-300 transition-colors hover:text-indigo-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                    tabIndex={-1}
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
                    className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-slate-400 transition-colors hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:brightness-110 disabled:opacity-60"
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
                <span className="text-slate-400">Don&apos;t have an account? </span>
                <Link
                  href="/register"
                  className="rounded font-medium text-indigo-300 transition-colors hover:text-indigo-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      // Matches the dark auth canvas so the swap to the real form isn't a flash.
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <AuthBackground />
        <div className="relative z-10 h-8 w-8 animate-spin rounded-full border-4 border-indigo-400 border-t-transparent" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
