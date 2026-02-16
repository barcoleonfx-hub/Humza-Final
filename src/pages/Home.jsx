import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  TrendingUp,
  BarChart3,
  Info,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Activity,
  Target,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { createPageUrl } from '../utils';
import { Link } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import UpgradeBanner from '@/components/UpgradeBanner';
import TradingSessionsMap from '@/components/dashboard/TradingSessionsMap';
import MarketBiasGauges from '@/components/dashboard/MarketBiasGauges';
import SessionGuidance from '@/components/dashboard/SessionGuidance';
import AccountSelector from '@/components/dashboard/AccountSelector';

const TRADER_AFFIRMATIONS = [
  "Consistency compounds faster than aggression.",
  "Your edge improves when risk is controlled.",
  "One good decision per session is enough.",
  "Patience is a trading strategy, not just a virtue.",
  "The market rewards discipline and punishes emotion.",
  "Respect the process, and the results will follow.",
  "Risk management is the only thing you can truly control."
];

export default function Home() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30D');
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Demo Data for Empty States
  const DEMO_DATA = {
    totalNetPnl: 1420.50,
    winRate: 64.2,
    totalWins: 18,
    totalLosses: 10,
    profitFactor: 1.85,
    totalTrades: 28,
    averageWin: 120.00,
    averageLoss: -65.00,
    expectancy: 54.00,
    largestWin: 450.00,
    largestLoss: -210.00,
    disciplineScore: 82,
    currentStreak: 4,
    accountRisk: 'LOW',
    completedSessions: 12,
    equityCurve: [
      { date: '2026-02-01', equity: 200 },
      { date: '2026-02-03', equity: 450 },
      { date: '2026-02-05', equity: 380 },
      { date: '2026-02-08', equity: 890 },
      { date: '2026-02-10', equity: 1100 },
      { date: '2026-02-12', equity: 1420 }
    ],
    isDemo: true,
    todayPnL: -120, // Added for demo risk calc
    dailyLossLimit: 500 // Added for demo risk calc
  };

  const MARKET_BIAS = {
    gold: { bias: 'Bullish', confidence: 'Medium', direction: 'up' },
    nasdaq: { bias: 'Neutral', confidence: 'Low', direction: 'flat' }
  };

  // Summary mode flag
  const isSummaryMode = selectedAccountId === 'SUMMARY_ALL';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await api.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('[AUTH] Failed to get user:', error);
        // Redirect to login if not authenticated
        api.auth.redirectToLogin();
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const savedAccountId = localStorage.getItem('selectedAccountId');
    setSelectedAccountId(savedAccountId);

    const handleAccountChange = (e) => {
      setSelectedAccountId(e.detail);
    };

    window.addEventListener('accountChanged', handleAccountChange);
    return () => window.removeEventListener('accountChanged', handleAccountChange);
  }, []);

  const { data: allAccounts = [] } = useQuery({
    queryKey: ['allAccounts', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await api.entities.TradingAccount.filter({ user_id: currentUser.email });
    },
    enabled: !!currentUser?.email
  });

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['verifiedDashboard', currentUser?.email, selectedAccountId, selectedPeriod],
    queryFn: async () => {
      if (!currentUser?.email || !selectedAccountId) return null;

      // Fetch completed journal entries
      let entries;
      if (isSummaryMode) {
        // Fetch all completed entries across all accounts
        entries = await api.entities.JournalEntry.filter({
          created_by: currentUser.email,
          status: 'registered'
        }, '-entry_date', 200);
        // Exclude any SUMMARY_ALL account entries
        entries = entries.filter(e => e.account_id !== 'SUMMARY_ALL');
      } else {
        // Fetch for specific account
        entries = await api.entities.JournalEntry.filter({
          created_by: currentUser.email,
          account_id: selectedAccountId,
          status: 'registered'
        }, '-entry_date');
      }

      // Apply date filter
      const now = new Date();
      const filteredEntries = entries.filter(entry => {
        const entryDate = new Date(entry.entry_date);
        if (selectedPeriod === '2D') return (now - entryDate) / (1000 * 60 * 60 * 24) <= 2;
        if (selectedPeriod === '7D') return (now - entryDate) / (1000 * 60 * 60 * 24) <= 7;
        if (selectedPeriod === '14D') return (now - entryDate) / (1000 * 60 * 60 * 24) <= 14;
        if (selectedPeriod === '30D') return (now - entryDate) / (1000 * 60 * 60 * 24) <= 30;
        if (selectedPeriod === '90D') return (now - entryDate) / (1000 * 60 * 60 * 24) <= 90;
        if (selectedPeriod === 'CUSTOM' && customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          return entryDate >= start && entryDate <= end;
        }
        return true; // ALL_TIME
      });

      if (filteredEntries.length === 0) {
        return { completedSessions: 0, entries: [] };
      }

      // Extract all trades from completed entries
      const allTrades = [];
      const sessionMetrics = [];

      for (const entry of filteredEntries) {
        const sessionPnl = entry.daily_pnl || 0;
        const tradeCount = entry.trade_count || 0;
        const wins = entry.wins || 0;
        const losses = entry.losses || 0;

        sessionMetrics.push({
          entryId: entry.id,
          date: entry.entry_date,
          pnl: sessionPnl,
          tradeCount,
          wins,
          losses,
          ruleStatus: entry.rule_status || 'NONE',
          rulesBroken: entry.rules_broken || [],
          followedPlan: entry.followed_plan !== false
        });
      }

      // Calculate discipline metrics
      const disciplinedSessions = sessionMetrics.filter(s => s.ruleStatus === 'NONE').length;
      const minorBreaks = sessionMetrics.filter(s => s.ruleStatus === 'MINOR').length;
      const majorBreaks = sessionMetrics.filter(s => s.ruleStatus === 'MAJOR').length;
      const disciplineScore = (disciplinedSessions / sessionMetrics.length) * 100;

      // Calculate current discipline streak
      let currentStreak = 0;
      for (let i = sessionMetrics.length - 1; i >= 0; i--) {
        if (sessionMetrics[i].ruleStatus === 'NONE') {
          currentStreak++;
        } else {
          break;
        }
      }

      // Determine account risk signal
      const recentSessions = sessionMetrics.slice(-5);
      const recentMajorBreaks = recentSessions.filter(s => s.ruleStatus === 'MAJOR').length;
      const accountRisk = recentMajorBreaks >= 2 ? 'HIGH' : recentMajorBreaks === 1 ? 'ELEVATED' : 'LOW';

      // Determine discipline trend
      let trendLabel = 'CRITICAL';
      if (disciplineScore >= 90) trendLabel = 'STRONG';
      else if (disciplineScore >= 70) trendLabel = 'STABLE';
      else if (disciplineScore >= 50) trendLabel = 'AT_RISK';

      // Find most common trigger
      const allTriggers = sessionMetrics.flatMap(s => s.rulesBroken);
      const triggerCounts = {};
      allTriggers.forEach(t => {
        triggerCounts[t] = (triggerCounts[t] || 0) + 1;
      });
      const mostCommonTrigger = Object.keys(triggerCounts).length > 0
        ? Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0][0]
        : 'None identified';

      // Calculate performance metrics
      const totalNetPnl = sessionMetrics.reduce((sum, s) => sum + s.pnl, 0);
      const totalTrades = sessionMetrics.reduce((sum, s) => sum + s.tradeCount, 0);
      const totalWins = sessionMetrics.reduce((sum, s) => sum + s.wins, 0);
      const totalLosses = sessionMetrics.reduce((sum, s) => sum + s.losses, 0);

      const winRate = (totalWins + totalLosses) > 0 ? (totalWins / (totalWins + totalLosses)) * 100 : null;

      // Fetch individual trade entries for advanced metrics
      const allIndividualTrades = [];
      for (const entry of filteredEntries) {
        const tradesForEntry = await api.entities.TradeEntries.filter({
          date_key: entry.entry_date,
          user_id: currentUser.email,
          account_id: entry.account_id
        });
        allIndividualTrades.push(...tradesForEntry);
      }

      const winningTradesPnl = allIndividualTrades.filter(t => t.pnl_currency > 0).map(t => t.pnl_currency);
      const losingTradesPnl = allIndividualTrades.filter(t => t.pnl_currency < 0).map(t => t.pnl_currency);

      const grossProfit = winningTradesPnl.reduce((sum, pnl) => sum + pnl, 0);
      const grossLoss = losingTradesPnl.reduce((sum, pnl) => sum + Math.abs(pnl), 0);

      const averageWin = winningTradesPnl.length > 0 ? grossProfit / winningTradesPnl.length : null;
      const averageLoss = losingTradesPnl.length > 0 ? grossLoss / losingTradesPnl.length : null;

      const largestWin = winningTradesPnl.length > 0 ? Math.max(...winningTradesPnl) : null;
      const largestLoss = losingTradesPnl.length > 0 ? Math.min(...losingTradesPnl) : null;

      let profitFactor = null;
      if (grossProfit > 0 && grossLoss > 0) {
        profitFactor = grossProfit / grossLoss;
      }

      let expectancy = null;
      if (winningTradesPnl.length > 0 && losingTradesPnl.length > 0 && averageWin !== null && averageLoss !== null) {
        const pWin = winningTradesPnl.length / (winningTradesPnl.length + losingTradesPnl.length);
        const pLoss = losingTradesPnl.length / (winningTradesPnl.length + losingTradesPnl.length);
        expectancy = (pWin * averageWin) - (pLoss * averageLoss);
      }

      // Build equity curve
      const equityCurve = [];
      let runningEquity = 0;
      sessionMetrics.forEach(session => {
        runningEquity += session.pnl;
        equityCurve.push({
          date: session.date,
          equity: runningEquity,
          pnl: session.pnl,
          trades: session.tradeCount,
          ruleStatus: session.ruleStatus,
          accountId: session.accountId
        });
      });

      // Add account names to entries if in summary mode
      const entriesWithAccounts = isSummaryMode && allAccounts.length > 0
        ? filteredEntries.slice(0, 10).map(e => ({
          ...e,
          accountName: allAccounts.find(a => a.id === e.account_id)?.account_name || 'Unknown'
        }))
        : filteredEntries.slice(0, 10);

      return {
        completedSessions: sessionMetrics.length,
        entries: entriesWithAccounts,
        isSummaryMode,

        // Discipline Overview
        accountRisk,
        disciplineScore,
        trendLabel,
        currentStreak,
        mostCommonTrigger,

        // Performance Summary
        totalNetPnl,
        totalTrades,
        totalWins,
        totalLosses,
        winRate,

        averageWin,
        averageLoss,
        profitFactor,
        expectancy,
        largestWin,
        largestLoss,

        // Equity curve
        equityCurve,

        // Debug info
        debugInfo: {
          sessionsIncluded: sessionMetrics.length,
          sessionsExcluded: entries.length - filteredEntries.length,
          disciplinedSessions,
          minorBreaks,
          majorBreaks
        },

        // Mocking Today PnL for risk calc (In real app, fetch from open trades or account balance)
        todayPnL: -150, // Example
        dailyLossLimit: 500 // Example from Account settings?
      };
    },
    enabled: !!currentUser?.email && !!selectedAccountId,
    staleTime: 0, // Always fetch fresh
    cacheTime: 0 // Don't cache
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Signing you in...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !selectedAccountId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading verified dashboard...</p>
        </div>
      </div>
    );
  }

  const periods = [
    { value: '2D', label: '2 Days' },
    { value: '7D', label: '7 Days' },
    { value: '14D', label: '14 Days' },
    { value: '30D', label: '30 Days' },
    { value: '90D', label: '90 Days' },
    { value: 'ALL_TIME', label: 'All Time' },
    { value: 'CUSTOM', label: 'Custom Range' }
  ];

  // Empty state handling
  const isActuallyEmpty = !dashboardData || dashboardData.completedSessions === 0;
  const displayData = isActuallyEmpty ? DEMO_DATA : dashboardData;

  const needsUpgrade = currentUser?.subscriptionStatus === 'NONE' ||
    currentUser?.subscriptionStatus === 'PAST_DUE' ||
    currentUser?.subscriptionStatus === 'CANCELED';

  return (
    <TooltipProvider>
      <div className="min-h-screen premium-bg -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8">
        {/* Upgrade Banner */}
        {needsUpgrade && <UpgradeBanner />}

        {/* Summary Mode Banner */}
        {isSummaryMode && (
          <div className="bg-primary/10 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-primary-foreground">
                Summary (All Accounts) — Read-only aggregate view
              </p>
              <p className="text-xs text-primary-foreground/80 mt-1">
                Performance data combines completed sessions from all your accounts.
              </p>
            </div>
          </div>
        )}

        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">{currentUser?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400">
              {format(new Date(), 'EEEE, MMMM do, yyyy')}
            </p>
          </div>

          {/* Account Selector */}
          <div className="w-full md:w-auto">
            <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800/50 backdrop-blur-sm">
              <AccountSelector
                selectedAccountId={selectedAccountId}
                onAccountChange={(id) => {
                  setSelectedAccountId(id);
                  localStorage.setItem('selectedAccountId', id);
                  window.dispatchEvent(new CustomEvent('accountChanged', { detail: id }));
                }}
                accounts={allAccounts}
              />
            </div>
          </div>
        </div>

        {/* Header Controls (Refresh/Date) - Collapsed in new layout but available if needed */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Verified Performance</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-lg p-1 border border-border">
              {periods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => {
                    if (period.value === 'CUSTOM') {
                      setShowCustomDatePicker(!showCustomDatePicker);
                    } else {
                      setSelectedPeriod(period.value);
                      setShowCustomDatePicker(false);
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    selectedPeriod === period.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {period.label}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ['verifiedDashboard'] })}>
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Custom Date Picker */}
        {showCustomDatePicker && (
          <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 border border-border shadow-sm mb-6">
            <div className="flex items-center gap-3">
              <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="text-sm" />
              <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="text-sm" />
              <Button onClick={() => setSelectedPeriod('CUSTOM')} className="bg-primary text-primary-foreground" size="sm">Apply</Button>
            </div>
          </div>
        )}

        {/* Adaptive Session Intelligence */}
        <div className="space-y-6">
          <SessionGuidance
            riskData={{
              dailyLossPercent: displayData.dailyLossLimit ? ((Math.abs(displayData.todayPnL || 0)) / displayData.dailyLossLimit) * 100 : 0,
              // Pass other risk metrics if available
            }}
          />
          <TradingSessionsMap />
        </div>

        {/* Market Bias Gauges */}
        <MarketBiasGauges />

        {/* Primary KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-6">
          {/* Net P&L */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-6 hover:shadow-lg transition-all cursor-help relative group overflow-hidden">
                {displayData.isDemo && (
                  <div className="absolute top-2 right-12 px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Demo</span>
                  </div>
                )}
                <div className="absolute top-2 right-4 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronUp className="w-3 h-3 text-green-500" />
                  <span className="text-[10px] font-medium text-slate-400">Gold: Bullish</span>
                </div>
                <Info className="w-3 h-3 text-slate-400 absolute top-4 right-4 group-hover:opacity-0 transition-opacity" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Net P&L</p>
                <p className={cn(
                  "text-4xl font-bold mb-2 tabular-nums",
                  displayData.totalNetPnl >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {displayData.totalNetPnl >= 0 ? '+' : ''}${displayData.totalNetPnl.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {displayData.completedSessions} sessions
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-white">
              <p className="text-xs">Total profit/loss from completed entries</p>
            </TooltipContent>
          </Tooltip>

          {/* Win Rate */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-6 hover:shadow-lg transition-all cursor-help relative group overflow-hidden">
                <Info className="w-3 h-3 text-slate-400 absolute top-4 right-4 group-hover:opacity-0 transition-opacity" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Win Rate</p>
                <p className="text-4xl font-bold text-foreground mb-2 tabular-nums">
                  {displayData.winRate !== null ? `${displayData.winRate.toFixed(0)}%` : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {displayData.totalWins}W / {displayData.totalLosses}L
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-white">
              <p className="text-xs">{displayData.totalWins} wins out of {displayData.totalWins + displayData.totalLosses} trades</p>
            </TooltipContent>
          </Tooltip>

          {/* Profit Factor */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-6 hover:shadow-lg transition-all cursor-help relative group overflow-hidden">
                <div className="absolute top-2 right-4 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Activity className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] font-medium text-slate-400">NQ: Neutral</span>
                </div>
                <Info className="w-3 h-3 text-slate-400 absolute top-4 right-4 group-hover:opacity-0 transition-opacity" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Profit Factor</p>
                <p className={cn(
                  "text-4xl font-bold mb-2 tabular-nums",
                  displayData.profitFactor !== null && displayData.profitFactor >= 1.5
                    ? "text-green-600"
                    : "text-foreground"
                )}>
                  {displayData.profitFactor !== null ? displayData.profitFactor.toFixed(1) : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {displayData.profitFactor !== null
                    ? displayData.profitFactor >= 1.5 ? 'Strong' : displayData.profitFactor >= 1 ? 'Positive' : 'Needs work'
                    : 'Not established'}
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-white">
              <p className="text-xs">Gross profit ÷ gross loss • Values &gt;1.5 = strong</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 hover:shadow-md transition-all cursor-help relative">
                <Info className="w-3 h-3 text-slate-400 absolute top-3 right-3" />
                <p className="text-xs text-muted-foreground mb-2">Total Trades</p>
                <p className="text-xl font-bold text-foreground tabular-nums">{displayData.totalTrades}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-white">
              <p className="text-xs">Total trades executed</p>
            </TooltipContent>
          </Tooltip>

          {/* ... Other metrics (omitted for brevity, assume standard layout) ... */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 hover:shadow-md transition-all cursor-help relative">
                <p className="text-xs text-muted-foreground mb-2">Avg Win</p>
                <p className="text-xl font-bold text-green-600 tabular-nums">{displayData.averageWin ? `$${displayData.averageWin.toFixed(0)}` : 'N/A'}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-white"><p className="text-xs">Average profit per winning trade</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 hover:shadow-md transition-all cursor-help relative">
                <p className="text-xs text-muted-foreground mb-2">Avg Loss</p>
                <p className="text-xl font-bold text-red-600 tabular-nums">{displayData.averageLoss ? `$${Math.abs(displayData.averageLoss).toFixed(0)}` : 'N/A'}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-white"><p className="text-xs">Average loss per losing trade</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Discipline Panel */}
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl overflow-hidden mb-6 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Discipline Score</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Overall Score</p>
              <p className={cn("text-4xl font-bold tabular-nums", displayData.disciplineScore >= 70 ? "text-green-600" : "text-amber-600")}>
                {displayData.disciplineScore.toFixed(0)}/100
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Discipline Streak</p>
              <p className="text-3xl font-bold text-foreground tabular-nums">{displayData.currentStreak}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Risk Signal</p>
              <p className={cn("text-2xl font-bold tabular-nums", displayData.accountRisk === 'LOW' ? "text-green-600" : "text-red-600")}>
                {displayData.accountRisk}
              </p>
            </div>
          </div>
        </div>

        {/* Equity Growth Panel */}
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl overflow-hidden mb-6 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Equity Growth</h3>
          </div>
          <div className="p-6">
            {displayData.equityCurve.length >= 2 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayData.equityCurve}>
                    <defs>
                      <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(val) => format(new Date(val), 'MMM d')} />
                    <YAxis />
                    <Area type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={3} fill="url(#equityGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg"><p className="text-sm text-muted-foreground">Not enough data yet</p></div>
            )}
          </div>
        </div>

        {/* Recent Entries Panel */}
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Recent Sessions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr className="text-left">
                  <th className="p-3 text-xs font-semibold text-muted-foreground uppercase">Date</th>
                  <th className="p-3 text-xs font-semibold text-muted-foreground uppercase">P&L</th>
                  <th className="p-3 text-xs font-semibold text-muted-foreground uppercase">Trends</th>
                  <th className="p-3 text-xs font-semibold text-muted-foreground uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.entries.slice(0, 5).map(entry => (
                  <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-3"><p className="text-sm text-muted-foreground">{format(new Date(entry.entry_date), 'MMM d')}</p></td>
                    <td className="p-3"><p className={cn("text-sm font-bold", (entry.daily_pnl || 0) >= 0 ? "text-green-600" : "text-red-600")}>${(entry.daily_pnl || 0).toFixed(2)}</p></td>
                    <td className="p-3"><span className="text-xs bg-muted px-2 py-1 rounded">{entry.rule_status}</span></td>
                    <td className="p-3 text-right">
                      <Link to={`${createPageUrl('Journal')}?view=detail&id=${entry.id}`}>
                        <Button size="sm" variant="ghost">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Admin Debug Panel */}
        {currentUser?.role === 'admin' && (
          <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl overflow-hidden shadow-sm mt-6">
            <button onClick={() => setShowDebugPanel(!showDebugPanel)} className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <h3 className="text-sm font-semibold text-foreground">Debug Panel (Admin)</h3>
              {showDebugPanel ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {showDebugPanel && (
              <div className="p-6 border-t border-border space-y-4">
                <p className="text-xs text-muted-foreground">Sessions Included: {dashboardData.debugInfo.sessionsIncluded}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}