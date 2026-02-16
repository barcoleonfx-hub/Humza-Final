import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Loader2, ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function PnLUploader({ open, onClose, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setError('');
    const { file_url } = await api.integrations.Core.UploadFile({ file });
    setImageUrl(file_url);
    setUploading(false);
  };

  const handleAnalyze = async () => {
    if (!imageUrl) return;
    
    setAnalyzing(true);
    setError('');
    
    const result = await api.integrations.Core.InvokeLLM({
      prompt: `Analyze this trading P&L or performance screenshot. ONLY extract and explain statistics that are CLEARLY VISIBLE in the image.

You MUST extract these if visible:
- Total P&L (profit/loss amount)
- Number of trades
- Win rate or win/loss distribution
- Biggest winning trade
- Biggest losing trade
- Any other visible performance metrics

IMPORTANT RULES:
1. If any metric is NOT clearly visible, you MUST say "Not visible in screenshot"
2. Do NOT make assumptions or estimates
3. Do NOT provide trading signals or recommendations
4. Only describe what you can actually see

After extraction, provide 2-3 brief educational insights about the visible data (e.g., risk management observations, consistency patterns).

Format your response as JSON:
{
  "extracted_pnl": number or null,
  "extracted_trades": number or null,
  "extracted_win_rate": number or null,
  "biggest_win": number or null,
  "biggest_loss": number or null,
  "summary": "Brief summary of what's visible",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "not_visible": ["list of metrics that weren't visible"]
}`,
      file_urls: [imageUrl],
      response_json_schema: {
        type: "object",
        properties: {
          extracted_pnl: { type: ["number", "null"] },
          extracted_trades: { type: ["number", "null"] },
          extracted_win_rate: { type: ["number", "null"] },
          biggest_win: { type: ["number", "null"] },
          biggest_loss: { type: ["number", "null"] },
          summary: { type: "string" },
          insights: { type: "array", items: { type: "string" } },
          not_visible: { type: "array", items: { type: "string" } }
        }
      }
    });
    
    setAnalysis(result);
    
    // Save to database
    await api.entities.PnLAnalysis.create({
      screenshot_url: imageUrl,
      extracted_pnl: result.extracted_pnl,
      extracted_trades: result.extracted_trades,
      extracted_win_rate: result.extracted_win_rate,
      ai_summary: result.summary,
      insights: result.insights
    });
    
    setAnalyzing(false);
    onSuccess?.();
  };

  const handleClose = () => {
    setImageUrl('');
    setAnalysis(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0f0f17] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-400" />
            AI P&L Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Upload Area */}
          {!imageUrl ? (
            <label className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-white/10 hover:border-green-500/30 cursor-pointer transition-all bg-card/[0.02]">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {uploading ? (
                <Loader2 className="w-10 h-10 animate-spin text-green-400" />
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <ImageIcon className="w-8 h-8 text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Upload P&L Screenshot</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Supports Tradovate, NinjaTrader, TradingView, and more
                    </p>
                  </div>
                </>
              )}
            </label>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-white/10">
                <img 
                  src={imageUrl} 
                  alt="P&L Screenshot" 
                  className="w-full max-h-64 object-contain bg-black/50"
                />
              </div>

              {!analysis && (
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-6"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Analyzing Screenshot...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Analyze Screenshot
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <h3 className="font-semibold text-green-400 mb-2">Summary</h3>
                <p className="text-sm text-gray-300">{analysis.summary}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <MetricCard 
                  label="P&L" 
                  value={analysis.extracted_pnl !== null ? `$${analysis.extracted_pnl.toLocaleString()}` : 'Not visible'} 
                />
                <MetricCard 
                  label="Trades" 
                  value={analysis.extracted_trades !== null ? analysis.extracted_trades : 'Not visible'} 
                />
                <MetricCard 
                  label="Win Rate" 
                  value={analysis.extracted_win_rate !== null ? `${analysis.extracted_win_rate}%` : 'Not visible'} 
                />
              </div>

              {analysis.insights?.length > 0 && (
                <div className="p-4 rounded-xl bg-card/5 border border-white/10">
                  <h3 className="font-semibold mb-3">Educational Insights</h3>
                  <ul className="space-y-2">
                    {analysis.insights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-green-400 mt-0.5">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-gray-500 text-center">
                ⚠️ Educational analysis only — not financial advice
              </p>

              <Button
                onClick={handleClose}
                className="w-full bg-card/10 hover:bg-card/20"
              >
                Done
              </Button>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ label, value }) {
  const isNotVisible = value === 'Not visible';
  return (
    <div className={cn(
      "p-3 rounded-xl border",
      isNotVisible ? "bg-card/5 border-white/5" : "bg-card/5 border-white/10"
    )}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={cn(
        "text-lg font-bold mt-1",
        isNotVisible && "text-gray-600 text-sm"
      )}>{value}</p>
    </div>
  );
}