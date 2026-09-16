import Link from "next/link";
import { ArrowLeft, BookOpen, Quote, Sparkles } from "lucide-react";
import { Brand } from "@/components/Brand";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[0.95fr_1.05fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#132f28] p-12 text-white lg:flex xl:p-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(72,140,108,0.22),transparent_65%)]" aria-hidden="true" />
        <Link href="/" className="relative w-fit"><Brand inverse /></Link>
        <div className="relative my-16 max-w-md">
          <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-[11px] text-emerald-200"><Sparkles className="h-3.5 w-3.5" />Powered by RAG</span>
          <h2 className="text-4xl font-medium leading-[1.2] tracking-tight xl:text-5xl">Your team’s knowledge.<br /><span className="text-emerald-200/80">Working together.</span></h2>
          <p className="mt-6 text-sm leading-7 text-white/60">A considered space for shared expertise. Find the right information and turn it into your next informed decision.</p>
          <div className="mt-12 space-y-5 border-t border-white/15 pt-7">{[{ icon: BookOpen, text: "Your documents, in one place" }, { icon: Sparkles, text: "Contextual answers to real questions" }, { icon: Quote, text: "Source citations you can explore" }].map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-3 text-xs text-white/75"><Icon className="h-4 w-4 text-emerald-200/80" strokeWidth={1.5} />{text}</div>)}</div>
        </div>
        <p className="relative text-[11px] text-white/40">Internal Knowledge Management System</p>
      </aside>
      <div className="flex min-w-0 flex-col px-5 py-8 sm:px-12">
        <Link href="/" className="mb-8 flex w-fit items-center gap-2 text-xs text-muted-foreground hover:text-primary"><ArrowLeft className="h-3.5 w-3.5" />Back to home</Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6"><div className="mb-8 lg:hidden"><Brand /></div>{children}</div>
        <p className="mt-8 text-center text-[11px] text-muted-foreground">Shared knowledge. Informed decisions.</p>
      </div>
    </div>
  );
}
