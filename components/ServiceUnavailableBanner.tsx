"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Renders a top-of-screen banner when the startup session check fails for a
 * reason other than "not logged in" (e.g. backend unreachable or 5xx).
 * The user can dismiss it once they have seen the message.
 */
export function ServiceUnavailableBanner() {
  const { sessionInitError } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!sessionInitError || dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-medium text-white"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>Service temporarily unavailable — {sessionInitError}</span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="ml-2 rounded p-0.5 hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
