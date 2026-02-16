import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/AuthContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  TrendingUp,
  BookOpen,
  Brain,
  BarChart3,
  Upload,
  FileText,
  CheckCircle2,
  Target,
  Activity,
  Shield,
  X,
  Check,
  ChevronRight,
  Menu,
  Calendar,
  LineChart,
  AlertTriangle,
  Lightbulb,
  Zap,
  LogIn
} from 'lucide-react';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20">

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="font-bold text-primary-foreground text-sm tracking-tight">TJ</span>
              </div>
              <span className="font-bold text-lg tracking-tight">TraderJNL</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                How it works
              </button>
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </button>
              <button onClick={() => scrollToSection('faq')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </button>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <Link to="/Home">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/Login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/Signup">
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      Start free trial
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border py-4 space-y-3 bg-background">
              <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg">
                How it works
              </button>
              <button onClick={() => scrollToSection('features')} className="block w-full text-left px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg">
                Features
              </button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg">
                Pricing
              </button>
              <button onClick={() => scrollToSection('faq')} className="block w-full text-left px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg">
                FAQ
              </button>
              <div className="px-4 pt-4 space-y-3 border-t border-border mt-2">
                {isAuthenticated ? (
                  <Link to="/Home" className="block">
                    <Button className="w-full justify-center bg-primary hover:bg-primary/90 text-primary-foreground">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/Login" className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-center"
                      >
                        Sign in
                      </Button>
                    </Link>
                    <Link to="/Signup" className="block">
                      <Button
                        className="w-full justify-center bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Start free trial
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                New: AI Market Analysis
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                  Journal your trades.
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                  Master your discipline.
                </span>
              </h1>

              <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                TraderJNL is the professional trading journal built for serious futures and forex traders. Track verified performance, execution quality, and psychology — not just P&L.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link to="/Signup">
                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 w-full sm:w-auto"
                  >
                    Start 7-day free trial
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg border-primary/20 hover:bg-primary/5 w-full sm:w-auto"
                  onClick={() => scrollToSection('how-it-works')}
                >
                  See how it works
                </Button>
              </div>

              {/* Trust Chips */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                {[
                  "Built for futures & forex",
                  "Verified metrics",
                  "Discipline first",
                  "Multi-account"
                ].map((text) => (
                  <span key={text} className="inline-flex items-center gap-2 px-4 py-2 bg-muted/30 text-muted-foreground rounded-full text-sm font-medium border border-border/50">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Product Mock */}
            <div className="hidden lg:block relative z-10">
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-50" />

                <div className="relative space-y-6">
                  {/* PANEL 1: Coach Sam */}
                  <div className="bg-card/50 backdrop-blur-xl rounded-2xl border border-border/50 p-6 shadow-2xl animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <Brain className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">Coach Sam</h4>
                        <p className="text-xs text-muted-foreground">Performance support</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Coach Sam</p>
                        <p className="text-sm">"Before your next session, what's your one rule today?"</p>
                      </div>
                      <div className="bg-primary/10 text-primary rounded-xl p-4 ml-8 border border-primary/20">
                        <p className="text-sm text-right">"Max 2 trades. Stop after first mistake."</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                      <Shield className="w-3 h-3 text-primary" />
                      Performance psychology support, not therapy.
                    </div>
                  </div>

                  {/* PANEL 2: Verified Journal Workflow */}
                  <div className="bg-card/50 backdrop-blur-xl rounded-2xl border border-border/50 p-6 shadow-2xl animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 translate-x-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-bold">Verified Session</span>
                      </div>
                      <span className="text-xs font-mono text-green-500 bg-green-500/10 px-2 py-1 rounded">+$160.00</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs py-2 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          <span className="text-muted-foreground">ES • Buy</span>
                        </div>
                        <span className="text-green-500 font-medium">+$120.00</span>
                      </div>
                      <div className="flex justify-between text-xs py-2 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          <span className="text-muted-foreground">NQ • Sell</span>
                        </div>
                        <span className="text-red-500 font-medium">-$45.00</span>
                      </div>
                      <div className="flex justify-between text-xs py-2">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          <span className="text-muted-foreground">ES • Buy</span>
                        </div>
                        <span className="text-green-500 font-medium">+$85.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prop Trader Hook */}
      <section className="py-24 bg-muted/20 border-y border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
              Most traders don't fail on strategy.<br />
              <span className="text-primary">They fail on behavior.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Pain Points */}
            <div className="bg-gradient-to-br from-red-500/5 to-transparent rounded-3xl p-8 border border-red-500/10 hover:border-red-500/20 transition-all">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                Sound familiar?
              </h3>
              <ul className="space-y-6">
                {[
                  "You trade well… until you get tilted",
                  "One rule break turns into five more trades",
                  "You buy another prop account instead of fixing process",
                  "You can't clearly explain why you won or lost"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5 flex-shrink-0"></div>
                    <span className="text-muted-foreground text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution */}
            <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-3xl p-8 border border-primary/10 hover:border-primary/20 transition-all">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                The TraderJNL Standard:
              </h3>
              <ul className="space-y-6">
                {[
                  "Confirm trade lines and totals so metrics stay accurate",
                  "Track discipline and triggers alongside results",
                  "Save evidence (before/after) so you can review decisions",
                  "Use Coach Sam to reflect and reset without hype"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <span className="text-muted-foreground text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              A complete session workflow.<br className="hidden md:block" />Nothing disappears.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Log your session",
                desc: "Upload a screenshot, CSV, or PDF. TraderJNL extracts what it can and shows exactly what was detected.",
                icon: Upload,
                tag: "Quick upload",
                color: "text-blue-500"
              },
              {
                step: "2",
                title: "Confirm accuracy",
                desc: "Edit trade lines, correct anything wrong, and confirm totals. Verified entries power your dashboard.",
                icon: CheckCircle2,
                tag: "Verified data",
                color: "text-green-500"
              },
              {
                step: "3",
                title: "Reflect with Coach",
                desc: "Answer structured questions to review discipline, psychology, and decision quality.",
                icon: Brain,
                tag: "AI coaching",
                color: "text-purple-500"
              },
              {
                step: "4",
                title: "Save evidence",
                desc: "Add before/after screenshots with comments. Once completed, TraderJNL generates a permanent recap.",
                icon: FileText,
                tag: "Full history",
                color: "text-orange-500"
              }
            ].map((item, i) => (
              <div key={i} className="bg-card/50 backdrop-blur border border-border/50 p-8 rounded-2xl hover:bg-muted/50 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-xl font-bold text-foreground">{item.step}</span>
                </div>
                <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {item.desc}
                </p>
                <div className={`flex items-center gap-2 text-xs font-semibold ${item.color}`}>
                  <item.icon className="w-3.5 h-3.5" />
                  {item.tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Features built for performance
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Journal & Sessions",
                features: ["Session Workspace with draft mode", "Trade line confirmation", "Evidence storage (Before/After)"]
              },
              {
                icon: BarChart3,
                title: "Verified Performance",
                features: ["Metrics from completed sessions only", "Equity Growth + Markers", "Tooltips on every metric"]
              },
              {
                icon: Shield,
                title: "Account Discipline",
                features: ["Behavioral trend score", "Trigger & Tilt detection", "Suggested weekly focus"]
              },
              {
                icon: Brain,
                title: "AI Market Analysis",
                features: ["Structured market breakdown", "Bias & Invalidation levels", "Historical context saving"]
              },
              {
                icon: Zap,
                title: "Coach Sam",
                features: ["Performance psychology support", "Prop & Finance accountability mode", "Structured reflection"]
              },
              {
                icon: Target,
                title: "Prop Tools",
                features: ["Account Spend tracking", "14-day Purchase Freeze logic", "Reset tracking"]
              }
            ].map((group, i) => (
              <div key={i} className="bg-card border border-border p-8 rounded-3xl hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <group.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold">{group.title}</h3>
                </div>
                <ul className="space-y-3">
                  {group.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary/50 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">One plan. Built for serious traders.</h2>
            <p className="text-muted-foreground">Everything included. No tiers, no hidden fees.</p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="relative bg-card rounded-[2rem] border border-border p-8 md:p-12 shadow-2xl">
              {/* Highlight Effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-[2rem] pointer-events-none" />

              <div className="text-center mb-8 relative">
                <h3 className="text-2xl font-bold mb-4">Pro Access</h3>
                <div className="mb-2">
                  <span className="text-sm font-semibold text-primary uppercase tracking-wide bg-primary/10 px-3 py-1 rounded-full">
                    7-day free trial
                  </span>
                  <div className="mt-6 flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-foreground">$29</span>
                    <span className="text-lg text-muted-foreground">/mo</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-10 relative">
                {[
                  "Unlimited sessions & journals",
                  "Verified dashboard + calendar",
                  "Full AI Coach Sam access",
                  "Advanced Discipline analytics",
                  "Market Analysis & Evidence",
                  "Multi-account support"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <Link to="/Signup">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-14 text-base shadow-xl shadow-blue-600/20 rounded-xl relative z-10"
                >
                  Start 7-day free trial
                </Button>
              </Link>

              <p className="text-center text-xs text-muted-foreground mt-6 relative z-10">
                Cancel anytime in one click. No questions asked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-muted/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-card border border-border/50 rounded-xl px-6 data-[state=open]:border-primary/50 transition-colors">
              <AccordionTrigger className="text-left font-medium hover:no-underline hover:text-primary">
                Is TraderJNL financial advice?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                No. TraderJNL is an educational journaling and accountability tool. We do not provide signals, trade recommendations, or financial advice. The goal is to help you analyze your own performance and behavior.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card border border-border/50 rounded-xl px-6 data-[state=open]:border-primary/50 transition-colors">
              <AccordionTrigger className="text-left font-medium hover:no-underline hover:text-primary">
                Can I really cancel anytime?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                Yes. You can cancel your subscription instantly from the Settings page. You will retain access until the end of your billing cycle.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="font-bold text-foreground">TraderJNL</span>
            <span>•</span>
            <span>EST 2026</span>
          </div>
          <p>© 2026 TraderJNL. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}