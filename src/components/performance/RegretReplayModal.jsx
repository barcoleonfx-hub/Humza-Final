import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, AlertCircle, Lightbulb } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

export default function RegretReplayModal({ trade, open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [replayData, setReplayData] = useState(null);

  React.useEffect(() => {
    if (open && trade && !replayData) {
      generateReplay();
    }
  }, [open, trade]);

  const generateReplay = async () => {
    setLoading(true);
    try {
      // Check if replay already exists
      const existingReplays = await api.entities.TradeReplay.filter({ trade_id: trade.id });
      
      if (existingReplays.length > 0) {
        setReplayData(existingReplays[0]);
        setLoading(false);
        return;
      }

      // Get user's trading history for context
      const allTrades = await api.entities.Trade.filter({ created_by: trade.created_by }, '-date', 50);
      const winningTrades = allTrades.filter(t => t.result_r > 0);
      const avgWinR = winningTrades.length > 0 
        ? winningTrades.reduce((sum, t) => sum + t.result_r, 0) / winningTrades.length 
        : 2;
      const avgRiskPercent = allTrades.length > 0
        ? allTrades.reduce((sum, t) => sum + (t.risk_percent || 1), 0) / allTrades.length
        : 1;

      const prompt = `You are a trading performance coach analyzing a completed trade for educational purposes.

Trade Details:
- Symbol: ${trade.symbol}
- Direction: ${trade.direction}
- Date: ${format(new Date(trade.date), 'PPP')}
- Strategy: ${trade.strategy || 'Not specified'}
- Risk %: ${trade.risk_percent || 'Not specified'}
- Result: ${trade.result_r}R
- P&L: $${trade.pnl_amount || 'Not specified'}
- Notes: ${trade.notes || 'None'}

Trader's Historical Context:
- Average winning trade: ${avgWinR.toFixed(2)}R
- Typical risk per trade: ${avgRiskPercent.toFixed(1)}%
- Total trades analyzed: ${allTrades.length}

Generate 3 alternative educational scenarios (NOT predictions or recommendations):

1. "If managed per plan" - Estimate if trader followed their stated strategy perfectly
2. "If exited at typical winner" - What if exit matched their average winning behavior
3. "If risk stayed typical" - Impact if risk % matched their usual range

For each scenario, provide:
- estimated_result_r: number
- explanation: brief neutral explanation focusing on BEHAVIOR, not profit
- behavioral_lesson: what this teaches about consistency

Also provide 2-3 behavioral_insights about discipline, not P&L.

Return JSON:
{
  "actual_outcome": {
    "result_r": number,
    "description": "brief neutral description"
  },
  "alternative_scenarios": [
    {
      "title": "scenario name",
      "estimated_result_r": number,
      "explanation": "neutral explanation",
      "behavioral_lesson": "what this teaches"
    }
  ],
  "behavioral_insights": ["insight1", "insight2", "insight3"]
}`;

      const result = await api.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            actual_outcome: {
              type: "object",
              properties: {
                result_r: { type: "number" },
                description: { type: "string" }
              }
            },
            alternative_scenarios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  estimated_result_r: { type: "number" },
                  explanation: { type: "string" },
                  behavioral_lesson: { type: "string" }
                }
              }
            },
            behavioral_insights: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      // Save replay
      const savedReplay = await api.entities.TradeReplay.create({
        trade_id: trade.id,
        user_id: trade.created_by,
        actual_outcome: result.actual_outcome,
        alternative_scenarios: result.alternative_scenarios,
        behavioral_insights: result.behavioral_insights
      });

      setReplayData(savedReplay);
    } catch (error) {
      console.error('Replay generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReplayData(null);
    onClose();
  };

  if (!trade) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0f0f17] border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-green-400" />
            Regret Replay - Performance Insight
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Educational reflection on {trade.symbol} trade from {format(new Date(trade.date), 'MMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-400 mx-auto mb-4" />
            <p className="text-gray-400">Analyzing trade behavior patterns...</p>
          </div>
        ) : replayData ? (
          <div className="space-y-6">
            {/* Actual Outcome */}
            <div className="glass-card rounded-xl p-6 bg-card/5 border border-white/10">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                {trade.result_r >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
                Actual Outcome
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Result:</span>
                  <span className={cn(
                    "text-2xl font-bold",
                    trade.result_r >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {trade.result_r >= 0 ? '+' : ''}{trade.result_r.toFixed(2)}R
                  </span>
                </div>
                <p className="text-sm text-gray-300">{replayData.actual_outcome.description}</p>
              </div>
            </div>

            {/* Alternative Scenarios */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Alternative Scenarios (Educational)</h3>
              {replayData.alternative_scenarios.map((scenario, idx) => (
                <div key={idx} className="glass-card rounded-xl p-5 bg-card/5 border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-green-400">{scenario.title}</h4>
                    <span className={cn(
                      "text-xl font-bold",
                      scenario.estimated_result_r >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {scenario.estimated_result_r >= 0 ? '+' : ''}{scenario.estimated_result_r.toFixed(2)}R
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{scenario.explanation}</p>
                  <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-sm text-green-400">
                      <strong>Lesson:</strong> {scenario.behavioral_lesson}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Behavioral Insights */}
            <div className="glass-card rounded-xl p-6 bg-primary/5 border border-blue-500/20">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-blue-400" />
                Key Behavioral Insights
              </h3>
              <ul className="space-y-3">
                {replayData.behavioral_insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span className="text-sm text-gray-300">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-400">
                <strong>Educational performance reflection only — not financial advice.</strong> This analysis is based on your historical behavior patterns and is designed to reinforce discipline, not predict outcomes.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose} className="bg-green-500 hover:bg-green-600 text-black">
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}