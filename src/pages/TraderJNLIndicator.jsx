import React from 'react';
import { TrendingUp, Lock, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function TraderJNLIndicator() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl p-12 text-center shadow-xl">
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-foreground mb-3">
            TraderJNL Indicator
          </h1>
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-blue-200 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary-foreground/80">Coming Soon</span>
          </div>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            An exclusive TradingView indicator designed specifically for TraderJNL users. 
            Get real-time insights, key levels, and session markers directly on your charts.
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8 text-left max-w-md mx-auto">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <p className="font-semibold text-foreground">Session Killzones</p>
                <p className="text-sm text-muted-foreground">Asia, London, NY sessions marked on your chart</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <p className="font-semibold text-foreground">Key Levels</p>
                <p className="text-sm text-muted-foreground">PDH/PDL, weekly opens, and liquidity zones</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <p className="font-semibold text-foreground">Journaling Integration</p>
                <p className="text-sm text-muted-foreground">Sync with your TraderJNL account</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" />
            <p>Available exclusively to TraderJNL Pro & VIP members</p>
          </div>
        </div>
      </div>
    </div>
  );
}