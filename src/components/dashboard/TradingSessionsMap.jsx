import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { useMarketSessions } from '@/hooks/useMarketSessions';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json"; // Optimized simplified map

export default function TradingSessionsMap() {
    const { sessions, isGlobalWeekend, utcTime } = useMarketSessions();

    return (
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl overflow-hidden mb-6 flex flex-col lg:flex-row h-auto lg:h-[320px] shadow-lg">

            {/* MAP SECTION (Left/Top) */}
            <div className="relative w-full lg:w-3/4 h-[250px] lg:h-full bg-[#030610] overflow-hidden group">

                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                </div>

                {/* Weeked Overlay */}
                {isGlobalWeekend && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                        <div className="bg-background/90 border border-border/50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-bold text-foreground">Markets Closed</p>
                                <p className="text-xs text-muted-foreground">Weekend Session • Sydney opens Sunday 21:00 UTC</p>
                            </div>
                        </div>
                    </div>
                )}

                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                        scale: 135, // Zoomed out slightly to fit world width
                        center: [10, 20] // Focused north of equator to crop Antarctica
                    }}
                    style={{ width: "100%", height: "100%" }}
                >
                    <defs>
                        {/* Glow Gradients for each session */}
                        {sessions.map(s => (
                            <radialGradient key={s.name} id={`glow-${s.name}`} cx="0.5" cy="0.5" r="0.5">
                                <stop offset="0%" stopColor={s.color} stopOpacity="0.5" />
                                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
                            </radialGradient>
                        ))}
                    </defs>

                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="#1e293b"
                                    stroke="#0f172a"
                                    strokeWidth={0.75}
                                    style={{
                                        default: { outline: "none", fill: "#1e293b" },
                                        hover: { fill: "#28354a", outline: "none" },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            ))
                        }
                    </Geographies>

                    {/* Session Markers */}
                    {sessions.map((session) => (
                        <Marker key={session.name} coordinates={session.coordinates}>
                            {/* 1. Large Ambient Glow (Zone Effect) - Only when OPEN */}
                            {session.isOpen && (
                                <circle r={45} fill={`url(#glow-${session.name})`} style={{ pointerEvents: 'none' }} />
                            )}

                            {/* 2. Pulse Animation - Only when OPEN */}
                            {session.isOpen && (
                                <circle r={12} fill={session.color} opacity={0.3}>
                                    <animate attributeName="r" from="8" to="24" dur="2s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
                                </circle>
                            )}

                            {/* 3. Pin */}
                            <circle r={4} fill={session.isOpen ? session.color : '#475569'} stroke="#030610" strokeWidth={1.5} />

                            {/* 4. Label (above pin) */}
                            <text
                                textAnchor="middle"
                                y={-18}
                                style={{
                                    fontFamily: "system-ui, -apple-system, sans-serif",
                                    fill: session.isOpen ? "#fff" : "#64748b",
                                    fontSize: session.isOpen ? "14px" : "12px",
                                    fontWeight: session.isOpen ? "700" : "600",
                                    filter: session.isOpen ? "drop-shadow(0 2px 4px rgba(0,0,0,0.8))" : "none",
                                    pointerEvents: 'none',
                                    transition: "all 0.3s ease"
                                }}
                            >
                                {session.city}
                            </text>
                        </Marker>
                    ))}
                </ComposableMap>

                {/* Global Map Overlay (Vignette) */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,#030610_100%)]"></div>

                {/* UTC Clock (Top Right Overlay) */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg z-10">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-xs font-mono text-slate-200">
                        {utcTime.split(' ')[0]} <span className="text-muted-foreground font-bold">UTC</span>
                    </p>
                </div>
            </div>

            {/* ACTIVE MARKETS PANEL (Right/Bottom) */}
            <div className="w-full lg:w-[280px] border-l border-border bg-card/20 backdrop-blur-md flex flex-col shrink-0">
                <div className="p-4 border-b border-border/50 bg-muted/10">
                    <div className="flex items-center gap-2 mb-1">
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", isGlobalWeekend ? "bg-red-500" : "bg-emerald-500")} />
                        <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Market Status</h3>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                    {sessions.map((session) => {
                        const { isOpen, status, infoText, color } = session;

                        return (
                            <div
                                key={session.name}
                                className={cn(
                                    "relative overflow-hidden rounded-lg p-3 transition-all border group",
                                    isOpen
                                        ? "bg-gradient-to-r from-white/[0.08] to-transparent border-white/10 shadow-sm"
                                        : "bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-white/5"
                                )}
                            >
                                {/* Active Indicator Bar */}
                                {isOpen && <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />}

                                <div className="flex justify-between items-start mb-1.5 ml-1">
                                    <div>
                                        <p className={cn("text-xs font-bold", isOpen ? "text-white" : "text-muted-foreground")}>{session.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                            {infoText}
                                        </p>
                                    </div>
                                    <Badge status={isOpen ? 'OPEN' : isGlobalWeekend ? 'WEEKEND' : status === 'CLOSING SOON' ? 'CLOSING' : 'CLOSED'} />
                                </div>
                            </div>
                        );
                    })}

                    {isGlobalWeekend && (
                        <div className="mt-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3 mx-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-200/80 leading-relaxed">
                                Institutional desks are closed. Retail spreads may be wide.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Badge({ status }) {
    const styles = {
        OPEN: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20 animate-pulse",
        CLOSED: "bg-slate-800 text-slate-500 border-slate-700",
        original: "bg-emerald-500 text-white", // Fallback
        WEEKEND: "bg-red-900/40 text-red-400 border-red-500/20",
        CLOSING: "bg-amber-500/20 text-amber-400 border-amber-500/20"
    };

    // Exact mapping from logic
    const statusMap = {
        'OPEN': styles.OPEN,
        'CLOSED': styles.CLOSED,
        'WEEKEND': styles.WEEKEND,
        'CLOSING': styles.CLOSING,
        'OPENS SOON': "bg-blue-500/20 text-blue-400 border-blue-500/20"
    };

    return (
        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider", statusMap[status] || styles.CLOSED)}>
            {status}
        </span>
    );
}
