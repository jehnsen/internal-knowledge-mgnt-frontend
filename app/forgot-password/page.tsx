"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { BookOpen, Loader2, MailCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthAPI } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await AuthAPI.requestPasswordReset(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <Card className="w-full border-0 bg-transparent shadow-none">
        <CardHeader className="space-y-3 px-0 pb-7">
          <div className="flex justify-start pb-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              {submitted ? (
                <MailCheck className="h-8 w-8 text-white" />
              ) : (
                <BookOpen className="h-8 w-8 text-white" />
              )}
            </div>
          </div>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            {submitted ? "Check your email" : "Forgot password?"}
          </CardTitle>
          <CardDescription className="text-base">
            {submitted
              ? "If that email address is registered, you'll receive a reset link shortly."
              : "Enter your email and we'll send you a reset link."}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {submitted ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Didn't receive an email? Check your spam folder or{" "}
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setEmail(""); }}
                  className="text-primary hover:underline"
                >
                  try again
                </button>
                .
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">Back to login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>

              <div className="text-center text-sm">
                <Link href="/login" className="text-primary hover:underline">
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
