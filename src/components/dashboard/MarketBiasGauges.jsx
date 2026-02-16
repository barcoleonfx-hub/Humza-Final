import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const PAIRS = [
    {
        symbol: 'XAUUSD',
        name: 'Gold',
        category: 'Metal',
        price: '2,918.50',
        score: 72,
        bias: 'Bullish',
        trend: 'Long',
        change: '+1.12%',
    },
    {
        symbol: 'NQ',
        name: 'Nasdaq 100 Futures',
        category: 'Index',
        price: '21,845',
        score: 58,
        bias: 'Bullish',
        trend: 'Long',
        change: '+0.34%',
    },
    {
        symbol: 'ES',
        name: 'S&P 500 Futures',
        category: 'Index',
        price: '6,078',
        score: 52,
        bias: 'Neutral',
        trend: 'Flat',
        change: '+0.08%',
    },
    {
        symbol: 'EURUSD',
        name: 'Euro / Dollar',
        category: 'Forex',
        price: '1.0842',
        score: 35,
        bias: 'Bearish',
        trend: 'Short',
        change: '-0.32%',
    },
    {
        symbol: 'DAX',
        name: 'Germany 40',
        category: 'Index',
        price: '22,148',
        score: 65,
        bias: 'Bullish',
        trend: 'Long',
        change: '+0.72%',
    },
    {
        symbol: 'YM',
        name: 'Dow Futures',
        category: 'Index',
        price: '44,520',
        score: 45,
        bias: 'Neutral',
        trend: 'Flat',
        change: '-0.11%',
    },
];

function GaugeArc({ score, size = 90 }) {
    const cx = size / 2;
    const cy = size / 2 + 4;
    const radius = size / 2 - 8;
    const startAngle = -210;
    const endAngle = 30;
    const totalAngle = endAngle - startAngle;

    const needleAngle = startAngle + (score / 100) * totalAngle;
    const toRad = (deg) => (deg * Math.PI) / 180;

    const arcPath = (start, end, r) => {
        const x1 = cx + r * Math.cos(toRad(start));
        const y1 = cy + r * Math.sin(toRad(start));
        const x2 = cx + r * Math.cos(toRad(end));
        const y2 = cy + r * Math.sin(toRad(end));
        const largeArc = Math.abs(end - start) > 180 ? 1 : 0;
        return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
    };

    const needleLen = radius - 4;
    const needleX = cx + needleLen * Math.cos(toRad(needleAngle));
    const needleY = cy + needleLen * Math.sin(toRad(needleAngle));

    const getColor = (s) => {
        if (s <= 35) return '#ef4444';
        if (s <= 65) return '#eab308';
        return '#22c55e';
    };

    const color = getColor(score);
    const ticks = [0, 25, 50, 75, 100];

    return (
        <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
            {/* Background arc */}
            <path d={arcPath(startAngle, endAngle, radius)} fill="none" stroke="currentColor" className="text-white/5" strokeWidth="5" strokeLinecap="round" />

            {/* Red zone (0-35) */}
            <path d={arcPath(startAngle, startAngle + totalAngle * 0.35, radius)} fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" opacity="0.2" />
            {/* Yellow zone (35-65) */}
            <path d={arcPath(startAngle + totalAngle * 0.35, startAngle + totalAngle * 0.65, radius)} fill="none" stroke="#eab308" strokeWidth="5" strokeLinecap="round" opacity="0.2" />
            {/* Green zone (65-100) */}
            <path d={arcPath(startAngle + totalAngle * 0.65, endAngle, radius)} fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" opacity="0.2" />

            {/* Active arc */}
            <path d={arcPath(startAngle, needleAngle, radius)} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color}50)` }} />

            {/* Tick marks */}
            {ticks.map((tick) => {
                const tickAngle = startAngle + (tick / 100) * totalAngle;
                const innerR = radius - 8;
                const outerR = radius - 3;
                return (
                    <line key={tick}
                        x1={cx + innerR * Math.cos(toRad(tickAngle))} y1={cy + innerR * Math.sin(toRad(tickAngle))}
                        x2={cx + outerR * Math.cos(toRad(tickAngle))} y2={cy + outerR * Math.sin(toRad(tickAngle))}
                        stroke="currentColor" className="text-muted-foreground/20" strokeWidth="0.8" />
                );
            })}

            {/* Needle */}
            <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth="1.5" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 3px ${color}60)` }} />

            {/* Center */}
            <circle cx={cx} cy={cy} r="3" fill={color} />
            <circle cx={cx} cy={cy} r="1.5" fill="var(--card)" />

            {/* Score */}
            <text x={cx} y={cy + 13} textAnchor="middle" fill={color} fontSize="11" fontWeight="800" fontFamily="system-ui">{score}</text>
        </svg>
    );
}

export default function MarketBiasGauges() {
    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">⚡ Market Overview</h3>
                </div>
                <p className="text-[10px] text-muted-foreground">
                    Last update: <span className="text-foreground font-medium">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {PAIRS.map((pair) => {
                    const isBullish = pair.bias === 'Bullish';
                    const isBearish = pair.bias === 'Bearish';
                    const TrendIcon = isBullish ? TrendingUp : isBearish ? TrendingDown : Minus;

                    return (
                        <div key={pair.symbol} className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-3 hover:border-white/15 transition-all group">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-0.5">
                                <div>
                                    <p className="text-xs font-bold text-foreground tracking-wide">{pair.symbol}</p>
                                    <p className="text-[8px] text-muted-foreground/60 uppercase tracking-wider">{pair.category}</p>
                                </div>
                                <span className={cn(
                                    "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                                    isBullish && "text-green-400 bg-green-500/10",
                                    isBearish && "text-red-400 bg-red-500/10",
                                    !isBullish && !isBearish && "text-yellow-400 bg-yellow-500/10"
                                )}>
                                    {pair.bias}
                                </span>
                            </div>

                            {/* Gauge */}
                            <div className="flex justify-center">
                                <GaugeArc score={pair.score} size={85} />
                            </div>

                            {/* Trend & Change */}
                            <div className="flex items-center justify-between mt-0.5">
                                <div className="flex items-center gap-1">
                                    <TrendIcon className={cn("w-3 h-3",
                                        isBullish && "text-green-500",
                                        isBearish && "text-red-500",
                                        !isBullish && !isBearish && "text-yellow-500"
                                    )} />
                                    <span className="text-[10px] font-semibold text-muted-foreground">{pair.trend}</span>
                                </div>
                                <span className={cn("text-[10px] font-bold",
                                    pair.change.startsWith('+') ? "text-green-500" : pair.change.startsWith('-') ? "text-red-500" : "text-muted-foreground"
                                )}>
                                    {pair.change}
                                </span>
                            </div>

                            {/* Price */}
                            <p className="text-center text-[10px] text-muted-foreground mt-0.5 font-mono">{pair.price}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
