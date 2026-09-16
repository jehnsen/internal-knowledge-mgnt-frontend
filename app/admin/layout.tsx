"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="flex flex-col md:flex-row">
          <AdminSidebar />
          <div className="min-w-0 flex-1 p-4 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
