import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Loader2,
  Eye,
  Plus,
  DollarSign,
  Calendar,
  BarChart3,
  Sparkles,
  Target,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Flame,
  Award,
  Zap
} from 'lucide-react';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function AccountDiscipline() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [dateRange, setDateRange] = useState(14);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  
  // Summary mode flag
  const isSummaryMode = selectedAccountId === 'SUMMARY_ALL';

  // Purchase form state
  const [purchaseForm, setPurchaseForm] = useState({
    firm: '',
    event_type: 'NEW',
    account_size: '',
    cost: '',
    reason: 'Blew account'
  });

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
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

  // Fetch journal entries for selected range
  const { data: journalEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['disciplineJournalEntries', user?.email, selectedAccountId, dateRange, customStartDate, customEndDate],
    queryFn: async () => {
      if (!user?.email || !selectedAccountId) return [];
      
      let startDate, endDate;
      if (dateRange === 'CUSTOM' && customStartDate && customEndDate) {
        startDate = customStartDate;
        endDate = customEndDate;
      } else {
        startDate = format(subDays(new Date(), typeof dateRange === 'number' ? dateRange : 14), 'yyyy-MM-dd');
        endDate = format(new Date(), 'yyyy-MM-dd');
      }
      
      let entries;
      if (isSummaryMode) {
        // Aggregate across all accounts
        entries = await api.entities.JournalEntry.filter({
          created_by: user.email,
          status: 'registered'
        }, '-entry_date', 200);
        entries = entries.filter(e => e.account_id !== 'SUMMARY_ALL');
      } else {
        entries = await api.entities.JournalEntry.filter({
          created_by: user.email,
          account_id: selectedAccountId,
          status: 'registered'
        }, '-entry_date', 200);
      }
      
      return entries.filter(e => e.entry_date >= startDate && e.entry_date <= endDate);
    },
    enabled: !!user?.email && !!selectedAccountId
  });

  // Fetch purchase events
  const { data: purchaseEvents = [] } = useQuery({
    queryKey: ['purchaseEvents', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await api.entities.AccountPurchaseEvent.filter({
        user_id: user.email
      }, '-created_date', 50);
    },
    enabled: !!user?.email
  });

  // Fetch cached insight
  const { data: cachedInsight } = useQuery({
    queryKey: ['disciplineInsight', user?.email, selectedAccountId, dateRange, customStartDate, customEndDate],
    queryFn: async () => {
      if (!user?.email || !selectedAccountId) return null;
      
      let startDate, endDate;
      if (dateRange === 'CUSTOM' && customStartDate && customEndDate) {
        startDate = customStartDate;
        endDate = customEndDate;
      } else {
        startDate = format(subDays(new Date(), typeof dateRange === 'number' ? dateRange : 14), 'yyyy-MM-dd');
        endDate = format(new Date(), 'yyyy-MM-dd');
      }
      
      const rangeKey = `${startDate}_${endDate}`;
      
      const insights = await api.entities.AccountDisciplineInsight.filter({
        user_id: user.email,
        account_id: selectedAccountId,
        date_range: rangeKey
      }, '-created_date', 1);
      
      return insights.length > 0 ? insights[0] : null;
    },
    enabled: !!user?.email && !!selectedAccountId
  });

  // Create purchase event mutation
  const createPurchaseMutation = useMutation({
    mutationFn: async (data) => {
      return await api.entities.AccountPurchaseEvent.create({
        user_id: user.email,
        account_id: selectedAccountId,
        ...data,
        cost: parseFloat(data.cost)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseEvents'] });
      setShowPurchaseDialog(false);
      setPurchaseForm({
        firm: '',
        event_type: 'NEW',
        account_size: '',
        cost: '',
        reason: 'Blew account'
      });
    }
  });

  // Compute discipline metrics
  const metrics = useMemo(() => {
    if (!journalEntries.length) {
      return {
        baseline: 0,
        minorDays: 0,
        majorDays: 0,
        overtradingDays: 0,
        recoveryRate: 0,
        lossChasingCount: 0,
        revengeRiskCount: 0,
        disciplineTrend: 'stable',
        lossChaseDetails: [],
        revengeDetails: [],
        dailyData: []
      };
    }

    // Sort by date
    const sorted = [...journalEntries].sort((a, b) => 
      new Date(a.entry_date) - new Date(b.entry_date)
    );

    // Compute baseline (median trades/day over last 30 days)
    const tradeCounts = sorted.map(e => e.trade_count || 0);
    const sortedCounts = [...tradeCounts].sort((a, b) => a - b);
    const baseline = sortedCounts.length > 0 
      ? sortedCounts[Math.floor(sortedCounts.length / 2)]
      : 0;

    // Daily data
    const dailyData = sorted.map(entry => ({
      date: entry.entry_date,
      pnl: entry.daily_pnl || 0,
      trades: entry.trade_count || 0,
      wins: entry.wins || 0,
      losses: entry.losses || 0,
      ruleStatus: entry.rule_status || 'NONE',
      rulesBroken: entry.rules_broken || [],
      journalEntryId: entry.id
    }));

    // Count rule breaks
    const minorDays = sorted.filter(e => e.rule_status === 'MINOR').length;
    const majorDays = sorted.filter(e => e.rule_status === 'MAJOR').length;

    // Overtrading days (>= baseline * 1.5)
    const overtradingThreshold = baseline * 1.5;
    const overtradingDays = sorted.filter(e => (e.trade_count || 0) >= overtradingThreshold).length;

    // Recovery quality
    let recoveries = 0;
    let redDays = 0;
    for (let i = 0; i < dailyData.length - 1; i++) {
      if (dailyData[i].pnl < 0) {
        redDays++;
        const nextDay = dailyData[i + 1];
        if (nextDay.ruleStatus === 'NONE' && nextDay.trades <= baseline * 1.2) {
          recoveries++;
        }
      }
    }
    const recoveryRate = redDays > 0 ? Math.round((recoveries / redDays) * 100) : 0;

    // Loss-chasing pattern
    const lossChaseDetails = [];
    for (let i = 0; i < dailyData.length - 1; i++) {
      if (dailyData[i].pnl < 0) {
        const nextDay = dailyData[i + 1];
        if (nextDay.trades >= overtradingThreshold) {
          lossChaseDetails.push({
            date: nextDay.date,
            prevPnl: dailyData[i].pnl,
            nextTrades: nextDay.trades
          });
        }
      }
    }

    // Revenge trading risk
    const revengeDetails = [];
    for (let i = 0; i < dailyData.length; i++) {
      if (dailyData[i].ruleStatus === 'MAJOR') {
        if (dailyData[i].trades >= overtradingThreshold) {
          revengeDetails.push({ date: dailyData[i].date, type: 'same_day' });
        } else if (i < dailyData.length - 1 && dailyData[i + 1].trades >= overtradingThreshold) {
          revengeDetails.push({ date: dailyData[i].date, type: 'next_day' });
        }
      }
    }

    // Discipline trend (major breaks week-over-week)
    let disciplineTrend = 'stable';
    if (sorted.length >= 14) {
      const lastWeek = sorted.slice(-7);
      const prevWeek = sorted.slice(-14, -7);
      const lastWeekMajor = lastWeek.filter(e => e.rule_status === 'MAJOR').length;
      const prevWeekMajor = prevWeek.filter(e => e.rule_status === 'MAJOR').length;
      
      if (lastWeekMajor > prevWeekMajor) {
        disciplineTrend = 'worsening';
      } else if (lastWeekMajor < prevWeekMajor) {
        disciplineTrend = 'improving';
      }
    }

    // Check for 3+ major in 14 days
    if (majorDays >= 3 && dateRange >= 14) {
      disciplineTrend = 'worsening';
    }

    return {
      baseline,
      minorDays,
      majorDays,
      overtradingDays,
      recoveryRate,
      lossChasingCount: lossChaseDetails.length,
      revengeRiskCount: revengeDetails.length,
      disciplineTrend,
      lossChaseDetails,
      revengeDetails,
      dailyData
    };
  }, [journalEntries, dateRange]);

  // Purchase analytics (last 30 days) - COMPUTED BEFORE suggestedFocus
  const purchaseAnalytics = useMemo(() => {
    if (!purchaseEvents.length) {
      return { spend30: 0, spendLifetime: 0, resets30: 0 };
    }

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    const recent = purchaseEvents.filter(e => 
      new Date(e.created_date) >= thirtyDaysAgo
    );

    const spend30 = recent.reduce((sum, e) => sum + (e.cost || 0), 0);
    const spendLifetime = purchaseEvents.reduce((sum, e) => sum + (e.cost || 0), 0);
    const resets30 = recent.filter(e => e.event_type === 'RESET' || e.event_type === 'RETRY').length;

    return { spend30, spendLifetime, resets30 };
  }, [purchaseEvents]);

  // Discipline level
  const disciplineLevel = useMemo(() => {
    const { majorDays, overtradingDays, recoveryRate } = metrics;
    
    if (majorDays >= 3 || overtradingDays >= 5 || recoveryRate < 30) {
      return { level: 'High Risk', color: 'red', signals: [] };
    } else if (majorDays >= 1 || overtradingDays >= 2) {
      return { level: 'Elevated', color: 'amber', signals: [] };
    } else {
      return { level: 'Low Risk', color: 'blue', signals: [] };
    }
  }, [metrics]);

  // Set signals
  disciplineLevel.signals = [];
  if (metrics.majorDays > 0) disciplineLevel.signals.push(`${metrics.majorDays} major rule breaks`);
  if (metrics.overtradingDays > 0) disciplineLevel.signals.push(`${metrics.overtradingDays} overtrading days`);
  if (metrics.recoveryRate < 50) disciplineLevel.signals.push('Low recovery rate');

  // Discipline Trend Score (0-100, read-only)
  const disciplineTrendScore = useMemo(() => {
    if (journalEntries.length < 3) {
      return null; // Insufficient data
    }

    const sorted = [...journalEntries].sort((a, b) => 
      new Date(a.entry_date) - new Date(b.entry_date)
    );

    // A) Rule Integrity Score (0-50)
    const ruleWeights = { 'NONE': 1.0, 'MINOR': 0.6, 'MAJOR': 0.2 };
    const ruleIntegrityRaw = sorted.reduce((sum, e) => {
      const weight = ruleWeights[e.rule_status] || 0.2;
      return sum + weight;
    }, 0) / sorted.length;
    const ruleIntegrity = ruleIntegrityRaw * 50;

    // B) Trade Frequency Control Score (0-30)
    const tradeCounts = sorted.map(e => e.trade_count || 0);
    const sortedCounts = [...tradeCounts].sort((a, b) => a - b);
    const baseline = sortedCounts.length > 0 
      ? sortedCounts[Math.floor(sortedCounts.length / 2)]
      : 0;
    
    let tradeFrequencyScore = 30;
    if (baseline > 0) {
      const overtradeDays = sorted.filter(e => (e.trade_count || 0) >= baseline * 1.5).length;
      tradeFrequencyScore = Math.max(0, 30 - (overtradeDays * 6));
    } else {
      tradeFrequencyScore = 15; // neutral
    }

    // C) Recovery Discipline Score (0-20)
    const stressDays = [];
    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      if (entry.rule_status === 'MAJOR' || (entry.daily_pnl && entry.daily_pnl < 0)) {
        stressDays.push(i);
      }
    }

    let recoveryScore = 20; // Default neutral-positive
    if (stressDays.length > 0) {
      let recoverySuccessCount = 0;
      for (const idx of stressDays) {
        if (idx < sorted.length - 1) {
          const nextDay = sorted[idx + 1];
          if (nextDay.rule_status === 'NONE') {
            recoverySuccessCount++;
          }
        }
      }
      recoveryScore = (recoverySuccessCount / stressDays.length) * 20;
    }

    const totalScore = Math.round(Math.min(100, Math.max(0, ruleIntegrity + tradeFrequencyScore + recoveryScore)));

    // Label
    let label = 'Critical';
    let color = 'red';
    if (totalScore >= 85) {
      label = 'Strong';
      color = 'blue';
    } else if (totalScore >= 70) {
      label = 'Stable';
      color = 'blue';
    } else if (totalScore >= 50) {
      label = 'At Risk';
      color = 'amber';
    }

    // Trend calculation
    let trend = null;
    let trendDiff = 0;
    if (sorted.length >= 6) {
      const midpoint = Math.floor(sorted.length / 2);
      const prevPeriod = sorted.slice(0, midpoint);
      const currPeriod = sorted.slice(midpoint);

      // Calculate previous score
      const prevRuleIntegrityRaw = prevPeriod.reduce((sum, e) => {
        const weight = ruleWeights[e.rule_status] || 0.2;
        return sum + weight;
      }, 0) / prevPeriod.length;
      const prevRuleIntegrity = prevRuleIntegrityRaw * 50;

      const prevTradeCounts = prevPeriod.map(e => e.trade_count || 0);
      const prevSortedCounts = [...prevTradeCounts].sort((a, b) => a - b);
      const prevBaseline = prevSortedCounts.length > 0 
        ? prevSortedCounts[Math.floor(prevSortedCounts.length / 2)]
        : 0;
      
      let prevTradeFrequencyScore = 30;
      if (prevBaseline > 0) {
        const prevOvertradeDays = prevPeriod.filter(e => (e.trade_count || 0) >= prevBaseline * 1.5).length;
        prevTradeFrequencyScore = Math.max(0, 30 - (prevOvertradeDays * 6));
      } else {
        prevTradeFrequencyScore = 15;
      }

      const prevStressDays = [];
      for (let i = 0; i < prevPeriod.length; i++) {
        const entry = prevPeriod[i];
        if (entry.rule_status === 'MAJOR' || (entry.daily_pnl && entry.daily_pnl < 0)) {
          prevStressDays.push(i);
        }
      }

      let prevRecoveryScore = 20;
      if (prevStressDays.length > 0) {
        let prevRecoverySuccessCount = 0;
        for (const idx of prevStressDays) {
          if (idx < prevPeriod.length - 1) {
            const nextDay = prevPeriod[idx + 1];
            if (nextDay.rule_status === 'NONE') {
              prevRecoverySuccessCount++;
            }
          }
        }
        prevRecoveryScore = (prevRecoverySuccessCount / prevStressDays.length) * 20;
      }

      const prevScore = Math.round(prevRuleIntegrity + prevTradeFrequencyScore + prevRecoveryScore);
      trendDiff = totalScore - prevScore;

      if (trendDiff >= 5) {
        trend = 'Improving';
      } else if (trendDiff <= -5) {
        trend = 'Worsening';
      } else {
        trend = 'Stable';
      }
    }

    // Explainability
    const followedDays = sorted.filter(e => e.rule_status === 'NONE').length;
    const followedPct = Math.round((followedDays / sorted.length) * 100);
    const overtradeDays = baseline > 0 ? sorted.filter(e => (e.trade_count || 0) >= baseline * 1.5).length : 0;
    const recoveryPct = stressDays.length > 0 
      ? Math.round((recoveryScore / 20) * 100)
      : 100;

    return {
      score: totalScore,
      label,
      color,
      breakdown: {
        ruleIntegrity: Math.round(ruleIntegrity),
        tradeFrequency: Math.round(tradeFrequencyScore),
        recovery: Math.round(recoveryScore)
      },
      trend,
      trendDiff,
      explainability: {
        followedPct,
        overtradeDays,
        recoveryPct
      }
    };
  }, [journalEntries]);

  // Discipline Streak (read-only)
  const disciplineStreak = useMemo(() => {
    if (journalEntries.length === 0) {
      return { current: 0, best: 0, hasData: false };
    }

    // Sort by date descending (most recent first)
    const sortedDesc = [...journalEntries].sort((a, b) => 
      new Date(b.entry_date) - new Date(a.entry_date)
    );

    // Group by date (handle multiple entries per day)
    const dateGroups = {};
    sortedDesc.forEach(entry => {
      const date = entry.entry_date;
      if (!dateGroups[date]) {
        dateGroups[date] = [];
      }
      dateGroups[date].push(entry);
    });

    // Convert to array of dates sorted descending
    const uniqueDates = Object.keys(dateGroups).sort((a, b) => 
      new Date(b) - new Date(a)
    );

    // Determine if each date is "followed" (all entries that day must be followed)
    const dateStatuses = uniqueDates.map(date => {
      const entries = dateGroups[date];
      const allFollowed = entries.every(e => e.rule_status === 'NONE');
      return { date, followed: allFollowed };
    });

    // Calculate current streak (from most recent date backwards)
    let currentStreak = 0;
    for (const status of dateStatuses) {
      if (status.followed) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate best streak (all time or last 90 days)
    const ninetyDaysAgo = subDays(new Date(), 90);
    const recentStatuses = dateStatuses.filter(s => 
      new Date(s.date) >= ninetyDaysAgo
    ).reverse(); // chronological order for best streak calculation

    let bestStreak = 0;
    let tempStreak = 0;
    for (const status of recentStatuses) {
      if (status.followed) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return {
      current: currentStreak,
      best: bestStreak,
      hasData: true
    };
  }, [journalEntries]);

  // Most Common Discipline Trigger (read-only)
  const mostCommonTrigger = useMemo(() => {
    if (journalEntries.length === 0) {
      return { trigger: null, count: 0, totalBreakSessions: 0, hasData: false };
    }

    // Filter entries with rule breaks
    const brokenEntries = journalEntries.filter(e => 
      e.rule_status === 'MINOR' || e.rule_status === 'MAJOR'
    );

    if (brokenEntries.length === 0) {
      return { trigger: null, count: 0, totalBreakSessions: 0, hasData: true };
    }

    // Count occurrences of each rule broken
    const triggerCounts = {};
    const triggerLastOccurrence = {};

    brokenEntries.forEach(entry => {
      if (entry.rules_broken && Array.isArray(entry.rules_broken)) {
        entry.rules_broken.forEach(rule => {
          triggerCounts[rule] = (triggerCounts[rule] || 0) + 1;
          // Track most recent occurrence for tie-breaking
          if (!triggerLastOccurrence[rule] || new Date(entry.entry_date) > new Date(triggerLastOccurrence[rule])) {
            triggerLastOccurrence[rule] = entry.entry_date;
          }
        });
      }
    });

    if (Object.keys(triggerCounts).length === 0) {
      return { trigger: null, count: 0, totalBreakSessions: brokenEntries.length, hasData: true };
    }

    // Find the most common trigger
    let maxCount = 0;
    let mostCommon = null;

    Object.entries(triggerCounts).forEach(([trigger, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = trigger;
      } else if (count === maxCount && mostCommon) {
        // Tie-breaker: use most recent occurrence
        if (new Date(triggerLastOccurrence[trigger]) > new Date(triggerLastOccurrence[mostCommon])) {
          mostCommon = trigger;
        }
      }
    });

    return {
      trigger: mostCommon,
      count: maxCount,
      totalBreakSessions: brokenEntries.length,
      hasData: true
    };
  }, [journalEntries]);

  // Compute suggested focus (rule-based, read-only)
  const suggestedFocus = useMemo(() => {
    if (journalEntries.length < 3) {
      return null; // Not enough data
    }

    const { majorDays, overtradingDays, recoveryRate, dailyData } = metrics;
    const avgTradesPerDay = dailyData.length > 0 
      ? dailyData.reduce((sum, d) => sum + d.trades, 0) / dailyData.length 
      : 0;

    // Check for rule breaks on profitable days
    const ruleBreaksOnGreenDays = dailyData.filter(d => d.pnl > 0 && d.ruleStatus !== 'NONE').length;

    // 1️⃣ Recovery Discipline (highest priority)
    if (majorDays >= 1 && recoveryRate < 30) {
      return {
        type: 'recovery',
        title: 'Recovery Discipline',
        color: 'red',
        why: 'Recent rule violations were not followed by structured recovery behavior.',
        goals: [
          'Mandatory cooldown day after any major rule break',
          'Journal recovery intent before next session'
        ],
        success: '1 red day followed by a fully disciplined session'
      };
    }

    // 2️⃣ Protect Winning Days
    if (ruleBreaksOnGreenDays > 0) {
      return {
        type: 'protect',
        title: 'Protect Winning Days',
        color: 'orange',
        why: 'Rule breaks occurred after profitable sessions.',
        goals: [
          'Stop trading after first rule deviation',
          'Max 2 trades per session'
        ],
        success: '7 consecutive sessions without rule violations'
      };
    }

    // 3️⃣ Reduce Trade Frequency
    if (overtradingDays >= 1 || avgTradesPerDay > metrics.baseline) {
      return {
        type: 'frequency',
        title: 'Reduce Trade Frequency',
        color: 'amber',
        why: 'Trade frequency exceeds your discipline baseline.',
        goals: [
          `Hard cap trades/day at ${metrics.baseline.toFixed(0)}`,
          'No re-entries after a loss'
        ],
        success: '3 consecutive sessions within trade limits'
      };
    }

    // 4️⃣ Capital Protection
    if (purchaseAnalytics.resets30 >= 1) {
      return {
        type: 'capital',
        title: 'Capital Protection',
        color: 'blue',
        why: 'Recent resets or account purchases indicate emotional risk escalation.',
        goals: [
          'No new account purchases for 7 days',
          'Mandatory reflection after any reset'
        ],
        success: '7 days without capital escalation'
      };
    }

    // 5️⃣ Maintain Discipline (default)
    return {
      type: 'maintain',
      title: 'Maintain Discipline',
      color: 'green',
      why: 'Recent sessions show stable execution and rule adherence.',
      goals: [
        'Maintain current limits',
        'Avoid increasing size or frequency'
      ],
      success: 'Discipline maintained across all sessions'
    };
  }, [journalEntries, metrics, purchaseAnalytics]);

  // Generate insight
  const handleGenerateInsight = async () => {
    if (!user?.email || !selectedAccountId || generatingInsight) return;

    setGeneratingInsight(true);
    try {
      let startDate, endDate;
      if (dateRange === 'CUSTOM' && customStartDate && customEndDate) {
        startDate = customStartDate;
        endDate = customEndDate;
      } else {
        startDate = format(subDays(new Date(), typeof dateRange === 'number' ? dateRange : 14), 'yyyy-MM-dd');
        endDate = format(new Date(), 'yyyy-MM-dd');
      }
      const rangeKey = `${startDate}_${endDate}`;
      
      const actualDays = dateRange === 'CUSTOM' 
        ? differenceInDays(new Date(endDate), new Date(startDate)) + 1
        : dateRange;

      // Use structured behavioral analysis prompt
      const prompt = `You are an AI behavioral analysis engine for a professional trading journal.

You do NOT provide financial advice.
You do NOT provide psychological counseling.
You analyze patterns only from confirmed journal entries.

Your role is to:
- Identify behavioral risk signals
- Explain discipline trends clearly
- Avoid judgment, motivation, or hype
- Speak to experienced traders

RECENT BEHAVIOR DATA (${actualDays} days):
- Total journal entries: ${journalEntries.length}
- Minor rule breaks: ${metrics.minorDays}
- Major rule breaks: ${metrics.majorDays}
- Overtrading days: ${metrics.overtradingDays}
- Recovery rate after losses: ${metrics.recoveryRate}%
- Loss-chasing incidents: ${metrics.lossChasingCount}
- Revenge trading risks: ${metrics.revengeRiskCount}
- Discipline trend: ${metrics.disciplineTrend}

ANALYSIS REQUIREMENTS:

1. "What's Working" (positive behaviors)
   - Identify consistent execution patterns
   - Acknowledge rule adherence when present
   - 2-3 short sentences maximum

2. "What's Risky" (concerning patterns)
   - Focus on repetition and sequence, not single outcomes
   - Explain how behavior increases future risk
   - Use professional language (no emotional labels)
   - 2-3 short sentences maximum

3. "One Focus" (single actionable improvement)
   - Most influential pattern to address
   - Explain how breaking the pattern reduces risk
   - Never imply inevitability
   - 1-2 sentences maximum

TONE GUIDELINES:
- Clear, neutral, analytical
- Maximum clarity, minimum words
- Prop-firm aware
- Non-judgmental

Avoid:
- Fear-based language
- Absolutes
- Motivational coaching
- Psychological diagnoses

Format your response with clear section headers.`;

      const response = await api.integrations.Core.InvokeLLM({
        prompt: prompt
      });

      const insightText = typeof response === 'string' ? response : response.output || 'No insight generated.';

      await api.entities.AccountDisciplineInsight.create({
        user_id: user.email,
        account_id: selectedAccountId,
        date_range: rangeKey,
        insight_text: insightText
      });

      queryClient.invalidateQueries({ queryKey: ['disciplineInsight'] });
    } catch (error) {
      console.error('Failed to generate insight:', error);
    } finally {
      setGeneratingInsight(false);
    }
  };

  if (!user || !selectedAccountId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Mode Banner */}
      {isSummaryMode && (
        <div className="bg-primary/10 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-primary-foreground">
              Summary (All Accounts) — Read-only aggregate view
            </p>
            <p className="text-xs text-primary-foreground/80 mt-1">
              Discipline metrics combine data from all accounts. Switch to a specific account to log purchases.
            </p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-500" />
          Account Discipline
        </h1>
        <p className="text-muted-foreground">A behavioral mirror for your trading. Not financial advice.</p>
        <p className="text-sm text-muted-foreground mt-1">This page tracks execution behavior, not outcomes.</p>
      </div>

      {/* Date Range Selector */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {[2, 7, 14, 30, 90].map((days) => (
            <Button
              key={days}
              onClick={() => {
                setDateRange(days);
                setShowCustomDatePicker(false);
              }}
              variant={dateRange === days ? 'default' : 'outline'}
              size="sm"
              className={cn(
                dateRange === days 
                  ? 'bg-primary text-primary-foreground'
                  : 'border-border'
              )}
            >
              Last {days} days
            </Button>
          ))}
          <Button
            onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
            variant={dateRange === 'CUSTOM' ? 'default' : 'outline'}
            size="sm"
            className={cn(
              dateRange === 'CUSTOM' 
                ? 'bg-primary text-primary-foreground'
                : 'border-border'
            )}
          >
            Custom Range
          </Button>
        </div>
        
        {showCustomDatePicker && (
          <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Custom Date Range</p>
            <div className="flex items-center gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Start Date</Label>
                <Input 
                  type="date" 
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1">End Date</Label>
                <Input 
                  type="date" 
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <Button
                onClick={() => {
                  if (customStartDate && customEndDate) {
                    setDateRange('CUSTOM');
                  }
                }}
                disabled={!customStartDate || !customEndDate}
                className="mt-5 bg-primary text-primary-foreground"
                size="sm"
              >
                Apply
              </Button>
            </div>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">Metrics update based on completed journal entries only.</p>
      </div>

      {/* Hero Strip: Discipline Status */}
      {journalEntries.length === 0 ? (
        <Card className="p-8 border border-border text-center">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No discipline data yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Account Discipline insights appear after your first completed journal entry.</p>
          <Link to={createPageUrl('Journal') + '?action=new'}>
            <Button className="bg-primary text-primary-foreground">
              → Create Your First Journal Entry
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Discipline Status */}
          <Card className="p-4 border border-border">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Discipline Status</p>
              <div className={cn(
                "inline-flex px-3 py-1 rounded-full text-sm font-semibold",
                disciplineLevel.color === 'blue' && "bg-blue-100 text-primary-foreground/80",
                disciplineLevel.color === 'amber' && "bg-amber-100 text-amber-700",
                disciplineLevel.color === 'red' && "bg-red-100 text-red-700"
              )}>
                {disciplineLevel.level}
              </div>
              {disciplineLevel.signals.length > 0 ? (
                <>
                  <p className="text-xs font-semibold text-muted-foreground mt-3">Why this matters</p>
                  <div className="space-y-1">
                    {disciplineLevel.signals.slice(0, 2).map((signal, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground">• {signal}</p>
                    ))}
                  </div>
                  {(metrics.majorDays > 0 || metrics.overtradingDays > 3) && (
                    <p className="text-xs text-muted-foreground italic mt-2">
                      Profitable days do not offset repeated discipline violations.
                    </p>
                  )}
                </>
              ) : null}
            </div>
          </Card>

          {/* Rule Integrity */}
          <Card className="p-4 border border-border">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Rule Break Days</p>
              <p className="text-2xl font-bold text-foreground">
                {metrics.minorDays + metrics.majorDays}
              </p>
              <p className="text-xs text-muted-foreground">
                {metrics.minorDays} minor · {metrics.majorDays} major
              </p>
              {metrics.majorDays > 0 && (
                <p className="text-xs text-muted-foreground italic mt-2">
                  Major breaks are behaviors historically linked to account failure.
                </p>
              )}
            </div>
          </Card>

          {/* Overtrading Pressure */}
          <Card className="p-4 border border-border">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Overtrading Days</p>
              <p className="text-2xl font-bold text-foreground">{metrics.overtradingDays}</p>
              <p className="text-xs text-muted-foreground">
                Baseline: {metrics.baseline.toFixed(1)} trades/day
              </p>
              <p className="text-xs text-muted-foreground italic mt-2">
                Overtrading increases emotional fatigue and execution errors.
              </p>
            </div>
          </Card>

          {/* Recovery Quality */}
          <Card className="p-4 border border-border">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Recovery Quality</p>
              {metrics.recoveryRate === 0 && metrics.dailyData.filter(d => d.pnl < 0).length === 0 ? (
                <>
                  <p className="text-lg font-bold text-foreground">Not established</p>
                  <p className="text-xs text-muted-foreground italic mt-2">
                    Recovery behavior is measured only after red or rule-break days.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">{metrics.recoveryRate}%</p>
                  <p className="text-xs text-muted-foreground">Red days followed by discipline</p>
                  <p className="text-xs text-muted-foreground italic mt-2">
                    Recovery quality measures how well discipline returns after losses or rule breaks.
                  </p>
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Discipline Trend Score & Streak */}
      {journalEntries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Discipline Trend Score */}
          <Card className="p-6 border border-border lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Discipline Trend Score
          </h3>

          {!disciplineTrendScore ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Score available after 3 journal entries.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score Display */}
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-slate-200"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(disciplineTrendScore.score / 100) * 351.86} 351.86`}
                        className={cn(
                          disciplineTrendScore.color === 'blue' && "text-blue-500",
                          disciplineTrendScore.color === 'amber' && "text-amber-500",
                          disciplineTrendScore.color === 'red' && "text-red-500"
                        )}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-foreground">{disciplineTrendScore.score}</div>
                        <div className="text-xs text-muted-foreground">/ 100</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <div className={cn(
                      "inline-flex px-4 py-2 rounded-lg text-lg font-semibold",
                      disciplineTrendScore.color === 'blue' && "bg-blue-100 text-primary-foreground/80",
                      disciplineTrendScore.color === 'amber' && "bg-amber-100 text-amber-700",
                      disciplineTrendScore.color === 'red' && "bg-red-100 text-red-700"
                    )}>
                      {disciplineTrendScore.label}
                    </div>
                  </div>

                  {disciplineTrendScore.trend && (
                    <div className="flex items-center gap-2">
                      {disciplineTrendScore.trend === 'Improving' && (
                        <>
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Improving</span>
                          <span className="text-xs text-muted-foreground">
                            +{disciplineTrendScore.trendDiff} vs previous period
                          </span>
                        </>
                      )}
                      {disciplineTrendScore.trend === 'Worsening' && (
                        <>
                          <TrendingDown className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-medium text-red-700">Worsening</span>
                          <span className="text-xs text-muted-foreground">
                            {disciplineTrendScore.trendDiff} vs previous period
                          </span>
                        </>
                      )}
                      {disciplineTrendScore.trend === 'Stable' && (
                        <>
                          <Minus className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Stable</span>
                          <span className="text-xs text-muted-foreground">
                            {disciplineTrendScore.trendDiff >= 0 ? '+' : ''}{disciplineTrendScore.trendDiff} vs previous period
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Score Breakdown */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Score Breakdown
                </p>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Rule Integrity</span>
                      <span className="text-sm font-semibold text-foreground">
                        {disciplineTrendScore.breakdown.ruleIntegrity}/50
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(disciplineTrendScore.breakdown.ruleIntegrity / 50) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Trade Frequency Control</span>
                      <span className="text-sm font-semibold text-foreground">
                        {disciplineTrendScore.breakdown.tradeFrequency}/30
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(disciplineTrendScore.breakdown.tradeFrequency / 30) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Recovery Discipline</span>
                      <span className="text-sm font-semibold text-foreground">
                        {disciplineTrendScore.breakdown.recovery}/20
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(disciplineTrendScore.breakdown.recovery / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainability */}
              <details className="group">
                <summary className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                  <ChevronDown className="w-4 h-4 group-open:hidden" />
                  <ChevronUp className="w-4 h-4 hidden group-open:block" />
                  Why this score?
                </summary>
                <div className="mt-3 pl-6 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    • Rule Integrity: {disciplineTrendScore.explainability.followedPct}% days followed plan
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • Overtrading: {disciplineTrendScore.explainability.overtradeDays} days above baseline
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • Recovery: {disciplineTrendScore.explainability.recoveryPct}% discipline after stress days
                  </p>
                </div>
              </details>
            </div>
          )}
          </Card>

          {/* Discipline Streak */}
          <Card className="p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Discipline Streak
            </h3>

            {!disciplineStreak.hasData ? (
              <div className="text-center py-8">
                <Flame className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Start journaling to build a streak.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Streak */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-50 to-orange-100 border-4 border-orange-200 mb-3">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {disciplineStreak.current}
                      </div>
                      <div className="text-xs text-orange-700 font-medium">
                        {disciplineStreak.current === 1 ? 'session' : 'sessions'}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Current Streak</p>
                  <p className="text-xs text-muted-foreground">
                    Consecutive sessions with "Followed plan"
                  </p>
                </div>

                {/* Best Streak */}
                {disciplineStreak.best > 0 && (
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-muted-foreground">Best Streak (90d)</span>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {disciplineStreak.best}
                      </span>
                    </div>
                  </div>
                )}

                {/* Motivational message */}
                {disciplineStreak.current === 0 && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center italic">
                      Start fresh — your next session can begin a new streak
                    </p>
                  </div>
                )}
                {disciplineStreak.current >= 5 && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center italic">
                      🔥 Strong consistency — keep it going!
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Most Common Discipline Trigger */}
          <Card className="p-6 border border-border">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Most Common Trigger
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Behavioral pattern observed across recent sessions.
            </p>

            {!mostCommonTrigger.hasData ? (
              <div className="text-center py-6">
                <Zap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No data yet</p>
              </div>
            ) : !mostCommonTrigger.trigger ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3 border-2 border-green-200">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  No discipline triggers detected
                </p>
                <p className="text-xs text-muted-foreground">
                  All recorded sessions followed the plan.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Trigger Display */}
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-lg font-bold text-amber-900 mb-1">
                        {mostCommonTrigger.trigger}
                      </p>
                      <p className="text-sm text-amber-700">
                        Triggered {mostCommonTrigger.count} {mostCommonTrigger.count === 1 ? 'time' : 'times'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Context */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    Observed in {mostCommonTrigger.totalBreakSessions} {mostCommonTrigger.totalBreakSessions === 1 ? 'session' : 'sessions'} with rule deviations
                  </p>
                  <p className="italic text-muted-foreground">
                    This trigger appears most frequently when discipline is compromised.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Discipline Timeline */}
      <Card className="p-6 border border-border">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Discipline Timeline
          </h3>
          <p className="text-sm text-muted-foreground mt-1">A chronological view of behavior and outcomes.</p>
        </div>
        
        {entriesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : metrics.dailyData.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-semibold text-foreground mb-2">No discipline events yet</h4>
            <p className="text-sm text-muted-foreground mb-1">Timeline entries are generated from saved journal sessions, including rule selections.</p>
            <p className="text-xs text-muted-foreground mt-2">Discipline data saves only after completing the full journal flow.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {metrics.dailyData.map((day, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 w-24">
                  <p className="text-sm font-medium text-foreground">
                    {format(parseISO(day.date), 'MMM d')}
                  </p>
                </div>
                
                <div className={cn(
                  "w-16 text-center px-2 py-1 rounded text-sm font-semibold",
                  day.pnl >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {day.pnl >= 0 ? '+' : ''}{day.pnl.toFixed(0)}
                </div>

                <div className={cn(
                  "px-2 py-1 rounded text-xs font-medium uppercase",
                  day.ruleStatus === 'NONE' && "bg-green-50 text-green-600",
                  day.ruleStatus === 'MINOR' && "bg-amber-50 text-amber-600",
                  day.ruleStatus === 'MAJOR' && "bg-red-50 text-red-600"
                )}>
                  {day.ruleStatus === 'NONE' ? 'Followed' : day.ruleStatus}
                </div>

                <div className="text-sm text-muted-foreground">
                  {day.trades} trades ({day.wins}W / {day.losses}L)
                </div>

                <div className="ml-auto">
                  <Link to={`${createPageUrl('Journal')}?view=detail&id=${day.journalEntryId}`}>
                    <Button size="sm" variant="outline" className="border-blue-200 text-primary">
                      <Eye className="w-3 h-3 mr-1" />
                      View Journal Entry
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pattern Detectors */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Pattern Signals</h3>
          <p className="text-sm text-muted-foreground mt-1">Repeated behaviors detected across entries.</p>
        </div>
        
        {metrics.lossChasingCount === 0 && metrics.revengeRiskCount === 0 && metrics.disciplineTrend !== 'worsening' ? (
          <Card className="p-8 border border-border text-center">
            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-semibold text-foreground mb-2">Patterns will appear here</h4>
            <p className="text-sm text-muted-foreground mb-1">Behavioral patterns require multiple journal entries to detect repetition.</p>
            <p className="text-xs text-muted-foreground mt-2 italic">Consistency reveals patterns — not single trades.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Loss-Chasing Pattern */}
            {metrics.lossChasingCount > 0 && (
              <Card className="p-4 border-l-4 border-l-red-500 bg-red-50/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">Loss-Chasing Pattern</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Triggered {metrics.lossChasingCount} {metrics.lossChasingCount === 1 ? 'time' : 'times'} in selected range
                    </p>
                    {metrics.lossChaseDetails.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Most recent: {format(parseISO(metrics.lossChaseDetails[metrics.lossChaseDetails.length - 1].date), 'MMM d')}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">Confidence: High</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Revenge Trading Risk */}
            {metrics.revengeRiskCount > 0 && (
              <Card className="p-4 border-l-4 border-l-orange-500 bg-orange-50/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">Revenge Trading Risk</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Triggered {metrics.revengeRiskCount} {metrics.revengeRiskCount === 1 ? 'time' : 'times'} in selected range
                    </p>
                    {metrics.revengeDetails.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Most recent: {format(parseISO(metrics.revengeDetails[metrics.revengeDetails.length - 1].date), 'MMM d')}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">Confidence: High</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Discipline Drift */}
            {metrics.disciplineTrend === 'worsening' && (
              <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50/30">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-amber-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">Discipline Drift</h4>
                    <p className="text-sm text-muted-foreground">
                      Trend: {metrics.disciplineTrend}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Confidence: High</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Suggested Focus (Next 7 Days) */}
      <Card className="p-6 border border-border">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Suggested Focus (Next 7 Days)</h3>
          <p className="text-sm text-muted-foreground mt-1">Personalized execution priorities based on your recent behavior.</p>
        </div>

        {!suggestedFocus ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Suggested Focus will appear once enough journal data is available.</p>
          </div>
        ) : (
          <div className={cn(
            "p-6 rounded-lg border-l-4",
            suggestedFocus.color === 'red' && "bg-red-50/50 border-l-red-500",
            suggestedFocus.color === 'orange' && "bg-orange-50/50 border-l-orange-500",
            suggestedFocus.color === 'amber' && "bg-amber-50/50 border-l-amber-500",
            suggestedFocus.color === 'blue' && "bg-primary/10/50 border-l-blue-500",
            suggestedFocus.color === 'green' && "bg-green-50/50 border-l-green-500"
          )}>
            <div className="flex items-start gap-3 mb-4">
              <Target className={cn(
                "w-6 h-6 mt-1",
                suggestedFocus.color === 'red' && "text-red-600",
                suggestedFocus.color === 'orange' && "text-orange-600",
                suggestedFocus.color === 'amber' && "text-amber-600",
                suggestedFocus.color === 'blue' && "text-primary",
                suggestedFocus.color === 'green' && "text-green-600"
              )} />
              <div className="flex-1">
                <h4 className="text-xl font-bold text-foreground mb-1">
                  🎯 Primary Focus: {suggestedFocus.title}
                </h4>
              </div>
            </div>

            <div className="space-y-4">
              {/* Why this matters */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Why this matters
                </p>
                <p className="text-sm text-slate-800">
                  {suggestedFocus.why}
                </p>
              </div>

              {/* Next 7-Day Goal */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Next 7-Day Goal
                </p>
                <div className="space-y-2">
                  {suggestedFocus.goals.map((goal, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-slate-800">{goal}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Success Signal */}
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Success Signal
                </p>
                <p className="text-sm text-slate-800 font-medium">
                  "{suggestedFocus.success}"
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* AI Insight (Manual) */}
      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            AI Insight (Optional)
          </h3>
          <Button
            onClick={handleGenerateInsight}
            disabled={generatingInsight}
            size="sm"
            className="bg-primary text-primary-foreground"
          >
            {generatingInsight ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Insight
              </>
            )}
          </Button>
        </div>

        {cachedInsight ? (
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {cachedInsight.insight_text}
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Generated {format(parseISO(cachedInsight.created_date), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Click "Generate Insight" to get an AI summary of your discipline patterns. This uses credits and is cached.
          </p>
        )}
      </Card>

      {/* Account Spend Module */}
      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-500" />
              Account Spend & Resets
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Log prop account purchases and resets to stay accountable.</p>
            <p className="text-xs text-muted-foreground mt-1 italic">Capital recycling is often emotional, not strategic.</p>
          </div>
          <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="bg-primary text-primary-foreground"
                disabled={isSummaryMode}
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Purchase
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Account Purchase</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Firm</Label>
                  <Input
                    value={purchaseForm.firm}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, firm: e.target.value })}
                    placeholder="e.g., FTMO, Topstep, Apex"
                  />
                </div>
                <div>
                  <Label>Event Type</Label>
                  <Select
                    value={purchaseForm.event_type}
                    onValueChange={(value) => setPurchaseForm({ ...purchaseForm, event_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New Account</SelectItem>
                      <SelectItem value="RESET">Reset</SelectItem>
                      <SelectItem value="RETRY">Retry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Account Size</Label>
                  <Input
                    value={purchaseForm.account_size}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, account_size: e.target.value })}
                    placeholder="e.g., 50K, 100K"
                  />
                </div>
                <div>
                  <Label>Cost ($)</Label>
                  <Input
                    type="number"
                    value={purchaseForm.cost}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Reason</Label>
                  <Select
                    value={purchaseForm.reason}
                    onValueChange={(value) => setPurchaseForm({ ...purchaseForm, reason: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Blew account">Blew account</SelectItem>
                      <SelectItem value="Scaling">Scaling</SelectItem>
                      <SelectItem value="Fresh start">Fresh start</SelectItem>
                      <SelectItem value="Emotional reset">Emotional reset</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => createPurchaseMutation.mutate(purchaseForm)}
                  disabled={!purchaseForm.firm || !purchaseForm.cost || createPurchaseMutation.isPending || isSummaryMode}
                  className="w-full bg-primary text-primary-foreground"
                >
                  {createPurchaseMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Purchase'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Spend (30d)</p>
            <p className="text-2xl font-bold text-foreground">${purchaseAnalytics.spend30.toFixed(0)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Lifetime Spend</p>
            <p className="text-2xl font-bold text-foreground">${purchaseAnalytics.spendLifetime.toFixed(0)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Resets (30d)</p>
            <p className="text-2xl font-bold text-foreground">{purchaseAnalytics.resets30}</p>
          </div>
        </div>

        {purchaseAnalytics.resets30 > 2 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              ⚠️ Frequent resets often correlate with revenge trading.
            </p>
          </div>
        )}

        {/* Purchase Events Table */}
        {purchaseEvents.length > 0 ? (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                  <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Firm</th>
                  <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Type</th>
                  <th className="p-3 text-right text-xs font-semibold text-muted-foreground">Cost</th>
                  <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseEvents.slice(0, 10).map((event) => (
                  <tr key={event.id} className="hover:bg-muted/50">
                    <td className="p-3 text-sm text-muted-foreground">
                      {format(parseISO(event.created_date), 'MMM d, yyyy')}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{event.firm}</td>
                    <td className="p-3 text-sm">
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        event.event_type === 'NEW' && "bg-green-100 text-green-700",
                        event.event_type === 'RESET' && "bg-amber-100 text-amber-700",
                        event.event_type === 'RETRY' && "bg-blue-100 text-primary-foreground/80"
                      )}>
                        {event.event_type}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-right font-semibold text-foreground">
                      ${event.cost.toFixed(2)}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{event.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-semibold text-foreground mb-2">No spend activity recorded</h4>
            <p className="text-sm text-muted-foreground mb-1">Optional — logging purchases helps identify emotional capital decisions.</p>
            <p className="text-xs text-muted-foreground mt-2">This does not connect to prop firms or payment providers.</p>
          </div>
        )}
      </Card>
    </div>
  );
}