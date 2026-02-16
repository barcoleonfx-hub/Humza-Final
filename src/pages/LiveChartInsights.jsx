import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  TrendingUp, 
  Upload, 
  Loader2, 
  Brain,
  Target,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";

const FUTURES_SYMBOLS = [
  { value: 'CME_MINI:NQ1!', label: 'NQ (E-mini NASDAQ-100)' },
  { value: 'CME_MINI:ES1!', label: 'ES (E-mini S&P 500)' },
  { value: 'COMEX:GC1!', label: 'GC (Gold)' },
  { value: 'NYMEX:CL1!', label: 'CL (Crude Oil)' },
  { value: 'CME_MINI:RTY1!', label: 'RTY (E-mini Russell 2000)' }
];

const FOREX_SYMBOLS = [
  { value: 'FX:EURUSD', label: 'EUR/USD' },
  { value: 'FX:GBPUSD', label: 'GBP/USD' },
  { value: 'FX:USDJPY', label: 'USD/JPY' },
  { value: 'OANDA:XAUUSD', label: 'XAU/USD (Gold)' },
  { value: 'FX:AUDUSD', label: 'AUD/USD' }
];

const TIMEFRAMES = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'];

export default function LiveChartInsights() {
  const [currentUser, setCurrentUser] = useState(null);
  const [marketType, setMarketType] = useState('Futures');
  const [symbol, setSymbol] = useState(FUTURES_SYMBOLS[0].value);
  const [timeframe, setTimeframe] = useState('15m');
  const [chartSnapshotUrl, setChartSnapshotUrl] = useState('');
  const [pnlSnapshotUrl, setPnlSnapshotUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [insight, setInsight] = useState(null);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [usageStatus, setUsageStatus] = useState(null);
  
  const tickerTapeRef = useRef(null);
  const advancedChartRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (marketType === 'Futures') {
      setSymbol(FUTURES_SYMBOLS[0].value);
    } else {
      setSymbol(FOREX_SYMBOLS[0].value);
    }
  }, [marketType]);

  // Check daily usage
  useQuery({
    queryKey: ['insightUsage', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const today = format(new Date(), 'yyyy-MM-dd');
      const usageRecords = await api.entities.InsightUsage.filter({
        user_id: currentUser.email,
        usage_date: today
      });
      
      const usage = usageRecords.length > 0 ? usageRecords[0] : null;
      setUsageStatus(usage);
      return usage;
    },
    enabled: !!currentUser?.email,
    refetchInterval: 60000 // Refetch every minute
  });

  // Load TradingView widgets
  useEffect(() => {
    if (!symbol) return;

    // Ticker Tape
    const tickerScript = document.createElement('script');
    tickerScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    tickerScript.async = true;
    tickerScript.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
        { proName: 'FOREXCOM:NSXUSD', title: 'US 100' },
        { proName: 'FX_IDC:EURUSD', title: 'EUR to USD' },
        { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
        { proName: 'BITSTAMP:ETHUSD', title: 'Ethereum' }
      ],
      showSymbolLogo: true,
      colorTheme: 'dark',
      isTransparent: true,
      displayMode: 'adaptive',
      locale: 'en'
    });

    if (tickerTapeRef.current) {
      tickerTapeRef.current.innerHTML = '';
      tickerTapeRef.current.appendChild(tickerScript);
    }

    // Advanced Chart
    const chartScript = document.createElement('script');
    chartScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    chartScript.async = true;
    chartScript.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: timeframe === '1m' ? '1' : timeframe === '5m' ? '5' : timeframe === '15m' ? '15' : timeframe === '1H' ? '60' : timeframe === '4H' ? '240' : timeframe === '1D' ? 'D' : 'W',
      timezone: 'America/New_York',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      backgroundColor: 'rgba(15, 15, 23, 1)',
      gridColor: 'rgba(255, 255, 255, 0.06)',
      hide_top_toolbar: false,
      allow_symbol_change: true,
      save_image: false,
      container_id: 'tradingview_chart'
    });

    if (advancedChartRef.current) {
      advancedChartRef.current.innerHTML = '';
      advancedChartRef.current.appendChild(chartScript);
    }
  }, [symbol, timeframe]);

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    
    setUploading(true);
    const { file_url } = await api.integrations.Core.UploadFile({ file });
    
    if (type === 'chart') {
      setChartSnapshotUrl(file_url);
    } else {
      setPnlSnapshotUrl(file_url);
    }
    
    setUploading(false);
  };

  const feedbackMutation = useMutation({
    mutationFn: ({ insightId, helpful, feedback }) => 
      api.entities.MarketInsight.update(insightId, {
        helpful_rating: helpful ? 5 : 1,
        improvement_feedback: feedback || null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketInsights'] });
      setShowFeedbackInput(false);
      setFeedbackText('');
    },
  });

  const generateInsightMutation = useMutation({
    mutationFn: async () => {
      if (!chartSnapshotUrl && !pnlSnapshotUrl) {
        throw new Error('Please upload at least one snapshot');
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date();

      // Check usage limits
      let usage = usageStatus;
      if (!usage) {
        // Create new usage record
        usage = await api.entities.InsightUsage.create({
          user_id: currentUser.email,
          usage_date: today,
          insights_count: 0,
          user_tier: 'Pro' // Default to Pro, adjust based on your logic
        });
      }

      const dailyLimit = usage.user_tier === 'VIP' ? 10 : 3;
      
      if (usage.insights_count >= dailyLimit) {
        throw new Error(`Daily limit reached (${dailyLimit} insights per day for ${usage.user_tier} users)`);
      }

      // Check cooldown (3 minutes)
      if (usage.last_insight_time) {
        const lastTime = parseISO(usage.last_insight_time);
        const diffMinutes = (now - lastTime) / 1000 / 60;
        if (diffMinutes < 3) {
          const remainingSeconds = Math.ceil((3 - diffMinutes) * 60);
          throw new Error(`Please wait ${remainingSeconds} seconds before generating another insight`);
        }
      }

      // Prepare prompt
      const nyTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
      const todayDate = format(new Date(), 'EEEE, MMMM d, yyyy');

      const analysisPrompt = `You are TraderJNL Analyst. Analyze the uploaded snapshot(s) and provide structured market insights.

SYMBOL: ${symbol}
MARKET TYPE: ${marketType}
TIMEFRAME SELECTED: ${timeframe}
CURRENT NY TIME: ${nyTime}
TODAY'S DATE: ${todayDate}

${chartSnapshotUrl ? 'CHART SNAPSHOT PROVIDED' : 'NO CHART SNAPSHOT'}
${pnlSnapshotUrl ? 'P&L SNAPSHOT PROVIDED' : 'NO P&L SNAPSHOT'}

CRITICAL RULES:
1. Extract ONLY what is visible in the snapshot(s). If something is not visible, write "Not visible"
2. Do NOT invent data, levels, patterns, or indicators
3. Maintain these exact headers in order
4. Use neutral, educational language only
5. No predictions or financial advice

OUTPUT STRUCTURE:

**Extracted From Snapshot**
- Symbol visible: [symbol or "Not visible"]
- Timeframe visible: [timeframe or "Not visible"]
- Marked levels/annotations: [list any visible lines, zones, text labels or "Not visible"]
- Session context: [Asia/London/NY ranges if visible, or "Not visible"]
- Midnight Open: [price level if visible, or "Not visible"]

${pnlSnapshotUrl ? `**P&L Data Extracted**
- Total trades: [number or "Not visible"]
- Wins: [number or "Not visible"]
- Losses: [number or "Not visible"]
- Net P&L: [amount or "Not visible"]
- Largest win: [amount or "Not visible"]
- Largest loss: [amount or "Not visible"]
- Win rate: [percentage or "Not visible"]
- Any visible timestamps or session info: [details or "Not visible"]
` : ''}

**Trend Analysis**
Based on visible structure:
- Current trend direction (HH/HL vs LH/LL)
- Displacement vs consolidation
- Break of structure if visible

**Key Levels**
ONLY list levels that are:
1. Clearly marked on the chart by the trader
2. Obvious session highs/lows if labeled
3. Visible equal highs/lows
Max 3 levels total.

**Pattern Recognition**
Smart money concepts if visible:
- Liquidity sweeps
- BOS/MSS
- FVG/IFVG zones
- Session level interactions
If nothing clear, write: "None detected with confidence"

**Trade Scenario Examples**
1-2 educational scenarios ONLY if the chart setup is clear.
Format:
"Watch for [trigger] during [session/time]"
"If [condition], potential move toward [target]"
"Invalidation: [level]"

**Risk Assessment**
- Volatility considerations based on visible price action
- News/event risks if timing is relevant
- Risk management guidance

Return JSON:
{
  "extracted_data": {
    "symbol_visible": "string",
    "timeframe_visible": "string",
    "marked_levels": "string",
    "session_context": "string",
    "midnight_open": "string",
    "pnl_trades": "string or null",
    "pnl_wins": "string or null",
    "pnl_losses": "string or null",
    "pnl_net": "string or null"
  },
  "trend_analysis": "string",
  "key_levels": "string",
  "pattern_recognition": "string",
  "trade_scenarios": "string",
  "risk_assessment": "string"
}`;

      const fileUrls = [];
      if (chartSnapshotUrl) fileUrls.push(chartSnapshotUrl);
      if (pnlSnapshotUrl) fileUrls.push(pnlSnapshotUrl);

      const result = await api.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        file_urls: fileUrls,
        response_json_schema: {
          type: "object",
          properties: {
            extracted_data: {
              type: "object",
              properties: {
                symbol_visible: { type: "string" },
                timeframe_visible: { type: "string" },
                marked_levels: { type: "string" },
                session_context: { type: "string" },
                midnight_open: { type: "string" },
                pnl_trades: { type: ["string", "null"] },
                pnl_wins: { type: ["string", "null"] },
                pnl_losses: { type: ["string", "null"] },
                pnl_net: { type: ["string", "null"] }
              }
            },
            trend_analysis: { type: "string" },
            key_levels: { type: "string" },
            pattern_recognition: { type: "string" },
            trade_scenarios: { type: "string" },
            risk_assessment: { type: "string" }
          }
        }
      });

      // Save insight
      const newInsight = await api.entities.MarketInsight.create({
        user_id: currentUser.email,
        symbol: symbol,
        market_type: marketType,
        chart_snapshot_url: chartSnapshotUrl,
        pnl_snapshot_url: pnlSnapshotUrl,
        extracted_data: result.extracted_data,
        trend_analysis: result.trend_analysis,
        key_levels: result.key_levels,
        pattern_recognition: result.pattern_recognition,
        trade_scenarios: result.trade_scenarios,
        risk_assessment: result.risk_assessment
      });

      // Update usage
      await api.entities.InsightUsage.update(usage.id, {
        insights_count: usage.insights_count + 1,
        last_insight_time: now.toISOString()
      });

      queryClient.invalidateQueries({ queryKey: ['insightUsage'] });
      
      return newInsight;
    },
    onSuccess: (newInsight) => {
      setInsight(newInsight);
    },
  });

  const handleGenerateInsight = async () => {
    setAnalyzing(true);
    try {
      await generateInsightMutation.mutateAsync();
    } catch (error) {
      console.error('Insight generation error:', error);
      alert(error.message || 'Failed to generate insight');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFeedback = (helpful) => {
    if (helpful) {
      feedbackMutation.mutate({ insightId: insight.id, helpful: true, feedback: null });
    } else {
      setShowFeedbackInput(true);
    }
  };

  const handleSubmitFeedback = () => {
    feedbackMutation.mutate({ 
      insightId: insight.id, 
      helpful: false, 
      feedback: feedbackText 
    });
  };

  const symbolOptions = marketType === 'Futures' ? FUTURES_SYMBOLS : FOREX_SYMBOLS;
  const dailyLimit = usageStatus?.user_tier === 'VIP' ? 10 : 3;
  const remainingInsights = usageStatus ? dailyLimit - usageStatus.insights_count : dailyLimit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-green-400" />
          Live Chart + Insights
        </h1>
        <p className="text-gray-500 mt-1">View live charts and generate AI market insights</p>
      </div>

      {/* Controls */}
      <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Market Type</Label>
            <Select value={marketType} onValueChange={setMarketType}>
              <SelectTrigger className="bg-card/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a24] border-white/10">
                <SelectItem value="Futures">Futures</SelectItem>
                <SelectItem value="Forex">Forex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Symbol</Label>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="bg-card/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a24] border-white/10">
                {symbolOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Timeframe (Display)</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="bg-card/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a24] border-white/10">
                {TIMEFRAMES.map(tf => (
                  <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* TradingView Ticker Tape */}
      <div className="glass-card rounded-2xl bg-[#0f0f17]/80 border border-white/5 overflow-hidden">
        <div 
          ref={tickerTapeRef}
          className="tradingview-widget-container"
          style={{ height: '46px', width: '100%' }}
        >
          <div className="tradingview-widget-container__widget"></div>
        </div>
      </div>

      {/* TradingView Advanced Chart */}
      <div className="glass-card rounded-2xl bg-[#0f0f17]/80 border border-white/5 overflow-hidden">
        <div 
          ref={advancedChartRef}
          className="tradingview-widget-container"
          style={{ height: '600px', width: '100%' }}
        >
          <div id="tradingview_chart" style={{ height: 'calc(100% - 32px)', width: '100%' }}></div>
        </div>
      </div>

      {/* Usage Status */}
      {usageStatus && (
        <div className={cn(
          "p-4 rounded-xl flex items-center gap-3",
          remainingInsights > 0 ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"
        )}>
          <Clock className={cn("w-5 h-5", remainingInsights > 0 ? "text-green-400" : "text-red-400")} />
          <div>
            <p className={cn("font-semibold", remainingInsights > 0 ? "text-green-400" : "text-red-400")}>
              {remainingInsights} / {dailyLimit} insights remaining today
            </p>
            <p className="text-xs text-gray-500">
              {usageStatus.user_tier === 'VIP' ? 'VIP Plan' : 'Pro Plan'} • Resets daily at midnight
            </p>
          </div>
        </div>
      )}

      {/* Snapshot Upload Section */}
      <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5 space-y-4">
        <h2 className="font-semibold text-lg">Upload Snapshots for Analysis</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chart Snapshot */}
          <div className="space-y-2">
            <Label>Chart Snapshot</Label>
            {chartSnapshotUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10">
                <img src={chartSnapshotUrl} alt="Chart" className="w-full h-48 object-cover" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                  onClick={() => setChartSnapshotUrl('')}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-dashed border-white/10 hover:border-green-500/30 cursor-pointer transition-colors h-48">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files?.[0], 'chart')}
                  className="hidden"
                />
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-400">Upload chart screenshot</span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* PnL Snapshot */}
          <div className="space-y-2">
            <Label>P&L Snapshot (Optional)</Label>
            {pnlSnapshotUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10">
                <img src={pnlSnapshotUrl} alt="PnL" className="w-full h-48 object-cover" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                  onClick={() => setPnlSnapshotUrl('')}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-dashed border-white/10 hover:border-green-500/30 cursor-pointer transition-colors h-48">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files?.[0], 'pnl')}
                  className="hidden"
                />
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-400">Upload P&L screenshot</span>
                  </>
                )}
              </label>
            )}
          </div>
        </div>

        <Button
          onClick={handleGenerateInsight}
          disabled={(!chartSnapshotUrl && !pnlSnapshotUrl) || analyzing || remainingInsights <= 0}
          className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-6"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Analyzing Snapshots...
            </>
          ) : (
            <>
              <Brain className="w-5 h-5 mr-2" />
              Generate Market Insights ({remainingInsights} left today)
            </>
          )}
        </Button>
      </div>

      {/* Insights Display */}
      {insight && (
        <div className="space-y-4">
          {/* Disclaimer */}
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-400">Educational Content Only</p>
              <p className="text-sm text-gray-400">
                This analysis is for educational purposes only and does not constitute financial advice.
              </p>
            </div>
          </div>

          {/* Extracted Data */}
          {insight.extracted_data && (
            <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Extracted From Snapshot
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Symbol Visible</p>
                  <p className="text-white">{insight.extracted_data.symbol_visible}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Timeframe Visible</p>
                  <p className="text-white">{insight.extracted_data.timeframe_visible}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 mb-1">Marked Levels/Annotations</p>
                  <p className="text-white">{insight.extracted_data.marked_levels}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 mb-1">Session Context</p>
                  <p className="text-white">{insight.extracted_data.session_context}</p>
                </div>
                {insight.extracted_data.pnl_net && (
                  <>
                    <div>
                      <p className="text-gray-500 mb-1">Total Trades</p>
                      <p className="text-white">{insight.extracted_data.pnl_trades}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Net P&L</p>
                      <p className="text-white">{insight.extracted_data.pnl_net}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Analysis Sections */}
          <AnalysisSection
            icon={TrendingUp}
            title="Trend Analysis"
            content={insight.trend_analysis}
            color="green"
          />

          <AnalysisSection
            icon={Target}
            title="Key Levels"
            content={insight.key_levels}
            color="blue"
          />

          <AnalysisSection
            icon={BarChart3}
            title="Pattern Recognition"
            content={insight.pattern_recognition}
            color="purple"
          />

          <AnalysisSection
            icon={Lightbulb}
            title="Trade Scenario Examples"
            content={insight.trade_scenarios}
            color="yellow"
          />

          <AnalysisSection
            icon={AlertTriangle}
            title="Risk Assessment"
            content={insight.risk_assessment}
            color="red"
          />

          {/* Feedback Section */}
          <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5">
            {!insight.helpful_rating ? (
              <>
                {!showFeedbackInput ? (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Was this insight helpful?</p>
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
                    <p className="text-sm text-gray-400">What was wrong or missing?</p>
                    <Textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="e.g., missed a visible level, incorrect timeframe, too generic..."
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
                {insight.helpful_rating >= 5 ? (
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
        </div>
      )}

      {/* Legal Disclaimer */}
      <div className="p-4 rounded-xl bg-card/[0.02] border border-white/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-500 space-y-1">
            <p className="font-semibold">Legal Disclaimer</p>
            <p>Charts are for informational purposes only. This feature provides educational analysis and does not constitute financial advice. Trading involves risk and you should never trade with money you cannot afford to lose.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalysisSection({ icon: Icon, title, content, color }) {
  const colorClasses = {
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    blue: 'bg-primary/10 border-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
  };

  return (
    <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center border",
          colorClasses[color]
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}