import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Layers, 
  Upload, 
  Loader2, 
  CheckCircle2,
  X,
  TrendingUp
} from 'lucide-react';
import { cn } from "@/lib/utils";

const TIMEFRAMES = [
  { id: 'daily', label: 'Daily', required: true },
  { id: '4h', label: '4 Hour', required: true },
  { id: '1h', label: '1 Hour', required: true },
  { id: '15m', label: '15 Minute', required: true }
];

export default function MultiTimeframeScan() {
  const [symbol, setSymbol] = useState('');
  const [uploads, setUploads] = useState({
    daily: null,
    '4h': null,
    '1h': null,
    '15m': null
  });
  const [uploading, setUploading] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleUpload = async (timeframe, file) => {
    if (!file) return;
    
    setUploading(timeframe);
    const { file_url } = await api.integrations.Core.UploadFile({ file });
    setUploads(prev => ({ ...prev, [timeframe]: file_url }));
    setUploading(null);
  };

  const removeUpload = (timeframe) => {
    setUploads(prev => ({ ...prev, [timeframe]: null }));
  };

  const allUploaded = TIMEFRAMES.every(tf => uploads[tf.id]);

  const handleAnalyze = async () => {
    if (!symbol || !allUploaded) return;
    
    setAnalyzing(true);

    const prompt = `You are analyzing a multi-timeframe chart setup for ${symbol}.

You have screenshots from:
- Daily chart
- 4 Hour chart
- 1 Hour chart
- 15 Minute chart

CRITICAL TASK: Build a top-down bias analysis using proper multi-timeframe methodology.

STEP 1: DAILY TIMEFRAME (Highest Priority)
- Overall trend direction (HH/HL bullish vs LH/LL bearish)
- Major swing highs and lows
- Key support/resistance zones
- Displacement or consolidation
- Midnight Open relative to daily structure (if visible)
- Bias: Bullish / Bearish / Neutral

STEP 2: 4 HOUR TIMEFRAME
- Confirm or diverge from daily bias
- Intermediate structure breaks
- Liquidity zones
- Recent session sweeps (if visible)
- Bias alignment with Daily: Yes/No

STEP 3: 1 HOUR TIMEFRAME
- Intraday structure
- Kill zone timing context
- Session ranges (Asia/London/NY if visible)
- Entry zones forming (if any)
- Bias alignment with Higher TFs: Yes/No

STEP 4: 15 MINUTE TIMEFRAME (Execution TF)
- Precise entry signals
- Micro structure
- Liquidity sweeps
- Fair value gaps
- Optimal entry timing
- Current kill zone context

STEP 5: INTEGRATED BIAS
Synthesize all timeframes:
- Is there multi-timeframe alignment? (All bullish / All bearish / Mixed)
- Where is the highest probability entry zone?
- What would invalidate the setup?
- What session/time is optimal for this idea?

STEP 6: MIDNIGHT OPEN INTEGRATION (if visible)
- On which timeframe is Midnight Open most relevant?
- Is price above or below Midnight Open?
- Has it been swept and reclaimed/rejected?

CRITICAL RULES:
- Only describe what is VISIBLE in each screenshot
- If something is not clear, state "Not visible on this timeframe"
- DO NOT give trade signals - provide educational scenarios only
- Use language like: "Watch for...", "If acceptance occurs...", "If rejection happens..."

Return JSON format:
{
  "daily_bias": "Bullish / Bearish / Neutral - with structure evidence",
  "four_hour_bias": "Bias and alignment status",
  "one_hour_bias": "Bias and alignment status",
  "fifteen_min_bias": "Bias and alignment status",
  "integrated_analysis": "Multi-timeframe synthesis and alignment status",
  "midnight_open_context": "Midnight Open analysis across timeframes or 'Not visible'",
  "optimal_scenarios": "Educational trade scenarios with timing and invalidation",
  "risk_considerations": "What could go wrong - session timing, news, structure breaks",
  "data_quality": "Assessment of screenshot clarity and visibility"
}`;

    const result = await api.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [uploads.daily, uploads['4h'], uploads['1h'], uploads['15m']],
      response_json_schema: {
        type: "object",
        properties: {
          daily_bias: { type: "string" },
          four_hour_bias: { type: "string" },
          one_hour_bias: { type: "string" },
          fifteen_min_bias: { type: "string" },
          integrated_analysis: { type: "string" },
          midnight_open_context: { type: "string" },
          optimal_scenarios: { type: "string" },
          risk_considerations: { type: "string" },
          data_quality: { type: "string" }
        }
      }
    });

    setAnalysis(result);
    setAnalyzing(false);
  };

  const reset = () => {
    setSymbol('');
    setUploads({ daily: null, '4h': null, '1h': null, '15m': null });
    setAnalysis(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Layers className="w-8 h-8 text-green-400" />
          Multi-Timeframe Scan
        </h1>
        <p className="text-gray-500 mt-1">Top-down analysis across all timeframes</p>
      </div>

      {!analysis ? (
        <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5 space-y-6">
          <div className="space-y-2">
            <Label>Symbol</Label>
            <Input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="ES, NQ, EUR/USD..."
              className="bg-card/5 border-white/10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TIMEFRAMES.map(tf => (
              <div key={tf.id} className="space-y-2">
                <Label className="flex items-center justify-between">
                  {tf.label}
                  {uploads[tf.id] && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                </Label>
                {uploads[tf.id] ? (
                  <div className="relative rounded-xl overflow-hidden border border-green-500/30">
                    <img src={uploads[tf.id]} alt={tf.label} className="w-full h-32 object-cover" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                      onClick={() => removeUpload(tf.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className={cn(
                    "flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed cursor-pointer transition-colors",
                    uploading === tf.id ? "border-green-500/50" : "border-white/10 hover:border-green-500/30"
                  )}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(tf.id, e.target.files[0])}
                      className="hidden"
                    />
                    {uploading === tf.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-400">Upload {tf.label}</span>
                      </>
                    )}
                  </label>
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!symbol || !allUploaded || analyzing}
            className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-6"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Analyzing All Timeframes...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 mr-2" />
                Run Multi-Timeframe Analysis
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Button onClick={reset} variant="outline" className="border-white/10">
            New Scan
          </Button>

          <BiasCard title="Daily Timeframe" content={analysis.daily_bias} color="purple" />
          <BiasCard title="4 Hour Timeframe" content={analysis.four_hour_bias} color="blue" />
          <BiasCard title="1 Hour Timeframe" content={analysis.one_hour_bias} color="green" />
          <BiasCard title="15 Minute Timeframe" content={analysis.fifteen_min_bias} color="yellow" />

          <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/30">
            <h3 className="font-semibold text-lg mb-3">Integrated Multi-Timeframe Analysis</h3>
            <p className="text-gray-300 whitespace-pre-wrap">{analysis.integrated_analysis}</p>
          </div>

          {analysis.midnight_open_context !== 'Not visible' && (
            <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5">
              <h3 className="font-semibold text-lg mb-3">Midnight Open Context</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{analysis.midnight_open_context}</p>
            </div>
          )}

          <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5">
            <h3 className="font-semibold text-lg mb-3">Educational Scenarios</h3>
            <p className="text-gray-300 whitespace-pre-wrap">{analysis.optimal_scenarios}</p>
          </div>

          <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5">
            <h3 className="font-semibold text-lg mb-3">Risk Considerations</h3>
            <p className="text-gray-300 whitespace-pre-wrap">{analysis.risk_considerations}</p>
          </div>

          <div className="p-4 rounded-xl bg-primary/10 border border-blue-500/20">
            <p className="text-sm text-blue-400">
              Educational analysis only. No trade signals or financial advice. Multi-timeframe alignment does not guarantee outcomes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function BiasCard({ title, content, color }) {
  const colorClasses = {
    purple: 'border-purple-500/30 bg-purple-500/5',
    blue: 'border-blue-500/30 bg-primary/5',
    green: 'border-green-500/30 bg-green-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5'
  };

  return (
    <div className={cn("glass-card rounded-xl p-5 border", colorClasses[color])}>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-300 whitespace-pre-wrap">{content}</p>
    </div>
  );
}