import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Brain, 
  Loader2, 
  TrendingUp, 
  AlertCircle,
  Sparkles,
  Calendar,
  Target,
  Award,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function LearningCompanion() {
  const [currentUser, setCurrentUser] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['dailyInsights', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return api.entities.DailyInsight.filter({ user_id: currentUser.email }, '-insight_date', 30);
    },
    enabled: !!currentUser?.email,
  });

  const { data: todayInsight, refetch: refetchTodayInsight } = useQuery({
    queryKey: ['todayInsight', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayInsights = await api.entities.DailyInsight.filter({ 
        user_id: currentUser.email,
        insight_date: today
      });
      return todayInsights.length > 0 ? todayInsights[0] : null;
    },
    enabled: !!currentUser?.email,
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ insightId, helpful, feedback }) => 
      api.entities.DailyInsight.update(insightId, {
        helpful_rating: helpful ? 5 : 1,
        improvement_feedback: feedback || null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayInsight'] });
      setShowFeedbackInput(false);
      setFeedbackText('');
    },
  });

  const generateInsightMutation = useMutation({
    mutationFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const last5Days = format(subDays(new Date(), 5), 'yyyy-MM-dd');

      // Get ALL real data
      const allTrades = await api.entities.Trade.filter({ 
        created_by: currentUser.email 
      }, '-date', 200);

      const todayTrades = allTrades.filter(t => t.date === today);
      const last5DaysTrades = allTrades.filter(t => t.date >= last5Days);

      // Check for journal entries
      const allJournalEntries = await api.entities.JournalEntry.filter({
        created_by: currentUser.email
      }, '-entry_date', 200);

      if (todayTrades.length === 0 && last5DaysTrades.length === 0 && allJournalEntries.length === 0) {
        throw new Error('No data available yet. Please add journal entries with your trading data first.');
      }

      // Get journal entries with images
      const todayJournals = await api.entities.JournalEntry.filter({
        created_by: currentUser.email,
        entry_date: today
      });

      const recentJournals = await api.entities.JournalEntry.filter({
        created_by: currentUser.email
      }, '-entry_date', 5);

      // Get emotions
      const recentEmotions = await api.entities.EmotionEntry.filter({
        created_by: currentUser.email
      }, '-timestamp', 10);

      // Get user's past feedback preferences
      const pastInsightsWithFeedback = insights.filter(i => i.improvement_feedback);
      const userPreferences = pastInsightsWithFeedback.length > 0
        ? pastInsightsWithFeedback.slice(0, 3).map(i => i.improvement_feedback).join(' | ')
        : 'No prior feedback yet';

      // COMPUTE EXACT STATS (TODAY)
      const todayStats = {
        totalTrades: todayTrades.length,
        wins: todayTrades.filter(t => t.pnl_amount > 0).length,
        losses: todayTrades.filter(t => t.pnl_amount < 0).length,
        breakeven: todayTrades.filter(t => t.pnl_amount === 0).length,
        netPnL: todayTrades.reduce((sum, t) => sum + (t.pnl_amount || 0), 0),
        avgPnL: todayTrades.length > 0 ? todayTrades.reduce((sum, t) => sum + (t.pnl_amount || 0), 0) / todayTrades.length : 0,
        largestWin: todayTrades.length > 0 ? Math.max(...todayTrades.map(t => t.pnl_amount || 0)) : 0,
        largestLoss: todayTrades.length > 0 ? Math.min(...todayTrades.map(t => t.pnl_amount || 0)) : 0,
        ruleViolations: todayTrades.filter(t => t.rule_violation).length,
        outsideKillZone: todayTrades.filter(t => !['London', 'NY', 'London Close'].includes(t.session)).length
      };

      // COMPUTE EXACT STATS (LAST 5 DAYS)
      const last5Stats = {
        totalTrades: last5DaysTrades.length,
        wins: last5DaysTrades.filter(t => t.pnl_amount > 0).length,
        losses: last5DaysTrades.filter(t => t.pnl_amount < 0).length,
        netPnL: last5DaysTrades.reduce((sum, t) => sum + (t.pnl_amount || 0), 0),
        avgPnL: last5DaysTrades.length > 0 ? last5DaysTrades.reduce((sum, t) => sum + (t.pnl_amount || 0), 0) / last5DaysTrades.length : 0,
        mostCommonSession: getMostCommon(last5DaysTrades.map(t => t.session).filter(Boolean)),
        avgRisk: last5DaysTrades.length > 0 ? last5DaysTrades.reduce((sum, t) => sum + (t.risk_percent || 1), 0) / last5DaysTrades.length : 0,
        maxRisk: last5DaysTrades.length > 0 ? Math.max(...last5DaysTrades.map(t => t.risk_percent || 1)) : 0,
      };

      // Group trades by day for best/worst day
      const dayPnL = {};
      last5DaysTrades.forEach(t => {
        dayPnL[t.date] = (dayPnL[t.date] || 0) + (t.pnl_amount || 0);
      });
      const days = Object.entries(dayPnL);
      const bestDay = days.length > 0 ? days.reduce((a, b) => a[1] > b[1] ? a : b) : null;
      const worstDay = days.length > 0 ? days.reduce((a, b) => a[1] < b[1] ? a : b) : null;

      // ANALYZE IMAGES (if any)
      let imageAnalysisResults = '';
      const todayImages = todayJournals.flatMap(j => j.chart_screenshots || []);

      if (todayImages.length > 0) {
        const imagePromises = todayImages.slice(0, 5).map(async (imgUrl, idx) => {
          const imgPrompt = `You are an expert trading coach with forensic-level attention to detail. Analyze this image with surgical precision.

      STEP 1: IMAGE TYPE IDENTIFICATION
      State clearly: "This is a [P&L screenshot / Trading chart / Execution window / Other]"

      STEP 2: FORENSIC DATA EXTRACTION

      IF P&L/PERFORMANCE SCREENSHOT:
      Extract EVERY visible number and label:
      - Platform name (Tradovate, NinjaTrader, TradingView, etc.)
      - Account balance: $X.XX (if visible)
      - Daily P&L: $X.XX or (X.XX) for loss
      - Net P&L: $X.XX
      - Gross profit: $X.XX
      - Gross loss: $X.XX
      - Commission/fees: $X.XX
      - Total trades: X
      - Winning trades: X (X%)
      - Losing trades: X (X%)
      - Breakeven trades: X
      - Largest win: $X.XX
      - Largest loss: $X.XX
      - Average win: $X.XX
      - Average loss: $X.XX
      - Win rate: X%
      - Profit factor: X.XX (if visible)
      - Max drawdown: $X.XX or X% (if visible)
      - Consecutive wins/losses: X (if visible)
      - Time range visible: "From HH:MM to HH:MM" or "Session: Asia/London/NY"
      - Any timestamps visible on trades

      CRITICAL P&L EXTRACTION RULES:
      1. If multiple accounts are visible, list EACH account separately with its P&L
      2. Look for any subtotals or account labels
      3. If you see session breakdowns (Asia/London/NY), list them separately
      4. State if this appears to be partial day or full day results
      5. Note any visible gaps in trade history

      CROSS-VALIDATION CHECK:
      - Does trade count match the visible rows?
      - Do individual trade P&Ls sum to the stated total? (if calculable)
      - Are there any discrepancies? State them explicitly.

      IF TRADING CHART:
      Provide a structured breakdown:

      **TIMEFRAME & TIME CONTEXT**
      - Timeframe: [1m/5m/15m/1H/4H/Daily - state if visible, otherwise "Not visible"]
      - Visible time range: From [time] to [time]
      - Session context: "This shows [Asia/London/NY/London Close] session" (if identifiable)
      - Midnight Open visible: Yes/No
      - Session high/low marked: Yes/No

      **MARKET STRUCTURE (FACTUAL ONLY)**
      - Current trend direction based on visible swing structure: [Bullish HH/HL / Bearish LH/LL / Ranging / Unclear]
      - Most recent swing high: $X.XX (approximate if visible)
      - Most recent swing low: $X.XX (approximate if visible)
      - Break of structure: Yes/No - if yes, describe location and direction
      - Displacement evident: Yes/No - describe where

      **MIDNIGHT OPEN ANALYSIS** (if visible)
      - Midnight Open level: $X.XX (or "Not marked")
      - Current price vs Midnight Open: [Above / Below / At]
      - Has Midnight Open been swept? Yes/No
      - If swept, describe: "Price swept Midnight Open to $X.XX then [reclaimed/rejected]"

      **SESSION LEVELS** (only if clearly marked)
      - Asia range: High $X.XX, Low $X.XX (or "Not visible")
      - London range: High $X.XX, Low $X.XX (or "Not visible")
      - NY range: High $X.XX, Low $X.XX (or "Not visible")
      - Which session levels have been swept: List them

      **LIQUIDITY & KEY LEVELS**
      - Equal highs/lows: [Describe location and price if visible]
      - Obvious liquidity pools: [Describe]
      - Support/resistance levels marked by trader: [List with approximate prices]
      - FVG/IFVG zones marked: [Describe location and size if visible]
      - Order blocks marked: [Describe if visible]

      **TRADER'S ANNOTATIONS & EXECUTION**
      List every visible marking:
      - Entry point: $X.XX (if marked)
      - Stop loss: $X.XX (if marked)
      - Take profit targets: $X.XX, $X.XX (if marked)
      - Labels visible: [List all text labels]
      - Lines/zones drawn: [Describe each]
      - Trade direction indicated: [Long/Short/Unclear]

      **EXECUTION QUALITY ASSESSMENT**
      Based on visible evidence:
      - Entry location: [At key level / Chasing / FOMO entry / Optimal / Suboptimal]
      - Stop placement: [Logical / Too tight / Too wide / Not visible]
      - Risk-reward ratio: [X:X if calculable, or "Not calculable"]
      - Timing: [During kill zone / Outside kill zone / Unclear]
      - Setup quality: [High-probability / Low-probability / Unclear]

      Evidence for assessment:
      [List specific observations: e.g., "Entry after liquidity sweep", "Stop placed beyond structure", "Entered during range, not breakout"]

      **PRICE ACTION DETAILS**
      - Candlestick patterns visible: [List any: engulfing, pin bar, inside bar, etc.]
      - Momentum shifts: [Describe where visible]
      - Volume indicators: [If visible, describe]
      - Other indicators present: [List: MA, RSI, etc. - only if visible]

      **POTENTIAL ISSUES DETECTED**
      - Red flags: [FOMO entry / Poor stop / Overleveraging / Counter-trend / etc.]
      - Positive signs: [Good entry / Patient / Structure respected / etc.]

      IF EXECUTION WINDOW:
      - Platform: [Name]
      - Order type: [Market/Limit/Stop]
      - Instrument: [Symbol]
      - Quantity: X contracts/shares
      - Entry price: $X.XX
      - Current price: $X.XX (if visible)
      - Stop loss: $X.XX (if visible)
      - Take profit: $X.XX (if visible)
      - P&L: $X.XX (if visible)
      - Slippage: $X.XX or X ticks (if calculable)
      - Fills: [Single fill / Multiple fills - describe]

      STEP 3: BEHAVIORAL INSIGHTS
      Based on the visible evidence, what does this image reveal about the trader's:
      - Discipline: [Evidence-based assessment]
      - Patience: [Evidence-based assessment]
      - Risk management: [Evidence-based assessment]
      - Execution skill: [Evidence-based assessment]

      STEP 4: QUESTIONS THIS IMAGE RAISES
      List 2-3 questions the coach should ask the trader based on what's visible:
      Example: "Why did you enter at that price given the prior rejection?"

      MANDATORY FORMAT:
      Use clear headers and bullet points. Start with image type identification.
      Be exhaustively descriptive but ONLY with visible information.
      For every metric, state if it's "Not visible" when you can't see it.
      Use exact numbers whenever visible, don't round excessively.

      Return comprehensive findings.`;

          const result = await api.integrations.Core.InvokeLLM({
            prompt: imgPrompt,
            file_urls: [imgUrl],
          });

          return `**Image ${idx + 1}:**\n${result}`;
        });

        const results = await Promise.all(imagePromises);
        imageAnalysisResults = results.join('\n\n');
      } else {
        imageAnalysisResults = 'No images uploaded today.';
      }

      // AI COACHING PROMPT
      const coachingPrompt = `You are an elite trading performance coach analyzing REAL trading data with extreme precision.

      USER PREFERENCES FROM PAST FEEDBACK:
      ${userPreferences}

      TODAY'S EXACT STATS (${today}):
      - Trades taken: ${todayStats.totalTrades}
      - Wins: ${todayStats.wins} | Losses: ${todayStats.losses} | Breakeven: ${todayStats.breakeven}
      - Net P&L: ${todayStats.netPnL >= 0 ? '+' : ''}$${todayStats.netPnL.toFixed(2)}
      - Avg P&L per trade: ${todayStats.avgPnL >= 0 ? '+' : ''}$${todayStats.avgPnL.toFixed(2)}
      - Largest win: $${todayStats.largestWin.toFixed(2)} | Largest loss: $${Math.abs(todayStats.largestLoss).toFixed(2)}
      - Rule violations: ${todayStats.ruleViolations}

      LAST 5 DAYS STATS:
      - Total trades: ${last5Stats.totalTrades}
      - Win/Loss ratio: ${last5Stats.wins}W / ${last5Stats.losses}L
      - Net P&L: ${last5Stats.netPnL >= 0 ? '+' : ''}$${last5Stats.netPnL.toFixed(2)}
      - Avg P&L per trade: ${last5Stats.avgPnL >= 0 ? '+' : ''}$${last5Stats.avgPnL.toFixed(2)}
      - Best day: ${bestDay ? `${bestDay[0]} (${bestDay[1] >= 0 ? '+' : ''}$${bestDay[1].toFixed(2)})` : 'N/A'}
      - Worst day: ${worstDay ? `${worstDay[0]} (${worstDay[1] >= 0 ? '+' : ''}$${worstDay[1].toFixed(2)})` : 'N/A'}
      - Most common session: ${last5Stats.mostCommonSession || 'N/A'}
      - Average risk per trade: ${last5Stats.avgRisk.toFixed(1)}% | Max risk: ${last5Stats.maxRisk.toFixed(1)}%

      DETAILED IMAGE ANALYSIS (TODAY):
      ${imageAnalysisResults}

      TRADER'S EMOTIONAL STATE:
      ${recentEmotions.slice(0, 5).map(e => {
        try {
          return `${e.timestamp ? format(parseISO(e.timestamp), 'MMM d') : 'Recent'}: ${e.emotions?.join(', ')} (intensity: ${e.intensity}/10)`;
        } catch {
          return `Recent: ${e.emotions?.join(', ')} (intensity: ${e.intensity}/10)`;
        }
      }).join('\n') || 'No emotion data'}

      PSYCHOLOGY JOURNAL ENTRIES (LAST 5 DAYS):
      ${recentJournals.slice(0, 3).map(j => `${j.entry_date}: ${j.psychology_snapshot || 'No notes'}`).join('\n') || 'No journal entries'}

      YOUR TASK AS AN EXPERT COACH:
      Analyze ALL the data above and identify the PRIMARY behavior pattern impacting performance. Look beyond surface-level metrics.

      ANALYSIS FACTORS TO CONSIDER:
      - Trade execution quality (from image analysis)
      - Risk management discipline
      - Emotional patterns and their correlation with trades
      - Setup quality and patience
      - Profit-taking and stop-loss discipline
      - Overtrading vs selective trading
      - Trade timing and market conditions
      - Consistency with trading rules
      - Psychology journal insights
      - Win/loss patterns and their causes

      CRITICAL OUTPUT FORMAT (JSON):
      {
      "observation": "Specific, evidence-based observation using EXACT numbers and image details. Focus on WHAT you see in the data and images, not just session timing. Example: 'You took 8 trades today with $450 in losses. Image analysis shows 3 trades had poor entry timing, chasing price after breakouts. Your largest loss ($180) came from a trade where stops were placed too tight based on the chart.'",
      "impact": "Explain HOW this specific behavior is impacting P&L. Use exact dollar amounts and percentages. Example: 'These execution errors cost you $300 today (67% of total losses). Your win rate dropped to 25% when chasing entries vs 60% on patient entries.'",
      "guidance": "ONE crystal-clear, actionable rule for tomorrow. Be specific. Example: 'Wait for price to retrace to your entry zone. If you miss the move, let it go.' NOT: 'Trade better'",
      "action_plan": [
      "Pre-trade: [Specific checklist item before entering]",
      "During trade: [Specific behavior while in position]",
      "Post-trade: [Specific review action after exit]"
      ],
      "affirmation": "Brief, calm, empowering statement (4-8 words)",
      "pattern_type": "one of: overtrading, risk_management, session_discipline, emotional_trading, positive_streak, rule_violation, execution_quality, journaling_consistency"
      }

      MANDATORY RULES:
      - Use EXACT numbers from the stats (not approximations)
      - Reference SPECIFIC details from image analysis
      - NO generic observations - be laser-specific
      - Focus on the ROOT CAUSE, not symptoms
      - If images show execution issues, mention them specifically
      - Honor user's past feedback preferences
      - DO NOT default to "kill zone" or session analysis unless images/data clearly show it's the issue`;

      const result = await api.integrations.Core.InvokeLLM({
        prompt: coachingPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            observation: { type: "string" },
            impact: { type: "string" },
            guidance: { type: "string" },
            action_plan: { type: "array", items: { type: "string" } },
            affirmation: { type: "string" },
            pattern_type: { type: "string" }
          }
        }
      });

      return api.entities.DailyInsight.create({
        user_id: currentUser.email,
        insight_date: today,
        stats_json: { today: todayStats, last5Days: last5Stats },
        observation: result.observation,
        impact: result.impact,
        guidance: result.guidance,
        action_plan: result.action_plan || [],
        affirmation: result.affirmation,
        image_findings: imageAnalysisResults,
        pattern_type: result.pattern_type,
        streak_days: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyInsights'] });
      queryClient.invalidateQueries({ queryKey: ['todayInsight'] });
    },
  });

  const handleGenerateInsight = async () => {
    setGenerating(true);
    try {
      await generateInsightMutation.mutateAsync();
    } catch (error) {
      console.error('Insight generation error:', error);
      alert(error.message || 'Failed to generate insight');
    } finally {
      setGenerating(false);
    }
  };

  const handleFeedback = (helpful) => {
    if (helpful) {
      feedbackMutation.mutate({ insightId: todayInsight.id, helpful: true, feedback: null });
    } else {
      setShowFeedbackInput(true);
    }
  };

  const handleSubmitFeedback = () => {
    feedbackMutation.mutate({ 
      insightId: todayInsight.id, 
      helpful: false, 
      feedback: feedbackText 
    });
  };

  const getPatternIcon = (patternType) => {
    switch (patternType) {
      case 'positive_streak': return <Award className="w-5 h-5 text-green-400" />;
      case 'overtrading': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'emotional_trading': return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <Target className="w-5 h-5 text-blue-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-green-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="w-8 h-8 text-green-400" />
            Trade Learning Companion
          </h1>
          <p className="text-gray-500 mt-1">High-accuracy coaching powered by your actual data</p>
        </div>
        {todayInsight && (
          <Button
            variant="outline"
            onClick={handleGenerateInsight}
            disabled={generating}
            className="border-white/10"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", generating && "animate-spin")} />
            Refresh Insight
          </Button>
        )}
      </div>

      {todayInsight ? (
        <div className="space-y-6">
          {/* Today Snapshot */}
          {todayInsight.stats_json?.today && (
            <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-400" />
                Today's Snapshot ({format(new Date(), 'MMMM d, yyyy')})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <StatBox label="Trades Taken" value={todayInsight.stats_json.today.totalTrades} />
                <StatBox label="Wins" value={todayInsight.stats_json.today.wins} color="green" />
                <StatBox label="Losses" value={todayInsight.stats_json.today.losses} color="red" />
                <StatBox label="Breakeven" value={todayInsight.stats_json.today.breakeven} />
                <StatBox label="Net P&L" value={`${todayInsight.stats_json.today.netPnL >= 0 ? '+' : ''}$${Math.abs(todayInsight.stats_json.today.netPnL).toFixed(2)}`} color={todayInsight.stats_json.today.netPnL >= 0 ? 'green' : 'red'} />
                <StatBox label="Avg P&L/Trade" value={`${todayInsight.stats_json.today.avgPnL >= 0 ? '+' : ''}$${Math.abs(todayInsight.stats_json.today.avgPnL).toFixed(2)}`} />
                <StatBox label="Largest Win" value={`$${todayInsight.stats_json.today.largestWin.toFixed(2)}`} color="green" />
                <StatBox label="Largest Loss" value={`$${Math.abs(todayInsight.stats_json.today.largestLoss).toFixed(2)}`} color="red" />
                <StatBox label="Rule Violations" value={todayInsight.stats_json.today.ruleViolations} color={todayInsight.stats_json.today.ruleViolations > 0 ? 'yellow' : 'gray'} />
                <StatBox label="Outside Kill Zone" value={todayInsight.stats_json.today.outsideKillZone} color={todayInsight.stats_json.today.outsideKillZone > 0 ? 'yellow' : 'gray'} />
              </div>
            </div>
          )}

          {/* Last 5 Days Snapshot */}
          {todayInsight.stats_json?.last5Days && (
            <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5">
              <h2 className="text-xl font-bold mb-4">Last 5 Trading Days</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <StatBox label="Total Trades" value={todayInsight.stats_json.last5Days.totalTrades} />
                <StatBox label="Win/Loss" value={`${todayInsight.stats_json.last5Days.wins}W / ${todayInsight.stats_json.last5Days.losses}L`} />
                <StatBox label="Net P&L" value={`${todayInsight.stats_json.last5Days.netPnL >= 0 ? '+' : ''}$${Math.abs(todayInsight.stats_json.last5Days.netPnL).toFixed(2)}`} color={todayInsight.stats_json.last5Days.netPnL >= 0 ? 'green' : 'red'} />
                <StatBox label="Avg P&L/Trade" value={`${todayInsight.stats_json.last5Days.avgPnL >= 0 ? '+' : ''}$${Math.abs(todayInsight.stats_json.last5Days.avgPnL).toFixed(2)}`} />
                <StatBox label="Common Session" value={todayInsight.stats_json.last5Days.mostCommonSession || 'N/A'} />
                <StatBox label="Avg Risk" value={`${todayInsight.stats_json.last5Days.avgRisk.toFixed(1)}%`} />
                <StatBox label="Max Risk" value={`${todayInsight.stats_json.last5Days.maxRisk.toFixed(1)}%`} />
              </div>
            </div>
          )}

          {/* Image Findings */}
          {todayInsight.image_findings && todayInsight.image_findings !== 'No images uploaded today.' && (
            <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-400" />
                Image Findings (Today)
              </h2>
              <Accordion type="single" collapsible className="space-y-2">
                {todayInsight.image_findings.split('**Image').filter(Boolean).map((finding, idx) => (
                  <AccordionItem key={idx} value={`image-${idx}`} className="bg-card/5 rounded-xl border border-white/10">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <span className="font-semibold">Image {idx + 1}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{finding.replace(/^\d+:\*\*/, '').trim()}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* Coaching Output */}
          <div className="glass-card rounded-2xl bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/30 overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
                    <Sparkles className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Today's Coaching</h2>
                    <p className="text-sm text-gray-400">Based on your actual performance data</p>
                  </div>
                </div>
                {getPatternIcon(todayInsight.pattern_type)}
              </div>

              <div className="space-y-4">
                <CoachingSection title="Observation" content={todayInsight.observation} />
                <CoachingSection title="Impact" content={todayInsight.impact} />
                <CoachingSection title="Today's Focus" content={todayInsight.guidance} highlight />
                
                {todayInsight.action_plan && todayInsight.action_plan.length > 0 ? (
                  <div className="p-4 bg-card/5 rounded-xl">
                    <h3 className="font-semibold text-gray-300 mb-3">Action Plan</h3>
                    <ul className="space-y-2">
                      {todayInsight.action_plan.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-white">
                          <span className="text-green-400 mt-0.5">•</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-4 bg-card/5 rounded-xl">
                    <h3 className="font-semibold text-gray-300 mb-3">Action Plan</h3>
                    <p className="text-sm text-gray-400">No action plan generated. Update your journal with more trading data.</p>
                  </div>
                )}

                <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/20 text-center">
                  <p className="text-2xl font-bold text-green-400">{todayInsight.affirmation}</p>
                </div>
              </div>
            </div>

            {/* Feedback Section */}
            <div className="px-6 py-4 bg-card/5 border-t border-white/10">
              {!todayInsight.helpful_rating ? (
                <>
                  {!showFeedbackInput ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">Was this helpful?</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleFeedback(true)}
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Yes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFeedback(false)}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          No
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-400">Tell us what was wrong or missing:</p>
                      <Textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="e.g., numbers incorrect, missed a screenshot detail, too generic..."
                        className="bg-card/5 border-white/10"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSubmitFeedback}
                          disabled={!feedbackText.trim() || feedbackMutation.isLoading}
                          className="bg-green-500 hover:bg-green-600 text-black"
                        >
                          Submit Feedback
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowFeedbackInput(false)}
                          className="border-white/10"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {todayInsight.helpful_rating >= 5 ? (
                    <>
                      <ThumbsUp className="w-4 h-4 text-green-400" />
                      <span>Thanks for your feedback!</span>
                    </>
                  ) : (
                    <>
                      <ThumbsDown className="w-4 h-4 text-red-400" />
                      <span>Feedback received - we'll improve next time</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-yellow-500/10 border-t border-yellow-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-400">
                  This feature provides educational performance insights based on your own trading behavior. It is not financial advice.
                </p>
              </div>
            </div>
          </div>

          {/* Past Insights */}
          {insights.length > 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-400" />
                Past Learning Insights
              </h2>
              <div className="grid gap-4">
                {insights.slice(1).map((insight) => (
                  <div key={insight.id} className="glass-card rounded-xl p-5 bg-[#0f0f17]/80 border border-white/5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getPatternIcon(insight.pattern_type)}
                        <div>
                          <p className="font-semibold">{format(parseISO(insight.insight_date), 'MMMM d, yyyy')}</p>
                          <p className="text-xs text-gray-500 capitalize">{insight.pattern_type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      {insight.helpful_rating && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          {insight.helpful_rating >= 5 ? (
                            <ThumbsUp className="w-3 h-3 text-green-400" />
                          ) : (
                            <ThumbsDown className="w-3 h-3 text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-300">{insight.observation}</p>
                      <p className="text-sm text-green-400 font-medium">{insight.guidance}</p>
                      <p className="text-sm text-gray-400 italic">"{insight.affirmation}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 bg-[#0f0f17]/80 border border-white/5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4 border border-green-500/20">
            <Brain className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Generate Today's Insight</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Get a high-accuracy coaching insight based on your actual trading data, images, and behavior patterns
          </p>
          <Button
            onClick={handleGenerateInsight}
            disabled={generating}
            className="bg-green-500 hover:bg-green-600 text-black font-semibold"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Your Trading...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Daily Insight
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color = 'gray' }) {
  const colorClasses = {
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    gray: 'text-gray-400'
  };

  return (
    <div className="p-4 bg-card/5 rounded-xl">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={cn("text-2xl font-bold", colorClasses[color])}>{value}</p>
    </div>
  );
}

function CoachingSection({ title, content, highlight = false }) {
  return (
    <div className={cn(
      "p-4 rounded-xl",
      highlight ? "bg-green-500/10 border border-green-500/30" : "bg-card/5"
    )}>
      <h3 className={cn(
        "font-semibold mb-2",
        highlight ? "text-green-400" : "text-gray-300"
      )}>{title}</h3>
      <p className={cn(
        "text-sm",
        highlight ? "text-white font-medium" : "text-white"
      )}>{content}</p>
    </div>
  );
}

function getMostCommon(arr) {
  if (!arr || arr.length === 0) return null;
  const counts = {};
  arr.forEach(item => counts[item] = (counts[item] || 0) + 1);
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
}