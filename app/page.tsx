"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, BookOpen, FileText, Search, Sparkles, ShieldCheck, Layers3, Quote, ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/Brand";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  useEffect(() => { if (!isLoading && isAuthenticated) router.replace("/search"); }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" aria-label="Internal Knowledge Management System home"><Brand /></Link>
          <div className="flex items-center gap-6"><a href="#how-it-works" className="hidden text-sm text-muted-foreground hover:text-foreground md:block">How it works</a><Link href="/login" className={buttonVariants({ variant: "outline" })}>Sign in <ArrowUpRight className="h-4 w-4" /></Link></div>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
        <div>
          <span className="eyebrow mb-7 inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Your organization. Connected.</span>
          <h1 className="text-4xl font-semibold leading-[1.12] tracking-[-0.045em] sm:text-6xl lg:text-[68px]">Collective knowledge.<br /><span className="text-primary">Clear answers.</span></h1>
          <p className="mt-7 max-w-lg text-base leading-8 text-muted-foreground sm:text-lg">Bring your team’s knowledge into focus. Discover documents, ask better questions, and get AI-powered answers grounded in your internal sources.</p>
          <div className="mt-9 flex flex-wrap gap-3"><Link href="/login" className={buttonVariants({ size: "lg", className: "h-12" })}>Open your workspace <ArrowRight className="h-4 w-4" /></Link><Link href="/register" className={buttonVariants({ variant: "outline", size: "lg", className: "h-12" })}>Create an account</Link></div>
          <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="h-4 w-4 text-primary" />Powered by Retrieval-Augmented Generation</div>
        </div>
        <div className="relative">
          <div className="knowledge-grid absolute -inset-5 rounded-[2rem] opacity-60" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-2xl border bg-card shadow-[0_24px_80px_-30px_rgba(15,50,40,0.28)]">
            <div className="flex items-center justify-between border-b px-6 py-4"><span className="flex items-center gap-2 text-xs font-semibold"><Layers3 className="h-4 w-4 text-primary" />Knowledge workspace</span><span className="rounded border px-2 py-0.5 text-[10px] text-muted-foreground">Illustrative preview</span></div>
            <div className="space-y-5 p-5 sm:p-7">
              <div className="flex items-center gap-3 rounded-xl border bg-background p-4 text-sm"><Search className="h-4 w-4 shrink-0 text-primary" />How do I get started with onboarding?</div>
              <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="h-4 w-4" />An answer with context</div>
                <p className="text-sm leading-7 text-foreground/80">Start with the team handbook, review your department’s getting-started guide, and complete the onboarding checklist.</p>
                <div className="mt-5 flex items-center gap-2 border-t border-primary/15 pt-4 text-xs text-primary"><Quote className="h-3.5 w-3.5" />Follow the answer back to its source</div>
              </div>
              <div className="space-y-2"><p className="eyebrow mb-3">Source documents</p>{["Team handbook", "Onboarding checklist"].map((title, i) => <div key={title} className="flex items-center gap-3 rounded-lg border p-3"><span className="rounded-lg bg-muted p-2"><FileText className="h-4 w-4 text-muted-foreground" /></span><span className="flex-1 text-xs font-medium">{title}</span><span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span></div>)}</div>
            </div>
            <div className="border-t bg-muted/40 px-6 py-3 text-[11px] text-muted-foreground">Retrieve relevant knowledge. Generate a useful answer. Verify the source.</div>
          </div>
        </div>
      </section>
      <section id="how-it-works" className="border-y bg-card">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow mb-2">Built for shared understanding</p><h2 className="text-2xl font-semibold tracking-tight">From information to insight.</h2></div><span className="text-sm text-muted-foreground">One place for the knowledge that moves work forward.</span></div>
          <div className="grid gap-8 md:grid-cols-3">{[
            { icon: BookOpen, title: "A connected knowledge base", text: "Organize documents and make your team’s expertise easier to discover." },
            { icon: Sparkles, title: "Answers grounded in sources", text: "Ask in your own words, explore the response, and inspect the cited evidence." },
            { icon: ShieldCheck, title: "Access that fits your team", text: "Work with role-based permissions for readers, contributors, and administrators." },
          ].map(({ icon: Icon, title, text }, i) => <div key={title} className="border-t pt-5"><div className="mb-5 flex items-center justify-between"><Icon className="h-5 w-5 text-primary" strokeWidth={1.5} /><span className="font-mono text-xs text-muted-foreground">0{i + 1}</span></div><h3 className="mb-2 text-sm font-semibold">{title}</h3><p className="max-w-sm text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div>
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-7 text-xs text-muted-foreground sm:flex-row sm:px-8"><span>Internal Knowledge Management System</span><span>Shared knowledge. Informed decisions.</span></footer>
    </div>
  );
}
