import React from 'react';
import { cn } from "@/lib/utils";

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendUp,
  className 
}) {
  return (
    <div className={cn(
      "glass-card rounded-2xl p-6 transition-all duration-300 hover:border-white/10",
      "bg-[#0f0f17]/80 border border-white/5",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-400 font-medium">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/10 flex items-center justify-center border border-green-500/20">
            <Icon className="w-6 h-6 text-green-400" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium",
            trendUp ? "text-green-400" : "text-red-400"
          )}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          <span className="text-xs text-gray-500">vs last period</span>
        </div>
      )}
    </div>
  );
}