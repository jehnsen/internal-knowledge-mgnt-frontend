import { Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", inverse ? "bg-white/10 text-emerald-300 ring-1 ring-white/15" : "bg-primary text-primary-foreground")}>
        <Layers3 className="h-5 w-5" strokeWidth={1.7} />
      </span>
      <span className="min-w-0">
        <span className={cn("block text-sm font-semibold tracking-tight sm:text-base", inverse && "text-white")}>Internal Knowledge</span>
        <span className={cn("block text-[10px] font-medium uppercase tracking-[0.2em]", inverse ? "text-slate-400" : "text-muted-foreground")}>Management System</span>
      </span>
    </span>
  );
}
