"use client";

import { usePathname, useRouter } from "next/navigation";
import { BarChart3, FileText, Users, Tag, FileWarning, Shield, Key, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const sidebarItems = [
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/admin/analytics", adminOnly: false },
  { id: "documents", label: "Documents", icon: FileText, path: "/admin/documents", adminOnly: false },
  { id: "users", label: "Users", icon: Users, path: "/admin/users", adminOnly: true },
  { id: "keywords", label: "Keywords", icon: Tag, path: "/admin/keywords", adminOnly: false },
  { id: "gaps", label: "Knowledge Gaps", icon: FileWarning, path: "/admin/gaps", adminOnly: false },
  { id: "audit", label: "Audit Logs", icon: Shield, path: "/admin/audit", adminOnly: true },
  { id: "gdpr", label: "GDPR & Privacy", icon: Key, path: "/admin/gdpr", adminOnly: true },
];

interface AdminSidebarProps {
  onRefresh?: () => void;
}

export function AdminSidebar({ onRefresh }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const visibleItems = sidebarItems.filter((item) => !item.adminOnly || user?.role === "admin");

  return (
    <aside className="w-full shrink-0 border-b bg-card md:sticky md:top-20 md:h-[calc(100dvh-80px)] md:w-56 md:overflow-y-auto md:border-b-0 md:border-r">
      <div className="p-3 md:p-5">

        <p className="eyebrow mb-5 hidden px-3 pt-3 md:block">Management</p>
        <nav aria-label="Management navigation" className="flex gap-1 overflow-x-auto md:block md:space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={cn(
                  "shrink-0 md:w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {onRefresh && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="w-full gap-2"
            >
              <Activity className="h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
