"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, LogOut, BarChart3, Moon, Sun, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessChat, getRoleDisplayName } from "@/lib/rbac";
import { useTheme } from "next-themes";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const userRole = user?.role as 'guest' | 'employee' | 'admin' | undefined;
  const navItems = [
    { href: "/search", label: "Knowledge search", icon: Search },
    { href: "/chat", label: canAccessChat(userRole) ? "AI workspace" : "Document library", icon: Sparkles },
    { href: "/admin", label: "Management", icon: BarChart3 },
  ];

  if (["/", "/login", "/register", "/forgot-password", "/reset-password"].includes(pathname)) return null;

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8 lg:px-10">
        <Link href="/search" aria-label="Internal Knowledge Management System home"><Brand /></Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><Icon className="h-4 w-4" />{label}</Link>;
          })}
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="Toggle theme" className="relative rounded-full">
            <Sun className="h-4 w-4 dark:hidden" /><Moon className="hidden h-4 w-4 dark:block" />
          </Button>
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto gap-3 border-l pl-3 sm:pl-5" aria-label="Account menu">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">{(user?.full_name || user?.username || "U").split(/\s+/).map(n => n[0]).slice(0, 2).join("").toUpperCase()}</span>
                  <span className="hidden text-left xl:block"><span className="block text-xs font-semibold">{user?.full_name || user?.username}</span><span className="block text-[11px] font-normal text-muted-foreground">{userRole && getRoleDisplayName(userRole)}</span></span>
                  <ChevronDown className="hidden h-3 w-3 text-muted-foreground sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel><span className="block">{user?.full_name || user?.username}</span><span className="block truncate text-xs font-normal text-muted-foreground">{user?.email}</span></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); router.push("/"); }}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : <Link href="/login" className="text-sm font-medium text-primary">Sign in</Link>}
        </div>
      </div>
      <nav aria-label="Mobile navigation" className="flex border-t px-2 lg:hidden">
        {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname.startsWith(href) ? "page" : undefined} className={cn("flex flex-1 items-center justify-center gap-1.5 border-b-2 px-1 py-3 text-[11px] font-medium sm:text-sm", pathname.startsWith(href) ? "border-primary text-primary" : "border-transparent text-muted-foreground")}><Icon className="h-3.5 w-3.5 shrink-0" />{label}</Link>)}
      </nav>
    </header>
  );
}
