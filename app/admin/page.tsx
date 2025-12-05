"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/LoadingState";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to analytics by default
    router.push('/admin/analytics');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingState message="Redirecting to analytics..." />
    </div>
  );
}
