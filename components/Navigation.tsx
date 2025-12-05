"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, Search, Upload, User, LogOut, Shield, BarChart3, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleDisplayName, getRoleColor } from "@/lib/rbac";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const userRole = user?.role as 'guest' | 'employee' | 'admin' | undefined;

  const navItems = [
    { href: "/search", label: "Search", icon: Search },
    { href: "/chat", label: "Chat", icon: Bot },
    { href: "/admin", label: "Dashboard", icon: BarChart3 },
  ];

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Don't show navigation on landing/login/register pages
  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <nav className="border-b bg-gradient-to-r from-background via-background to-primary/5 backdrop-blur-sm supports-[backdrop-filter]:bg-background/95 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/search" className="flex items-center gap-2 group">
              <div className="p-2 bg-gradient-to-br from-red-600 to-red-400 rounded-lg shadow-lg group-hover:shadow-xl transition-all">
                <Bot className="h-5 w-5 text-white" />
              </div>
              {/* <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Knowledge Hub
              </span> */}
              <span className="font-bold text-xl bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                Access Hire Australia
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "gap-2 transition-all",
                        isActive && "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="rounded-full hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10 transition-all"
                >
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10 transition-all"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{user?.full_name || user?.username}</span>
                        </div>
                        <span className="text-xs text-muted-foreground font-normal">
                          {user?.email}
                        </span>
                        {userRole && (
                          <Badge className={cn("w-fit text-white", getRoleColor(userRole))}>
                            {userRole === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                            {getRoleDisplayName(userRole)}
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/login">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
