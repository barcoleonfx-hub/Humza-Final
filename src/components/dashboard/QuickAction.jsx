import React from 'react';
import { cn } from "@/lib/utils";

export default function QuickAction({ 
  icon: Icon, 
  title, 
  description, 
  onClick,
  variant = 'default',
  className
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-5 rounded-2xl text-left transition-all duration-300",
        "border hover:scale-[1.02] active:scale-[0.98]",
        variant === 'primary' 
          ? "bg-gradient-to-br from-green-500/20 to-emerald-600/10 border-green-500/30 hover:border-green-500/50" 
          : "bg-[#0f0f17]/80 border-white/5 hover:border-white/10",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          variant === 'primary'
            ? "bg-green-500/20 border border-green-500/30"
            : "bg-card/5 border border-white/10"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            variant === 'primary' ? "text-green-400" : "text-gray-400"
          )} />
        </div>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </button>
  );
}