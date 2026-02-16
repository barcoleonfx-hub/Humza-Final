import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Shield,
  XCircle,
  Info
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  parseISO,
  startOfWeek,
  endOfWeek,
  getWeek,
  isSameDay
} from 'date-fns';
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  // Summary mode flag
  const isSummaryMode = selectedAccountId === 'SUMMARY_ALL';

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => { });
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

  // Fetch all accounts for summary mode
  const { data: allAccounts = [] } = useQuery({
    queryKey: ['allAccounts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await api.entities.TradingAccount.filter({ user_id: user.email });
    },
    enabled: !!user?.email && isSummaryMode
  });

  // Fetch completed journal entries only
  const { data: journalEntries = [], isLoading } = useQuery({
    queryKey: ['calendarJournalEntries', user?.email, selectedAccountId, currentDate],
    queryFn: async () => {
      if (!user?.email || !selectedAccountId) return [];

      if (isSummaryMode) {
        // Aggregate across all accounts
        const entries = await api.entities.JournalEntry.filter({
          created_by: user.email,
          status: 'registered'
        }, '-entry_date', 200);
        return entries.filter(e => e.account_id !== 'SUMMARY_ALL');
      }

      return await api.entities.JournalEntry.filter({
        created_by: user.email,
        account_id: selectedAccountId,
        status: 'registered'
      }, '-entry_date', 200);
    },
    enabled: !!user?.email && !!selectedAccountId
  });

  // Calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group entries by date
  const entriesByDate = {};
  journalEntries.forEach(entry => {
    if (!entriesByDate[entry.entry_date]) {
      entriesByDate[entry.entry_date] = [];
    }
    entriesByDate[entry.entry_date].push(entry);
  });

  // Compute weekly summaries
  const weeklyData = [];
  const weeks = [];
  let currentWeek = [];

  days.forEach((day, idx) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || idx === days.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  weeks.forEach((week) => {
    let weekPnL = 0;
    let tradingDays = 0;
    let totalTrades = 0;
    let disciplineScores = [];

    week.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayEntries = entriesByDate[dateKey] || [];

      if (dayEntries.length > 0) {
        tradingDays++;
        dayEntries.forEach(entry => {
          weekPnL += entry.daily_pnl || 0;
          totalTrades += entry.trade_count || 0;

          // Discipline score
          if (entry.rule_status === 'NONE') disciplineScores.push(1);
          else if (entry.rule_status === 'MINOR') disciplineScores.push(0.5);
          else if (entry.rule_status === 'MAJOR') disciplineScores.push(0);
        });
      }
    });

    const avgDiscipline = disciplineScores.length > 0
      ? disciplineScores.reduce((a, b) => a + b, 0) / disciplineScores.length
      : null;
    const avgTradesPerDay = tradingDays > 0 ? totalTrades / tradingDays : 0;

    weeklyData.push({
      weekPnL,
      tradingDays,
      avgTradesPerDay,
      avgDiscipline
    });
  });

  const selectedDayEntries = selectedDate
    ? entriesByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  const selectedDayMetrics = selectedDayEntries.length > 0
    ? {
      pnl: selectedDayEntries.reduce((sum, e) => sum + (e.daily_pnl || 0), 0),
      trades: selectedDayEntries.reduce((sum, e) => sum + (e.trade_count || 0), 0),
      wins: selectedDayEntries.reduce((sum, e) => sum + (e.wins || 0), 0),
      losses: selectedDayEntries.reduce((sum, e) => sum + (e.losses || 0), 0),
      ruleStatus: isSummaryMode && selectedDayEntries.length > 1 ? 'Mixed' : selectedDayEntries[0].rule_status,
      journalEntryId: selectedDayEntries[0].id,
      isSummaryMode,
      entries: selectedDayEntries
    }
    : null;

  if (!user || !selectedAccountId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Performance Calendar</h1>
          <p className="text-muted-foreground mt-1">Monthly view of your trading performance and discipline</p>
        </div>

        {/* Calendar */}
        <Card className="border-border">
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-bold text-foreground">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 px-6 py-3 bg-muted/50 border-b border-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, idx) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayEntries = entriesByDate[dateKey] || [];
                  const hasTrades = dayEntries.length > 0;
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());

                  const dayPnL = dayEntries.reduce((sum, e) => sum + (e.daily_pnl || 0), 0);
                  const dayTrades = dayEntries.reduce((sum, e) => sum + (e.trade_count || 0), 0);
                  const dayWins = dayEntries.reduce((sum, e) => sum + (e.wins || 0), 0);
                  const dayLosses = dayEntries.reduce((sum, e) => sum + (e.losses || 0), 0);
                  const ruleStatus = dayEntries[0]?.rule_status;

                  // Dynamic color intensity based on P&L
                  const pnlIntensity = Math.min(Math.abs(dayPnL) / 1000, 1); // Max intensity at $1000
                  const greenScale = `rgba(34, 197, 94, ${0.05 + pnlIntensity * 0.15})`;
                  const redScale = `rgba(239, 68, 68, ${0.05 + pnlIntensity * 0.15})`;

                  return (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => hasTrades && setSelectedDate(day)}
                          disabled={!hasTrades}
                          className={cn(
                            "min-h-24 rounded-lg p-2 flex flex-col transition-all relative border-[3px]",
                            !isCurrentMonth && "opacity-4 relative",
                            isToday && !hasTrades && "ring-2 ring-primary/50",
                            hasTrades && dayPnL >= 0 && "hover:brightness-95",
                            hasTrades && dayPnL < 0 && "hover:brightness-95",
                            !hasTrades && "bg-card border-border/50",
                            ruleStatus === 'NONE' && "border-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.15)]",
                            ruleStatus === 'MINOR' && "border-amber-500/80",
                            ruleStatus === 'MAJOR' && "border-red-500/80",
                            hasTrades && !ruleStatus && "border-border",
                            hasTrades && "cursor-pointer"
                          )}
                          style={hasTrades ? {
                            backgroundColor: dayPnL >= 0 ? greenScale : redScale
                          } : {}}
                        >
                          <span className={cn(
                            "text-xs font-semibold mb-1",
                            isToday ? "text-primary font-bold" : "text-muted-foreground"
                          )}>
                            {format(day, 'd')}
                          </span>

                          {hasTrades && (
                            <>
                              <span className={cn(
                                "text-lg font-bold mb-1 tracking-tight",
                                dayPnL >= 0 ? 'text-green-600' : 'text-red-500'
                              )}>
                                {dayPnL >= 0 ? '+' : '-'}${Math.abs(dayPnL) >= 1000
                                  ? (Math.abs(dayPnL) / 1000).toFixed(1) + 'k'
                                  : Math.abs(dayPnL).toFixed(0)}
                              </span>

                              <div className="mt-auto text-[10px] text-muted-foreground/80 font-medium space-y-0.5">
                                <p>{dayTrades} Trade{dayTrades !== 1 ? 's' : ''}</p>
                                <p className="text-foreground/60">{dayWins}W / {dayLosses}L</p>
                              </div>

                              <div className="absolute top-2 right-2">
                                {ruleStatus === 'NONE' && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm" />
                                )}
                                {ruleStatus === 'MINOR' && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm" />
                                )}
                                {ruleStatus === 'MAJOR' && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm" />
                                )}
                              </div>
                            </>
                          )}
                        </button>
                      </TooltipTrigger>
                      {hasTrades && (
                        <TooltipContent className="bg-slate-950 border-white/10 p-3 shadow-xl">
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(day, 'MMMM d')}</p>
                            <div className="flex justify-between gap-4">
                              <span className="text-xs text-white">Daily P&L</span>
                              <span className={cn("text-xs font-bold", dayPnL >= 0 ? "text-green-400" : "text-red-400")}>
                                {dayPnL >= 0 ? '+' : ''}${dayPnL.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-xs text-white">Efficiency</span>
                              <span className="text-xs font-bold text-blue-400">{((dayWins / (dayTrades || 1)) * 100).toFixed(0)}% Win Rate</span>
                            </div>
                            {dayEntries[0]?.notes && (
                              <p className="text-[10px] text-slate-400 italic max-w-[150px] border-t border-white/5 pt-2 mt-2 truncate">
                                "{dayEntries[0].notes}"
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-8 p-6 border-t border-border bg-muted/20">
            <div className="flex items-center gap-2 group cursor-help">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Plan Followed</span>
              <Tooltip>
                <TooltipTrigger asChild><Info className="w-3 h-3 text-slate-400 group-hover:text-primary transition-colors" /></TooltipTrigger>
                <TooltipContent>Strict adherence to trading rules and risk parameters.</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 group cursor-help">
              <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Minor Deviation</span>
              <Tooltip>
                <TooltipTrigger asChild><Info className="w-3 h-3 text-slate-400 group-hover:text-primary transition-colors" /></TooltipTrigger>
                <TooltipContent>Small oversight (e.g., missed entry, slight risk bump) that didn't break the EDGE.</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 group cursor-help">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Major Rule Break</span>
              <Tooltip>
                <TooltipTrigger asChild><Info className="w-3 h-3 text-slate-400 group-hover:text-primary transition-colors" /></TooltipTrigger>
                <TooltipContent>Significant violation of core trading strategy or risk management.</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </Card>

        {/* Weekly Summaries */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Weekly Summaries</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {weeklyData.map((week, idx) => (
              <Card key={idx} className="p-4 border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Week {idx + 1}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Net P&L</span>
                    <span className={cn(
                      "text-sm font-bold",
                      week.weekPnL >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {week.weekPnL >= 0 ? '+' : ''}${week.weekPnL.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Trading Days</span>
                    <span className="text-sm font-semibold text-foreground">{week.tradingDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Avg Trades/Day</span>
                    <span className="text-sm font-semibold text-foreground">
                      {week.avgTradesPerDay.toFixed(1)}
                    </span>
                  </div>
                  {week.avgDiscipline !== null && (
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">Discipline Score</span>
                      <span className={cn(
                        "text-sm font-bold",
                        week.avgDiscipline >= 0.8 ? "text-green-600" :
                          week.avgDiscipline >= 0.5 ? "text-amber-600" : "text-red-600"
                      )}>
                        {(week.avgDiscipline * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Session Detail Drawer */}
        <Sheet open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>
                {selectedDate && format(selectedDate, 'EEEE, MMM d, yyyy')}
              </SheetTitle>
            </SheetHeader>

            {selectedDayMetrics && (
              <div className="mt-6 space-y-6">
                {/* Session Snapshot */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 border-border">
                    <p className="text-xs text-muted-foreground mb-1">Net P&L</p>
                    <p className={cn(
                      "text-2xl font-bold",
                      selectedDayMetrics.pnl >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {selectedDayMetrics.pnl >= 0 ? '+' : ''}${selectedDayMetrics.pnl.toFixed(0)}
                    </p>
                  </Card>

                  <Card className="p-4 border-border">
                    <p className="text-xs text-muted-foreground mb-1">Trades</p>
                    <p className="text-2xl font-bold text-foreground">
                      {selectedDayMetrics.trades}
                    </p>
                  </Card>

                  <Card className="p-4 border-border">
                    <p className="text-xs text-muted-foreground mb-1">Win/Loss</p>
                    <p className="text-xl font-bold text-foreground">
                      {selectedDayMetrics.wins}W / {selectedDayMetrics.losses}L
                    </p>
                  </Card>

                  <Card className="p-4 border-border">
                    <p className="text-xs text-muted-foreground mb-1">Discipline</p>
                    <div className={cn(
                      "px-2 py-1 rounded text-xs font-semibold inline-flex",
                      selectedDayMetrics.ruleStatus === 'NONE' && "bg-green-100 text-green-700",
                      selectedDayMetrics.ruleStatus === 'MINOR' && "bg-amber-100 text-amber-700",
                      selectedDayMetrics.ruleStatus === 'MAJOR' && "bg-red-100 text-red-700",
                      selectedDayMetrics.ruleStatus === 'Mixed' && "bg-muted text-muted-foreground"
                    )}>
                      {selectedDayMetrics.ruleStatus === 'NONE' ? 'Followed' : selectedDayMetrics.ruleStatus}
                    </div>
                  </Card>
                </div>

                {/* Per-Account Breakdown in Summary Mode */}
                {selectedDayMetrics.isSummaryMode && selectedDayMetrics.entries.length > 1 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">Per-Account Breakdown</p>
                    {selectedDayMetrics.entries.map((entry, idx) => {
                      const accountName = allAccounts.find(a => a.id === entry.account_id)?.account_name || 'Unknown';
                      return (
                        <Card key={idx} className="p-3 border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">{accountName}</span>
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "text-sm font-bold",
                                (entry.daily_pnl || 0) >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {(entry.daily_pnl || 0) >= 0 ? '+' : ''}${(entry.daily_pnl || 0).toFixed(0)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {entry.trade_count || 0} trades
                              </span>
                              <Link to={`${createPageUrl('Journal')}?view=detail&id=${entry.id}`}>
                                <Button size="sm" variant="ghost" className="text-primary h-7 px-2">
                                  View
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* View Full Entry (only for single account) */}
                {!selectedDayMetrics.isSummaryMode && (
                  <Link to={`${createPageUrl('Journal')}?view=detail&id=${selectedDayMetrics.journalEntryId}`}>
                    <Button className="w-full bg-primary text-primary-foreground">
                      View Full Journal Entry
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}