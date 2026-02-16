import React from 'react';
import { useMarketSessions } from '@/hooks/useMarketSessions';
import { cn } from '@/lib/utils';
import {
    AlertTriangle,
    Activity,
    Zap,
    ShieldAlert,
    CheckCircle2,
    Waves,
    Timer
} from 'lucide-react';

export default function SessionGuidance({ riskData }) {
    const { intelligence } = useMarketSessions();
    const {
        liquidityScore,
        volatility,
        sessionMessage,
        verdict,
        verdictReason
    } = intelligence;

    // Define styles based on Verdict
    const styles = {
        OPTIMAL: {
            bg: "bg-emerald-950/30",
            border: "border-emerald-500/20",
            text: "text-emerald-400",
            icon: CheckCircle2,
            gradient: "from-emerald-500/10 to-transparent",
            pulse: true
        },
        TRADE_NORMAL: {
            bg: "bg-blue-950/30",
            border: "border-blue-500/20",
            text: "text-blue-400",
            icon: Activity,
            gradient: "from-blue-500/10 to-transparent",
            pulse: false
        },
        TRADE_SMALL: {
            bg: "bg-amber-950/30",
            border: "border-amber-500/20",
            text: "text-amber-400",
            icon: AlertTriangle,
            gradient: "from-amber-500/10 to-transparent",
            pulse: false
        },
        AVOID: {
            bg: "bg-red-950/30",
            border: "border-red-500/20",
            text: "text-red-400",
            icon: ShieldAlert,
            gradient: "from-red-500/10 to-transparent",
            pulse: false
        }
    };

    const activeStyle = styles[verdict] || styles.TRADE_SMALL;
    const Icon = activeStyle.icon;

    // Risk Integration Logic (If riskData is provided)
    // Example: If daily loss > 50% AND verdict is TRADE_SMALL -> escalate to AVOID
    let augmentedVerdict = verdict;
    let augmentedMessage = sessionMessage;

    if (riskData) {
        if (riskData.dailyLossPercent > 50 && (verdict === 'TRADE_SMALL' || verdict === 'TRADE_NORMAL')) {
            augmentedVerdict = 'AVOID';
            augmentedMessage = 'High Daily Loss + Suboptimal Session. Stop Trading.';
        }
    }

    return (
        <div className={cn(
            "relative overflow-hidden rounded-xl border p-4 mb-6 transition-all duration-300",
            activeStyle.bg,
            activeStyle.border
        )}>
            {/* Background Gradient */}
            <div className={cn("absolute inset-0 bg-gradient-to-r opacity-50", activeStyle.gradient)} />

            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

                {/* Left: Verdict & Message */}
                <div className="flex items-start gap-4">
                    <div className={cn(
                        "p-2 rounded-lg border bg-background/50",
                        activeStyle.border,
                        activeStyle.text,
                        activeStyle.pulse && "animate-pulse"
                    )}>
                        <Icon className="w-5 h-5" />
                    </div>

                    <div>
                        <h3 className={cn("text-sm font-bold uppercase tracking-wider flex items-center gap-2", activeStyle.text)}>
                            Session Verdict: {augmentedVerdict.replace('_', ' ')}
                            {activeStyle.pulse && (
                                <span className="flex h-2 w-2 relative">
                                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", activeStyle.text.replace('text-', 'bg-'))}></span>
                                    <span className={cn("relative inline-flex rounded-full h-2 w-2", activeStyle.text.replace('text-', 'bg-'))}></span>
                                </span>
                            )}
                        </h3>
                        <p className="text-sm font-medium text-foreground mt-1">
                            {augmentedMessage}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {verdictReason}
                        </p>
                    </div>
                </div>

                {/* Right: Metrics Grid */}
                <div className="flex items-center gap-6 w-full md:w-auto border-t md:border-t-0 border-border/50 pt-3 md:pt-0">

                    {/* Liquidity Metric */}
                    <div className="flex items-center gap-2">
                        <Waves className="w-4 h-4 text-slate-400" />
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-bold">Liquidity</p>
                            <p className={cn(
                                "text-xs font-bold",
                                liquidityScore === 'HIGH' ? "text-emerald-400" :
                                    liquidityScore === 'MEDIUM' ? "text-blue-400" :
                                        "text-amber-400"
                            )}>
                                {liquidityScore}
                            </p>
                        </div>
                    </div>

                    {/* Volatility Metric */}
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-slate-400" />
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-bold">Volatility</p>
                            <p className={cn(
                                "text-xs font-bold",
                                volatility === 'HIGH' ? "text-emerald-400" :
                                    volatility === 'MEDIUM' ? "text-blue-400" :
                                        "text-slate-400"
                            )}>
                                {volatility}
                            </p>
                        </div>
                    </div>

                    {/* Prop Guardrail (Placeholder or Active) */}
                    {riskData && (
                        <div className="border-l border-white/10 pl-4 ml-2">
                            <p className="text-[10px] uppercase text-muted-foreground font-bold">Risk Guard</p>
                            <p className={cn("text-xs font-bold", riskData.dailyLossPercent > 50 ? "text-red-400" : "text-emerald-400")}>
                                {riskData.dailyLossPercent > 50 ? "TIGHTEN RISK" : "NORMAL"}
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
