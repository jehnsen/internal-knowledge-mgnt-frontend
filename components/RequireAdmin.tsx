"use client";

import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface RequireAdminProps {
  children: React.ReactNode;
}

/**
 * Gates admin-only pages (Users, Audit Logs, GDPR & Privacy) whose backend
 * endpoints require the 'admin' role. Editors/viewers are authenticated and
 * can reach these routes via ProtectedRoute, but the backend returns 403 for
 * them — show that clearly instead of a misleading empty state.
 */
export function RequireAdmin({ children }: RequireAdminProps) {
  const { user } = useAuth();

  if (user && user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold mb-1">Admin access required</h2>
        <p className="text-muted-foreground max-w-sm">
          Your account ({user.role ?? "unknown"} role) doesn&apos;t have permission to view this page.
          Contact an administrator if you need access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
