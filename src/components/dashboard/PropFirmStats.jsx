import React from 'react';
import { TrendingUp, TrendingDown, Target, DollarSign, BarChart3, Percent } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function PropFirmStats({ stats }) {
  const statsCards = [
    { 
      label: 'Total P&L', 
      value: (stats.totalPnl || 0) >= 0 ? `+$${(stats.totalPnl || 0).toFixed(2)}` : `-$${Math.abs(stats.totalPnl || 0).toFixed(2)}`,
      icon: DollarSign,
      color: (stats.totalPnl || 0) >= 0 ? 'text-green-600' : 'text-red-600',
      bg: (stats.totalPnl || 0) >= 0 ? 'bg-green-50' : 'bg-red-50'
    },
    { 
      label: 'Win Rate', 
      value: `${(stats.winRate || 0).toFixed(1)}%`,
      subtitle: `${stats.wins || 0}W / ${stats.losses || 0}L`,
      icon: Target,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    { 
      label: 'Total Trades', 
      value: stats.totalTrades || 0,
      icon: BarChart3,
      color: 'text-muted-foreground',
      bg: 'bg-muted/50'
    },
    { 
      label: 'Avg Win', 
      value: (stats.avgWin || 0) > 0 ? `$${(stats.avgWin || 0).toFixed(2)}` : '—',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    { 
      label: 'Avg Loss', 
      value: (stats.avgLoss || 0) > 0 ? `$${(stats.avgLoss || 0).toFixed(2)}` : '—',
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    { 
      label: 'Profit Factor', 
      value: stats.profitFactor !== null && stats.profitFactor !== undefined ? stats.profitFactor.toFixed(2) : '—',
      icon: Percent,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    { 
      label: 'Expectancy', 
      value: stats.expectancy !== null && stats.expectancy !== undefined ? `$${stats.expectancy.toFixed(2)}` : '—',
      subtitle: 'per trade',
      icon: DollarSign,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    { 
      label: 'Largest Win', 
      value: stats.largestWin !== null && stats.largestWin !== undefined ? `$${stats.largestWin.toFixed(2)}` : '—',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    { 
      label: 'Largest Loss', 
      value: stats.largestLoss !== null && stats.largestLoss !== undefined ? `-$${Math.abs(stats.largestLoss).toFixed(2)}` : '—',
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {statsCards.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="glass-card rounded-lg border border-border p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </p>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.bg)}>
                <Icon className={cn("w-4 h-4", stat.color)} />
              </div>
            </div>
            <p className={cn("text-2xl font-bold mb-1", stat.color)}>
              {stat.value}
            </p>
            {stat.subtitle && (
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}