"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Brain,
  Shield,
  Zap,
  Search,
  Upload,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Lock,
  BarChart,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to search if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/search");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                KnowledgeHub
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-24">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="mb-6 px-4 py-2 text-sm animate-fade-in" variant="outline">
            <Sparkles className="h-3 w-3 mr-2 inline" />
            Powered by Advanced AI & RAG Technology
          </Badge>

          <h1 className="text-6xl md:text-7xl text-red-500 font-bold mb-6 animate-slide-in-from-bottom">
            Access Group
            <span className="block mt-2 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent animate-slide-in-from-bottom [animation-delay:100ms]">
             NetSuite-Iterable Integration
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-slide-in-from-bottom [animation-delay:200ms]">
            Upload documents, ask questions, and get instant AI-powered answers with precise citations.
            Transform your internal knowledge into actionable insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-from-bottom [animation-delay:300ms]">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 hover:scale-105 transition-all">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover:scale-105 transition-all">
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto animate-fade-in [animation-delay:400ms]">
            <div>
              <div className="text-3xl font-bold text-primary">10x</div>
              <div className="text-sm text-muted-foreground">Faster Search</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">99%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="secondary">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need for
              <span className="block mt-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Smart Knowledge Management
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Powered Search",
                description: "Semantic search understands context and meaning, not just keywords.",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: MessageSquare,
                title: "Smart Citations",
                description: "Every answer includes references to source documents with relevance scores.",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: Upload,
                title: "Easy Upload",
                description: "Drag and drop documents in any format. We handle the rest automatically.",
                gradient: "from-orange-500 to-red-500"
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-level encryption and access controls protect your sensitive data.",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Get answers in milliseconds with our optimized vector search engine.",
                gradient: "from-yellow-500 to-orange-500"
              },
              {
                icon: BarChart,
                title: "Analytics Dashboard",
                description: "Track usage, popular queries, and knowledge gaps with detailed insights.",
                gradient: "from-indigo-500 to-purple-500"
              }
            ].map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-border hover:border-primary/50 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${feature.gradient} p-2.5 mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-full w-full text-white" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="secondary">How It Works</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Get Started in
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"> 3 Simple Steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary to-purple-600"></div>

            {[
              {
                step: "1",
                icon: Upload,
                title: "Upload Documents",
                description: "Drag and drop your company documents, PDFs, presentations, or text files."
              },
              {
                step: "2",
                icon: Search,
                title: "Ask Questions",
                description: "Use natural language to ask anything about your uploaded documents."
              },
              {
                step: "3",
                icon: Brain,
                title: "Get Smart Answers",
                description: "Receive AI-generated answers with citations pointing to exact sources."
              }
            ].map((item, index) => (
              <div key={index} className="text-center relative animate-slide-in-from-bottom" style={{ animationDelay: `${index * 150}ms` }}>
                <div className="relative inline-block mb-6">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-purple-600 p-0.5 mx-auto">
                    <div className="h-full w-full rounded-full bg-background flex items-center justify-center">
                      <item.icon className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4" variant="secondary">Benefits</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Why Teams Love
                <span className="block mt-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  KnowledgeHub
                </span>
              </h2>
              <div className="space-y-4">
                {[
                  "Reduce time spent searching for information by 80%",
                  "Onboard new team members 3x faster",
                  "Break down knowledge silos across departments",
                  "Never lose critical institutional knowledge",
                  "Ensure compliance with accurate documentation",
                  "Scale your support team without hiring"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 animate-slide-in-from-left" style={{ animationDelay: `${index * 100}ms` }}>
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-lg">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Card className="p-8 animate-slide-in-from-right">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Enterprise-Grade Security</h3>
                      <p className="text-sm text-muted-foreground">SOC 2 Type II Certified</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Unlimited Users</h3>
                      <p className="text-sm text-muted-foreground">Scale without limits</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">99.9% Uptime SLA</h3>
                      <p className="text-sm text-muted-foreground">Always available</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary to-purple-600 border-0 text-primary-foreground overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <CardContent className="p-12 relative z-10">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
                Ready to Transform Your Knowledge Management?
              </h2>
              <p className="text-xl mb-8 opacity-90 animate-fade-in [animation-delay:100ms]">
                Join thousands of teams already using KnowledgeHub
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in [animation-delay:200ms]">
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-6 hover:scale-105 transition-all">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white/10 hover:bg-white/20 border-white/30 hover:scale-105 transition-all">
                    Sign In
                  </Button>
                </Link>
              </div>
              <p className="text-sm mt-6 opacity-75">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="font-bold">KnowledgeHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 KnowledgeHub. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
