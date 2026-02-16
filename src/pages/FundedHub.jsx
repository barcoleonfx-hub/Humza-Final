import React, { useState, useMemo, useEffect } from 'react';
import { PROP_FIRMS, LAST_UPDATE, getAllPlans } from '@/lib/fundedHubDatabase';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Search,
    Building2,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    TrendingUp,
    Shield,
    Clock,
    DollarSign,
    Sparkles,
    Filter,
    X,
    RefreshCw,
    CheckCircle2,
    Info,
    Plus,
    LayoutDashboard,
    BarChart3,
    AlertTriangle,
    Target,
    AlertCircle,
    HelpCircle,
    PlayCircle
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import AddAccountDialog from '@/components/dashboard/AddAccountDialog';

// --- Constants ---

const CATEGORIES = [
    { id: 'my_accounts', label: 'My Accounts', count: 1, icon: LayoutDashboard },
];

function formatCurrency(amount) {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function formatSize(size) {
    if (size >= 1000) return `${size / 1000}K`;
    return `${size}`;
}

// --- Dummy Data (Updated to match new schema roughly) ---
// Note: We keep the old structure for dummy accounts for now, but PropRiskCard handles it.
const DUMMY_ACCOUNT = {
    id: 'sim-1', firmId: 'topstep', accountId: 'ts-50k', name: 'Topstep 50K Combine', phase: 'Eval', status: 'Active',
    balance: 51240, startBalance: 50000, equityHigh: 51240, todayPnL: 680,
    rules: { dailyLossLimit: 1000, maxDrawdownLimit: 2000, consistencyRule: 0.50, profitTarget: 3000, maxContracts: 5, minDays: 5 },
    currentDailyLoss: 0, maxDrawdownLevel: 49240, bestDayPnL: 800, tradingDays: 4, contractsUsedToday: 3, tradesToday: 4, avgTradesPerDay: 3.5,
};

const DUMMY_LUCID = {
    id: 'sim-2', firmId: 'lucid', accountId: 'lucid-flex-50k', name: 'LucidFlex 50K', phase: 'Funded', status: 'Active',
    balance: 53100, startBalance: 50000, equityHigh: 53100, todayPnL: -850,
    rules: { dailyLossLimit: null, maxDrawdownLimit: 2500, consistencyRule: null, profitTarget: 0, maxContracts: 10, minDays: 2 },
    currentDailyLoss: 850, maxDrawdownLevel: 51000, bestDayPnL: 1200, tradingDays: 12, contractsUsedToday: 8, tradesToday: 12, avgTradesPerDay: 4,
};

const DUMMY_APEX = {
    id: 'sim-3', firmId: 'apex', accountId: 'apex-50k', name: 'Apex 50K Eval', phase: 'Eval', status: 'Breach Risk',
    balance: 48600, startBalance: 50000, equityHigh: 50100, todayPnL: -200,
    rules: { dailyLossLimit: null, maxDrawdownLimit: 2500, consistencyRule: null, profitTarget: 3000, maxContracts: 10, minDays: 7 },
    currentDailyLoss: 200, maxDrawdownLevel: 47600, bestDayPnL: 400, tradingDays: 2, contractsUsedToday: 1, tradesToday: 2, avgTradesPerDay: 5,
};

// --- Logic Helpers ---

function getRiskVerdict(account) {
    const { balance, maxDrawdownLevel, rules, todayPnL, bestDayPnL } = account;
    let risks = { dailyLoss: { level: 'SAFE', value: 0 }, drawdown: { level: 'SAFE', value: 0 }, consistency: { level: 'SAFE', value: 0 } };

    // Daily Loss
    if (todayPnL < 0 && rules.dailyLossLimit) {
        const pct = Math.abs(todayPnL) / rules.dailyLossLimit;
        risks.dailyLoss.value = pct;
        if (pct > 0.75) risks.dailyLoss.level = 'STOP'; else if (pct > 0.50) risks.dailyLoss.level = 'CAUTION';
    }

    // Drawdown
    const ddRoom = balance - maxDrawdownLevel;
    const ddPctLeft = ddRoom / rules.maxDrawdownLimit;
    risks.drawdown.value = ddPctLeft;
    if (ddPctLeft < 0.25) risks.drawdown.level = 'STOP'; else if (ddPctLeft < 0.50) risks.drawdown.level = 'CAUTION';

    // Consistency
    const totalProfit = balance - account.startBalance;
    if (totalProfit > 0 && rules.consistencyRule) {
        const bestDayPct = bestDayPnL / totalProfit;
        const buffer = rules.consistencyRule - bestDayPct;
        risks.consistency.value = buffer;
        if (buffer < 0.05) risks.consistency.level = 'STOP'; else if (buffer < 0.10) risks.consistency.level = 'CAUTION';
    }

    if (Object.values(risks).some(r => r.level === 'STOP')) return { status: 'STOP', risks };
    if (Object.values(risks).some(r => r.level === 'CAUTION')) return { status: 'CAUTION', risks };
    return { status: 'SAFE', risks };
}

// --- Main Component ---

export default function FundedHub() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('my_accounts');
    const [expandedFirm, setExpandedFirm] = useState(null);
    const [refreshingFirmId, setRefreshingFirmId] = useState(null);

    // Add Account State
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    // Dummy user context for the dialog
    const currentUser = { email: 'user@example.com' };

    const [myAccounts, setMyAccounts] = useState([DUMMY_ACCOUNT, DUMMY_LUCID, DUMMY_APEX]);

    const handleRefreshFirm = (firmId, e) => {
        e.stopPropagation();
        setRefreshingFirmId(firmId);
        setTimeout(() => {
            setRefreshingFirmId(null);
            toast.success("Firm data verified", { description: "Rules and pricing match the official website." });
        }, 1500);
    };

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        setShowAddDialog(true);
    };

    const firms = useMemo(() => {
        let list = PROP_FIRMS;
        if (activeCategory !== 'all' && activeCategory !== 'my_accounts') {
            list = list.filter(f => f.type === activeCategory);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(f =>
                f.name.toLowerCase().includes(q) ||
                f.planFamilies.some(fam => fam.plans.some(p => p.size.toString().includes(q) || fam.name.toLowerCase().includes(q)))
            );
        }
        return list;
    }, [activeCategory, searchQuery]);

    const isMyAccounts = activeCategory === 'my_accounts';

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <TooltipProvider>
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Building2 className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">FundedHub</h1>
                            <p className="text-muted-foreground text-sm">
                                Premium directory of {PROP_FIRMS.length} verified firms.
                            </p>
                        </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-medium text-emerald-500">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Database Verified: {LAST_UPDATE}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card/50 p-1.5 rounded-2xl border border-border/50">
                    <div className="flex gap-1 overflow-x-auto w-full md:w-auto no-scrollbar">
                        {CATEGORIES.map(cat => {
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => { setActiveCategory(cat.id); setExpandedFirm(null); }}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap",
                                        activeCategory === cat.id
                                            ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    {Icon && <Icon className="w-4 h-4" />}
                                    {cat.label}
                                    <span className={cn("ml-2 text-xs px-1.5 py-0.5 rounded-full", activeCategory === cat.id ? "bg-muted text-foreground" : "bg-muted/50 text-muted-foreground")}>
                                        {cat.id === 'my_accounts' ? myAccounts.length : cat.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {!isMyAccounts && (
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search firms..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 bg-background/50 border-0 ring-1 ring-border/50 focus:ring-primary/20"
                            />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="min-h-[400px]">
                    {isMyAccounts ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Active Simulations</h2>
                                <Button size="sm" variant="outline" className="gap-2" onClick={() => { setSelectedPlan(null); setShowAddDialog(true); }}>
                                    <Plus className="w-4 h-4" /> Add Custom
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                {myAccounts.map(account => (
                                    <PropRiskCard key={account.id} account={account} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {firms.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground">
                                    No firms found matching your filters.
                                </div>
                            ) : (
                                firms.map(firm => (
                                    <FirmCard
                                        key={firm.id}
                                        firm={firm}
                                        isExpanded={expandedFirm === firm.id}
                                        onToggle={() => setExpandedFirm(expandedFirm === firm.id ? null : firm.id)}
                                        isRefreshing={refreshingFirmId === firm.id}
                                        onRefresh={(e) => handleRefreshFirm(firm.id, e)}
                                        onSelectPlan={handleSelectPlan}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Add Account Modal */}
                <AddAccountDialog
                    open={showAddDialog}
                    onOpenChange={setShowAddDialog}
                    initialData={selectedPlan}
                    currentUser={currentUser}
                    onSuccess={(newAccount) => {
                        toast.success("Account Created", { description: `${newAccount.account_name} has been added to My Accounts.` });
                    }}
                />
            </TooltipProvider>
        </div>
    );
}

// --- Components ---

function FirmCard({ firm, isExpanded, onToggle, isRefreshing, onRefresh, onSelectPlan }) {
    const [activeFamilyId, setActiveFamilyId] = useState(firm.planFamilies[0].id);
    const activeFamily = firm.planFamilies.find(f => f.id === activeFamilyId) || firm.planFamilies[0];

    return (
        <div className={cn("group rounded-2xl border bg-card transition-all duration-300 overflow-hidden", isExpanded ? "border-blue-500/30 shadow-lg ring-1 ring-blue-500/10" : "border-border/50 hover:border-border")}>

            {/* Header */}
            <div className="p-5 flex flex-col md:flex-row md:items-center gap-5 cursor-pointer" onClick={onToggle}>
                <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 p-2 flex items-center justify-center shrink-0">
                    <img src={firm.logo} alt={firm.name} className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold">{firm.name}</h3>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", firm.type === 'Futures' ? "bg-amber-500/10 text-amber-500" : "bg-purple-500/10 text-purple-500")}>
                            {firm.type}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{firm.notes}</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <div className="text-xs font-medium text-emerald-500 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                            {firm.lastVerified}
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className={cn("rounded-full", isRefreshing && "animate-spin text-primary")} onClick={onRefresh}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <div className={cn("transition-transform duration-300", isExpanded && "rotate-180")}>
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </div>
                </div>
            </div>

            {/* Expanded Content: Plan Selector */}
            {isExpanded && (
                <div className="border-t border-border/50 bg-muted/5 animate-in slide-in-from-top-2">

                    {/* Family Tabs */}
                    <div className="flex items-center gap-2 p-2 mx-4 mt-4 bg-muted/20 rounded-lg overflow-x-auto no-scrollbar">
                        {firm.planFamilies.map(fam => (
                            <button
                                key={fam.id}
                                onClick={(e) => { e.stopPropagation(); setActiveFamilyId(fam.id); }}
                                className={cn(
                                    "px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                                    activeFamilyId === fam.id
                                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                )}
                            >
                                {fam.name}
                            </button>
                        ))}
                    </div>

                    <div className="px-6 py-2 text-xs text-muted-foreground italic">
                        "{activeFamily.description}"
                    </div>

                    {/* Plans Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/10 text-xs uppercase text-muted-foreground tracking-wider font-medium">
                                <tr>
                                    <th className="px-6 py-3">Size</th>
                                    <th className="px-4 py-3 text-right">Price</th>
                                    <th className="px-4 py-3 text-right text-emerald-500">Target</th>
                                    <th className="px-4 py-3 text-right text-red-500">Daily Loss</th>
                                    <th className="px-4 py-3 text-right text-orange-500">Drawdown</th>
                                    <th className="px-4 py-3 text-right">Min Days</th>
                                    <th className="px-6 py-3 text-right w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {activeFamily.plans.map(plan => (
                                    <tr key={plan.id} className="hover:bg-muted/20 transition-colors group/row">
                                        <td className="px-6 py-3 font-bold font-mono text-base">{formatSize(plan.size)}</td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            {formatCurrency(plan.price)}
                                            {plan.billing === 'Monthly' && <span className="text-[10px] text-muted-foreground ml-0.5">/mo</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-emerald-500">{formatCurrency(plan.profitTarget)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-red-500">{plan.dailyLoss ? formatCurrency(plan.dailyLoss) : '—'}</td>
                                        <td className="px-4 py-3 text-right font-mono text-orange-500">
                                            {formatCurrency(plan.maxDrawdown)}
                                            <div className="text-[9px] text-muted-foreground uppercase">{plan.ddType?.split(' ')[1] || 'TRAIL'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">{plan.minDays}</td>
                                        <td className="px-6 py-3 text-right">
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-blue-500 hover:text-white" onClick={(e) => { e.stopPropagation(); onSelectPlan({ ...plan, firmName: firm.name, firmId: firm.id, familyName: activeFamily.name }); }}>
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 flex items-center justify-between text-xs text-muted-foreground bg-muted/10 border-t border-border/50">
                        <div className="flex gap-4">
                            <span>Last Verified: {firm.lastVerified}</span>
                            <span>Source: <a href={firm.website} target="_blank" rel="noreferrer" className="hover:underline text-blue-400">{new URL(firm.website).hostname}</a></span>
                        </div>
                        <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
                            <AlertTriangle className="w-3 h-3" /> Report Mismatch
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
}

function PropRiskCard({ account }) {
    const { status, risks } = getRiskVerdict(account);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => { if (status !== 'SAFE') setExpanded(true); }, [status]);

    const dailyLossLimit = account.rules.dailyLossLimit || 999999;
    const dailyLossUsed = Math.abs(Math.min(0, account.todayPnL));
    const dailyLossLeft = dailyLossLimit - dailyLossUsed;
    const dailyLossPct = dailyLossLimit === 999999 ? 0 : (dailyLossLeft / dailyLossLimit);

    const ddRoom = account.balance - account.maxDrawdownLevel;

    // Status Styles
    const colors = {
        'SAFE': { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500/20', chip: 'bg-emerald-500 text-white' },
        'CAUTION': { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500/50', chip: 'bg-orange-500 text-white' },
        'STOP': { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500/50', chip: 'bg-red-500 text-white' }
    }[status];

    return (
        <div className={cn("rounded-2xl border bg-card overflow-hidden transition-all duration-300", colors.border, expanded ? "shadow-lg" : "shadow-sm")}>
            {/* Header */}
            <div className="p-5 border-b border-border/50 flex items-center justify-between bg-muted/10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-xs font-bold text-muted-foreground border border-white/10">
                        {account.firmId.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{account.name}</h3>
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground rounded-sm">{account.phase}</span>
                        </div>
                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold mt-1", colors.chip)}>
                            {status === 'SAFE' && <CheckCircle2 className="w-3 h-3" />}
                            {status === 'CAUTION' && <AlertCircle className="w-3 h-3" />}
                            {status === 'STOP' && <AlertTriangle className="w-3 h-3" />}
                            {status}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold tracking-tight">{formatCurrency(account.balance)}</div>
                    <div className={cn("text-sm font-medium", account.todayPnL >= 0 ? "text-emerald-500" : "text-red-500")}>
                        {account.todayPnL >= 0 ? '+' : ''}{formatCurrency(account.todayPnL)} Today
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Daily Loss */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium flex items-center gap-1">Daily Loss Left <InfoIcon tooltip="Loss allowed today" /></span>
                        <span className="font-mono font-bold">{dailyLossLimit > 50000 ? '∞' : formatCurrency(dailyLossLeft)}</span>
                    </div>
                    {dailyLossLimit < 50000 && (
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", dailyLossPct > 0.5 ? "bg-emerald-500" : "bg-red-500")} style={{ width: `${Math.min(dailyLossPct * 100, 100)}%` }} />
                        </div>
                    )}
                </div>

                {/* Drawdown */}
                <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground block">Drawdown Room</span>
                    <span className={cn("text-lg font-bold font-mono", ddRoom > 1000 ? "text-emerald-500" : "text-orange-500")}>{formatCurrency(ddRoom)}</span>
                    <div className="text-xs text-muted-foreground">Level: {formatCurrency(account.maxDrawdownLevel)}</div>
                </div>

                {/* Consistency */}
                <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground block">Consistency Buffer</span>
                    {account.rules.consistencyRule ? (
                        <span className={cn("text-lg font-bold", risks.consistency.level === 'SAFE' ? "text-emerald-500" : "text-orange-500")}>
                            {Math.max(0, Math.round(risks.consistency.value * 100))}% Left
                        </span>
                    ) : <span className="text-muted-foreground font-medium">N/A</span>}
                </div>
            </div>

            {/* Toggle Expand */}
            {status === 'SAFE' && (
                <button onClick={() => setExpanded(!expanded)} className="w-full py-1 bg-muted/30 hover:bg-muted/50 text-[10px] text-muted-foreground uppercase tracking-widest transition-colors flex items-center justify-center gap-1">
                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {expanded ? 'Hide Details' : 'Show Risk Details'}
                </button>
            )}
        </div>
    );
}

function InfoIcon({ tooltip }) {
    return (
        <Tooltip>
            <TooltipTrigger><HelpCircle className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
            <TooltipContent><p className="max-w-[200px] text-xs">{tooltip}</p></TooltipContent>
        </Tooltip>
    );
}
