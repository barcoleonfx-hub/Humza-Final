import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Check, TrendingUp, Users, Brain, Target, Shield } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function VIPTradeWithFounder() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.me()
      .then(setUser)
      .catch(() => api.auth.redirectToLogin())
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-16 relative">
      {/* Blur Overlay */}
      <div className="absolute inset-0 backdrop-blur-md bg-black/50 z-10 flex items-center justify-center rounded-2xl">
        <div className="text-center space-y-4 p-8">
          <div className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6 border border-green-500/30">
            <TrendingUp className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-4xl font-bold text-white">Coming Soon</h2>
          <p className="text-xl text-gray-300 max-w-md">
            VIP Mentorship with the founder is launching soon. Stay tuned for updates.
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-6 pt-8">
        <div className="inline-block px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold mb-4">
          VIP MENTORSHIP
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          Trade Live With the Founder<br />of TraderJNL
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Daily structure. Real execution. Real accountability.<br />
          No AI. No signals. Just trading done properly.
        </p>
        <div className="pt-4 space-y-3">
          <Button 
            size="lg"
            className="bg-green-500 hover:bg-green-600 text-black font-bold text-lg h-16 px-12"
          >
            Start 7-Day Free Trial
          </Button>
          <p className="text-sm text-gray-500">
            $59/month after trial. Cancel anytime.
          </p>
        </div>
      </div>

      {/* Value Bullets */}
      <div className="glass-card rounded-2xl bg-[#0f0f17]/80 border border-white/5 p-8 md:p-12">
        <h2 className="text-3xl font-bold mb-8 text-center">What's Included</h2>
        <div className="grid gap-4">
          {[
            'Trade live with the founder every trading day',
            'Daily market mark-ups and execution breakdowns',
            'Live trading sessions (educational, not signals)',
            'Discord VIP access (daily prep, recap, and Q&A)',
            'Learn how professional traders think in real time',
            'Support for beginners AND advanced traders',
            'Clear yearly trading plan focused on passing prop firms without burning money',
            'Risk management, psychology, and execution — not hype',
            'Real human mentorship — not AI responses'
          ].map((item, idx) => (
            <div key={idx} className="flex gap-4 items-start">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-lg text-gray-300 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Human Emphasis */}
      <div className="glass-card rounded-2xl bg-[#0f0f17]/80 border border-green-500/20 p-8 md:p-12 text-center">
        <div className="space-y-6 max-w-2xl mx-auto">
          <p className="text-2xl font-bold leading-relaxed">
            This is not a signal service.<br />
            This is not copy trading.<br />
            This is not AI-generated advice.
          </p>
          <p className="text-xl text-gray-400 leading-relaxed">
            This is real-time education, live execution walkthroughs, and direct access to a professional trader who trades the markets daily.
          </p>
        </div>
      </div>

      {/* What You'll Learn */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-center">What You'll Actually Learn</h2>
        <div className="glass-card rounded-2xl bg-[#0f0f17]/80 border border-white/5 p-8">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Target,
                text: 'How to approach each trading day with structure'
              },
              {
                icon: Shield,
                text: 'When NOT to trade (this saves most people money)'
              },
              {
                icon: TrendingUp,
                text: 'How to manage drawdown and consistency rules'
              },
              {
                icon: Brain,
                text: 'How to think in probabilities, not emotions'
              },
              {
                icon: Users,
                text: 'How to survive and pass prop firm challenges long-term',
                span: true
              }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "flex gap-4 items-start p-4 rounded-xl bg-card/[0.02] border border-white/5",
                  item.span && "md:col-span-2"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-lg text-gray-300 pt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="glass-card rounded-2xl bg-[#0f0f17]/80 border border-green-500/30 p-8 md:p-12">
        <div className="text-center space-y-8">
          <div>
            <div className="text-5xl font-bold text-green-400 mb-2">$0</div>
            <div className="text-xl text-gray-400">7-Day Free Trial</div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <p className="text-lg text-gray-300 mb-2">After the trial:</p>
            <div className="text-3xl font-bold mb-1">$59 per month</div>
            <p className="text-gray-500">Cancel anytime</p>
          </div>

          <div className="pt-4">
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              1-to-1 access is not included in the monthly plan.
            </p>
          </div>

          <Button 
            size="lg"
            className="bg-green-500 hover:bg-green-600 text-black font-bold text-lg h-14 px-12"
          >
            Start 7-Day Free Trial
          </Button>
        </div>
      </div>

      {/* 1-to-1 Disclaimer */}
      <div className="glass-card rounded-2xl bg-card/[0.02] border border-white/5 p-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">1-to-1 Private Access</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-4">
          1-to-1 private access with the founder (including a dedicated 2-hour call) is only available to:
        </p>
        <div className="space-y-2 text-sm text-gray-400">
          <p>• 6-Month Plan: $300</p>
          <p>• Lifetime Access: $890</p>
        </div>
        <p className="text-xs text-gray-600 mt-4">
          This ensures focused, high-quality mentorship and realistic availability.
        </p>
      </div>

      {/* Final CTA */}
      <div className="text-center space-y-4 pb-12">
        <Button 
          size="lg"
          className="bg-green-500 hover:bg-green-600 text-black font-bold text-lg h-14 px-12"
        >
          Start 7-Day Free Trial
        </Button>
        <p className="text-gray-500">
          Trade with structure. Learn properly. Build discipline.
        </p>
      </div>

      {/* Legal Disclaimer */}
      <div className="border-t border-white/5 pt-8 pb-12">
        <div className="text-xs text-gray-600 leading-relaxed max-w-3xl mx-auto text-center space-y-2">
          <p className="font-semibold text-gray-500">Legal & Risk Disclaimer</p>
          <p>
            This VIP experience is for educational purposes only. No financial advice is given. 
            No profits are guaranteed. Trading involves risk and losses can exceed expectations. 
            All live sessions are educational walkthroughs, not trade signals.
          </p>
        </div>
      </div>
    </div>
  );
}