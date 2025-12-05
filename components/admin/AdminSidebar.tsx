"use client";

import { usePathname, useRouter } from "next/navigation";
import { BarChart3, FileText, Users, Tag, FileWarning, Shield, Key, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const sidebarItems = [
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { id: "documents", label: "Documents", icon: FileText, path: "/admin/documents" },
  { id: "users", label: "Users", icon: Users, path: "/admin/users" },
  { id: "keywords", label: "Keywords", icon: Tag, path: "/admin/keywords" },
  { id: "gaps", label: "Knowledge Gaps", icon: FileWarning, path: "/admin/gaps" },
  { id: "audit", label: "Audit Logs", icon: Shield, path: "/admin/audit" },
  { id: "gdpr", label: "GDPR & Privacy", icon: Key, path: "/admin/gdpr" },
];

interface AdminSidebarProps {
  onRefresh?: () => void;
}

export function AdminSidebar({ onRefresh }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0">
      <div className="p-6">
        {/* <h2 className="text-lg font-bold mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Admin Dashboard
        </h2>
        <p className="text-xs text-muted-foreground mb-6">
          System Management
        </p> */}

        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
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
