import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Brain, 
  Upload, 
  Loader2, 
  TrendingUp,
  Target,
  AlertTriangle,
  History,
  CheckCircle2,
  X,
  ChevronDown,
  MoreVertical,
  Copy,
  FileText,
  Download,
  Activity,
  BarChart2,
  ArrowUp,
  ArrowDown,
  Minimize2,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

const ASSET_CLASSES = ['Futures', 'Forex', 'Crypto', 'Indices'];

export default function AIAnalysis() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  // Step 1: Market Selection
  const [symbol, setSymbol] = useState('');
  const [assetClass, setAssetClass] = useState('Futures');

  // Step 2: Chart Upload
  const [chartUrl, setChartUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Step 3: Analysis
  const [attachToJournal, setAttachToJournal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [savedAnalysisId, setSavedAnalysisId] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const { data: analysisHistory = [] } = useQuery({
    queryKey: ['marketAnalysisHistory', user?.email, selectedAccountId],
    queryFn: async () => {
      if (!user?.email || !selectedAccountId) return [];
      return await api.entities.MarketInsight.filter({
        user_id: user.email
      }, '-created_date', 20);
    },
    enabled: !!user?.email && !!selectedAccountId
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setChartUrl(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!symbol || !chartUrl || analyzing) return;
    
    setAnalyzing(true);
    setAnalysisError(null);
    setSavedAnalysisId(null);
    
    try {
      const prompt = `You are an AI market structure analyst providing EDUCATIONAL analysis only.

SYMBOL: ${symbol}
ASSET CLASS: ${assetClass}

Analyze the uploaded chart screenshot and provide a structured educational breakdown.

RULES:
1. NO trade signals, entries, or exits
2. Focus on market structure, liquidity, and educational scenarios
3. Use only what is visible in the chart
4. Professional, calm, trader-to-trader tone
5. No hype, no guarantees, no predictions

OUTPUT REQUIREMENTS:

1. MARKET OVERVIEW
- Detected timeframe (if visible)
- Session context (if visible: Asia/London/NY)
- Current market environment

2. MARKET BIAS
- Classification: "Bullish", "Bearish", or "Range"
- Confidence: "High", "Medium", or "Low"
- Brief explanation (2-3 sentences) based on visible structure

3. STRUCTURE & LIQUIDITY
- Key liquidity zones visible
- Draw direction (where price might be drawn to)
- Notable inefficiencies or imbalances

4. SCENARIOS
Scenario A - Continuation:
- Conditions required
- Invalidation point
- Educational context only

Scenario B - Reversal/Failure:
- Conditions required
- Invalidation point
- Educational context only

5. CAUTION & CONTEXT
- Conditions where bias is invalid
- Session or time sensitivity
- Any relevant considerations

Return JSON format:
{
  "timeframe": "detected timeframe or 'Not visible'",
  "session_context": "session info or 'Not visible'",
  "market_environment": "brief description",
  "bias": "Bullish, Bearish, or Range",
  "confidence": "High, Medium, or Low",
  "bias_explanation": "2-3 sentences",
  "liquidity_zones": "key zones",
  "draw_direction": "likely draw direction",
  "inefficiencies": "notable inefficiencies",
  "scenario_a_conditions": "continuation conditions",
  "scenario_a_invalidation": "invalidation point",
  "scenario_b_conditions": "reversal conditions",
  "scenario_b_invalidation": "invalidation point",
  "caution": "caution and context notes"
}`;

      const result = await api.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [chartUrl],
        response_json_schema: {
          type: "object",
          properties: {
            timeframe: { type: "string" },
            session_context: { type: "string" },
            market_environment: { type: "string" },
            bias: { type: "string" },
            confidence: { type: "string" },
            bias_explanation: { type: "string" },
            liquidity_zones: { type: "string" },
            draw_direction: { type: "string" },
            inefficiencies: { type: "string" },
            scenario_a_conditions: { type: "string" },
            scenario_a_invalidation: { type: "string" },
            scenario_b_conditions: { type: "string" },
            scenario_b_invalidation: { type: "string" },
            caution: { type: "string" }
          }
        }
      });

      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisError('Unable to analyze the chart. Please ensure the image is clear and includes timeframe and price axis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!analysis || savedAnalysisId || saving) return;
    
    setSaving(true);
    try {
      const savedInsight = await api.entities.MarketInsight.create({
        user_id: user.email,
        symbol,
        market_type: assetClass,
        chart_snapshot_url: chartUrl,
        extracted_data: {
          bias: analysis.bias,
          confidence: analysis.confidence,
          timeframe: analysis.timeframe
        },
        trend_analysis: analysis.bias_explanation,
        key_levels: analysis.liquidity_zones,
        pattern_recognition: analysis.draw_direction,
        trade_scenarios: `Scenario A: ${analysis.scenario_a_conditions}\nInvalidation: ${analysis.scenario_a_invalidation}\n\nScenario B: ${analysis.scenario_b_conditions}\nInvalidation: ${analysis.scenario_b_invalidation}`,
        risk_assessment: analysis.caution
      });

      setSavedAnalysisId(savedInsight.id);
      queryClient.invalidateQueries({ queryKey: ['marketAnalysisHistory'] });
      toast.success('Saved to History');
      
      if (attachToJournal) {
        const today = format(new Date(), 'yyyy-MM-dd');
        const existingEntry = await api.entities.JournalEntry.filter({
          created_by: user.email,
          account_id: selectedAccountId,
          entry_date: today
        }, '-created_date', 1);

        const aiSummary = `AI Market Analysis - ${symbol}\nBias: ${analysis.bias} (${analysis.confidence} confidence)\n\n${analysis.bias_explanation}`;

        if (existingEntry.length > 0) {
          await api.entities.JournalEntry.update(existingEntry[0].id, {
            ai_advice: aiSummary
          });
          toast.success('Attached to Journal');
        } else {
          await api.entities.JournalEntry.create({
            entry_date: today,
            account_id: selectedAccountId,
            status: 'incomplete',
            ai_advice: aiSummary
          });
          toast.success('Attached to new Journal draft');
        }
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save analysis');
    } finally {
      setSaving(false);
    }
  };

  const handleCopySummary = () => {
    if (!analysis) return;
    
    const summary = `AI Market Analysis - ${symbol} (${assetClass})
    
Bias: ${analysis.bias} (${analysis.confidence} confidence)

${analysis.bias_explanation}

Key Liquidity Zones:
${analysis.liquidity_zones}

Scenarios:
A) Continuation: ${analysis.scenario_a_conditions}
B) Reversal: ${analysis.scenario_b_conditions}

Caution: ${analysis.caution}`;

    navigator.clipboard.writeText(summary);
    toast.success('Summary copied to clipboard');
  };

  const loadHistoricalAnalysis = (item) => {
    setSymbol(item.symbol);
    setAssetClass(item.market_type);
    setChartUrl(item.chart_snapshot_url || '');
    setSavedAnalysisId(item.id);
    
    setAnalysis({
      timeframe: item.extracted_data?.timeframe || 'Not visible',
      session_context: 'Not visible',
      market_environment: '',
      bias: item.extracted_data?.bias || 'Range',
      confidence: item.extracted_data?.confidence || 'Medium',
      bias_explanation: item.trend_analysis,
      liquidity_zones: item.key_levels,
      draw_direction: item.pattern_recognition,
      inefficiencies: '',
      scenario_a_conditions: item.trade_scenarios?.split('\n\n')?.[0] || '',
      scenario_a_invalidation: '',
      scenario_b_conditions: item.trade_scenarios?.split('\n\n')?.[1] || '',
      scenario_b_invalidation: '',
      caution: item.risk_assessment
    });
  };

  const resetForm = () => {
    setSymbol('');
    setAssetClass('Futures');
    setChartUrl('');
    setAnalysis(null);
    setAnalysisError(null);
    setAttachToJournal(false);
    setSavedAnalysisId(null);
  };

  const biasColor = (bias) => {
    if (bias === 'Bullish') return 'text-green-600 bg-green-50 border-green-200';
    if (bias === 'Bearish') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-muted-foreground bg-muted/50 border-border';
  };

  const confidenceColor = (confidence) => {
    if (confidence === 'High') return 'text-primary bg-primary/10';
    if (confidence === 'Medium') return 'text-amber-600 bg-amber-50';
    return 'text-muted-foreground bg-muted/50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Market Analysis</h1>
          <p className="text-muted-foreground mt-1">Educational market structure analysis — no signals, no hype.</p>
        </div>

        {/* History Dropdown */}
        {analysisHistory.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-border">
                <History className="w-4 h-4 mr-2" />
                History
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {analysisHistory.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No analyses yet — your AI market notes will appear here.
                </div>
              ) : (
                analysisHistory.map(item => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => loadHistoricalAnalysis(item)}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-foreground">{item.symbol}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.created_date), 'MMM d')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded",
                        biasColor(item.extracted_data?.bias || 'Range')
                      )}>
                        {item.extracted_data?.bias || 'Range'}
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded",
                        confidenceColor(item.extracted_data?.confidence || 'Medium')
                      )}>
                        {item.extracted_data?.confidence || 'Medium'}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PANEL - Analysis Parameters */}
        <div className="lg:col-span-1 space-y-6">
          {/* Step 1: Select Market */}
          <div className="glass-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-blue-200">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold text-foreground">Select Market</h3>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-muted-foreground">Symbol</Label>
                <Input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="ES, NQ, EURUSD, BTC"
                  className="mt-1.5 border-border"
                />
              </div>

              <div>
                <Label className="text-muted-foreground">Asset Class</Label>
                <Select value={assetClass} onValueChange={setAssetClass}>
                  <SelectTrigger className="mt-1.5 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CLASSES.map(ac => (
                      <SelectItem key={ac} value={ac}>{ac}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="text-xs text-muted-foreground italic">
                Used to contextualize session behavior and volatility.
              </p>
            </div>
          </div>

          {/* Step 2: Upload Chart */}
          <div className="glass-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-blue-200">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold text-foreground">Upload Chart Screenshot</h3>
            </div>

            <div className="space-y-3">
              {chartUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={chartUrl} alt="Chart" className="w-full h-40 object-cover" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-slate-900/70 hover:bg-slate-900 text-white"
                    onClick={() => setChartUrl('')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 cursor-pointer transition-colors bg-muted/50 hover:bg-primary/10">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {uploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400" />
                      <span className="text-sm font-medium text-muted-foreground">Upload chart screenshot</span>
                    </>
                  )}
                </label>
              )}

              <p className="text-xs text-muted-foreground italic">
                Best results with TradingView screenshots showing timeframe and session.
              </p>
            </div>
          </div>

          {/* Step 3: Run Analysis */}
          <div className="glass-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-blue-200">
                <span className="text-sm font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold text-foreground">Run Analysis</h3>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={!symbol || !chartUrl || analyzing}
              className="w-full bg-primary text-primary-foreground font-semibold py-6"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : !chartUrl ? (
                'Upload a chart to continue'
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Analyze Market Structure
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center italic">
              Educational analysis only — not trade signals.
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Checkbox
                id="attach-journal"
                checked={attachToJournal}
                onCheckedChange={setAttachToJournal}
              />
              <label
                htmlFor="attach-journal"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Attach this analysis to today's journal entry
              </label>
            </div>

            {analysis && (
              <Button
                variant="outline"
                onClick={resetForm}
                className="w-full border-border"
              >
                New Analysis
              </Button>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - Results */}
        <div className="lg:col-span-2">
          {analyzing ? (
            // Loading State
            <div className="glass-card rounded-xl p-8 border border-border space-y-6">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <p className="text-lg font-medium text-foreground">Analyzing market structure...</p>
              </div>
              
              {/* Skeleton blocks */}
              <div className="space-y-4">
                <div className="h-24 bg-muted rounded-lg animate-pulse" />
                <div className="h-32 bg-muted rounded-lg animate-pulse" />
                <div className="h-40 bg-muted rounded-lg animate-pulse" />
                <div className="h-48 bg-muted rounded-lg animate-pulse" />
              </div>
            </div>
          ) : analysisError ? (
            // Error State
            <div className="glass-card rounded-xl p-12 border border-amber-200 bg-amber-50 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto border border-amber-300">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">We couldn't read enough structure from this chart.</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  To get the best analysis, please ensure your screenshot includes:
                </p>
                <div className="space-y-2 text-left max-w-sm mx-auto">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span className="text-muted-foreground">Visible timeframe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span className="text-muted-foreground">Clear price axis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span className="text-muted-foreground">High-quality, non-blurry image</span>
                  </div>
                </div>
              </div>

              <Button onClick={() => setChartUrl('')} className="bg-amber-600 hover:bg-amber-700 text-white">
                Upload a clearer chart
              </Button>
            </div>
          ) : !analysis ? (
            // Empty Preview State
            <div className="glass-card rounded-xl p-12 border border-border text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-blue-200">
                <Brain className="w-8 h-8 text-blue-500" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">What this analysis gives you</h3>
                <div className="space-y-3 text-left max-w-md mx-auto mt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Market bias (bullish / bearish / range)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Key liquidity zones and draw direction</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Session context (Asia / London / NY)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Invalidation levels</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Scenario A / B (continuation vs reversal)</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground italic">
                Educational structure breakdown — not trade signals.
              </p>
            </div>
          ) : (
            // Premium Output Card
            <div className="glass-card rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-12rem)]">
              {/* Header */}
              <div className="p-6 border-b border-border flex-shrink-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground mb-1">AI Market Analysis</h2>
                    <p className="text-sm text-muted-foreground">Educational market structure breakdown</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-semibold border",
                      biasColor(analysis.bias)
                    )}>
                      {analysis.bias}
                    </span>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleCopySummary}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Summary
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(createPageUrl('ShareMarketPulse') + `?symbol=${symbol}&bias=${analysis.bias}&confidence=${analysis.confidence === 'High' ? 85 : analysis.confidence === 'Medium' ? 65 : 45}&insight=${encodeURIComponent(analysis.bias_explanation.substring(0, 240))}`)}>
                          <Download className="w-4 h-4 mr-2" />
                          Share Market Pulse
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSaveAnalysis} disabled={!analysis || savedAnalysisId || saving}>
                          <FileText className="w-4 h-4 mr-2" />
                          {savedAnalysisId ? 'Saved' : 'Save & Attach to Journal'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Meta Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Symbol</p>
                      <p className="text-sm font-semibold text-foreground">{symbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Asset Class</p>
                      <p className="text-sm font-semibold text-foreground">{assetClass}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Session</p>
                      <p className="text-sm font-semibold text-foreground">{analysis.session_context}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <p className={cn(
                        "text-sm font-semibold",
                        analysis.confidence === 'High' && "text-primary",
                        analysis.confidence === 'Medium' && "text-amber-600",
                        analysis.confidence === 'Low' && "text-muted-foreground"
                      )}>
                        {analysis.confidence}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Section 1: Market Overview */}
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-3">Market Overview</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis.market_environment || `${symbol} is displaying ${analysis.bias.toLowerCase()} characteristics on the ${analysis.timeframe} timeframe. ${analysis.bias_explanation}`}
                  </p>
                </div>

                {/* Section 2: Market Bias - Featured Card */}
                <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Market Bias</p>
                      <p className="text-lg font-bold text-foreground">{analysis.bias}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {analysis.bias_explanation.substring(0, 120)}...
                      </p>
                    </div>
                    
                    {/* Confidence Meter */}
                    <div className="ml-6">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 text-right">Confidence</p>
                      <div className="flex items-center gap-1">
                        <div className={cn(
                          "w-12 h-2 rounded-full",
                          analysis.confidence === 'Low' ? "bg-primary" : "bg-slate-200"
                        )} />
                        <div className={cn(
                          "w-12 h-2 rounded-full",
                          analysis.confidence === 'Medium' || analysis.confidence === 'High' ? "bg-primary" : "bg-slate-200"
                        )} />
                        <div className={cn(
                          "w-12 h-2 rounded-full",
                          analysis.confidence === 'High' ? "bg-primary" : "bg-slate-200"
                        )} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Low</span>
                        <span>Med</span>
                        <span>High</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Structure & Liquidity */}
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-4">Structure & Liquidity</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Key Levels */}
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Key Levels & Liquidity</p>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {analysis.liquidity_zones.split('\n').filter(line => line.trim()).slice(0, 5).map((line, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="leading-relaxed">{line.replace(/^-\s*/, '')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Draw & Context */}
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Draw & Context</p>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Likely Draw</p>
                          <div className="flex items-center gap-2">
                            {analysis.bias === 'Bullish' && <ArrowUp className="w-4 h-4 text-green-600" />}
                            {analysis.bias === 'Bearish' && <ArrowDown className="w-4 h-4 text-red-600" />}
                            {analysis.bias === 'Range' && <Minimize2 className="w-4 h-4 text-muted-foreground" />}
                            <span className="text-sm font-semibold text-foreground">{analysis.draw_direction}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Session Sensitivity</p>
                          <p className="text-sm font-semibold text-foreground">{analysis.session_context}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Invalidation Context</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {analysis.scenario_a_invalidation || 'Structure break beyond key levels'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Scenarios */}
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-4">Scenarios</h3>
                  <div className="space-y-4">
                    {/* Scenario A */}
                    <div className="p-5 rounded-xl bg-card border-2 border-blue-300">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-300">
                          <span className="text-sm font-bold text-primary">A</span>
                        </div>
                        <p className="font-semibold text-foreground">Continuation</p>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Conditions required:</p>
                          <p className="text-muted-foreground leading-relaxed">{analysis.scenario_a_conditions}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Invalidation:</p>
                          <p className="text-muted-foreground leading-relaxed">{analysis.scenario_a_invalidation}</p>
                        </div>
                      </div>
                    </div>

                    {/* Scenario B */}
                    <div className="p-5 rounded-xl bg-card border-2 border-amber-300">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center border border-amber-300">
                          <span className="text-sm font-bold text-amber-600">B</span>
                        </div>
                        <p className="font-semibold text-foreground">Reversal / Failure</p>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Conditions required:</p>
                          <p className="text-muted-foreground leading-relaxed">{analysis.scenario_b_conditions}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Invalidation:</p>
                          <p className="text-muted-foreground leading-relaxed">{analysis.scenario_b_invalidation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 5: Context & Caution */}
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Context & Caution
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {analysis.caution.split('\n').filter(line => line.trim()).map((line, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                        <span className="leading-relaxed">{line.replace(/^-\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 italic">
                    Educational analysis only — not financial advice.
                  </p>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="p-6 border-t border-border bg-card flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="attach-footer"
                      checked={attachToJournal}
                      onCheckedChange={setAttachToJournal}
                    />
                    <label htmlFor="attach-footer" className="text-sm text-muted-foreground cursor-pointer">
                      Attach this analysis to today's journal entry
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={handleCopySummary}
                      className="flex-1 sm:flex-none border-border"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Summary
                    </Button>
                    <Button
                      onClick={handleSaveAnalysis}
                      disabled={!analysis || savedAnalysisId || saving}
                      className="flex-1 sm:flex-none bg-primary text-primary-foreground disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : savedAnalysisId ? (
                        'Saved'
                      ) : (
                        'Save Analysis'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}