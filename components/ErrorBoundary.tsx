"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Optional custom fallback rendered instead of the default error UI. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    // Report to Sentry when a DSN is configured; no-op otherwise
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 p-4">
        <div className="max-w-md w-full bg-white/95 rounded-2xl shadow-2xl border border-white/50 p-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center shadow-lg">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-800">Something went wrong</h1>
            <p className="text-slate-500 text-sm">
              An unexpected error occurred. You can try again or reload the page.
            </p>
          </div>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="text-left bg-slate-100 rounded-lg p-3 text-xs text-red-700 overflow-auto max-h-40 whitespace-pre-wrap break-words">
              {this.state.error.message}
            </pre>
          )}

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={this.handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
            <Button onClick={() => window.location.assign("/")}>
              Go to home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
