import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function TradeLineConfirmation({ extractedData, onConfirm, onCancel }) {
  const [currency, setCurrency] = useState(extractedData.currency_code || 'USD');
  const [tradeLines, setTradeLines] = useState(
    extractedData.trade_lines && extractedData.trade_lines.length > 0
      ? extractedData.trade_lines
      : [{ symbol: '', side: 'BUY', pnl_currency: extractedData.total_pnl_currency || 0 }]
  );
  const [manualOverride, setManualOverride] = useState(false);
  const [manualTotal, setManualTotal] = useState('');
  const [showMismatch, setShowMismatch] = useState(false);

  // Calculate sum of all trade lines
  const calculateSum = (lines) => {
    return lines.reduce((sum, line) => {
      const pnl = parseFloat(line.pnl_currency) || 0;
      return sum + pnl;
    }, 0);
  };

  const computedTotal = calculateSum(tradeLines);

  // Auto-set manual total when toggling override on
  useEffect(() => {
    if (manualOverride && manualTotal === '') {
      setManualTotal(computedTotal.toFixed(2));
    }
  }, [manualOverride]);

  const handleAddLine = () => {
    setTradeLines([...tradeLines, { symbol: '', side: 'BUY', pnl_currency: 0 }]);
  };
  
  const handleRemoveLine = (index) => {
    const updated = tradeLines.filter((_, i) => i !== index);
    setTradeLines(updated);
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...tradeLines];
    updated[index][field] = value;
    setTradeLines(updated);
  };

  const handleConfirm = () => {
    let finalTotal;
    
    if (manualOverride) {
      const manual = parseFloat(manualTotal);
      if (isNaN(manual)) {
        alert('Invalid manual total. Please enter a valid number.');
        return;
      }
      
      // Check for mismatch
      if (Math.abs(manual - computedTotal) > 0.01) {
        setShowMismatch(true);
        return;
      }
      
      finalTotal = manual;
    } else {
      // Use computed total
      if (isNaN(computedTotal)) {
        alert('Unable to compute total. Check trade line values.');
        return;
      }
      finalTotal = computedTotal;
    }
    
    onConfirm({
      total_pnl_currency: finalTotal,
      currency_code: currency || 'USD',
      trade_lines: tradeLines.map(t => ({
        symbol: t.symbol || 'Unknown',
        side: t.side,
        pnl_currency: parseFloat(t.pnl_currency) || 0
      })),
      trades_count: tradeLines.length,
      wins: tradeLines.filter(t => parseFloat(t.pnl_currency) > 0).length,
      losses: tradeLines.filter(t => parseFloat(t.pnl_currency) < 0).length
    });
  };

  const handleUseSumOfLines = () => {
    setManualTotal(computedTotal.toFixed(2));
    setShowMismatch(false);
    // Proceed with confirmation using computed total
    onConfirm({
      total_pnl_currency: computedTotal,
      currency_code: currency || 'USD',
      trade_lines: tradeLines.map(t => ({
        symbol: t.symbol || 'Unknown',
        side: t.side,
        pnl_currency: parseFloat(t.pnl_currency) || 0
      })),
      trades_count: tradeLines.length,
      wins: tradeLines.filter(t => parseFloat(t.pnl_currency) > 0).length,
      losses: tradeLines.filter(t => parseFloat(t.pnl_currency) < 0).length
    });
  };

  const handleKeepManualTotal = () => {
    const manual = parseFloat(manualTotal);
    setShowMismatch(false);
    // Proceed with manual override
    onConfirm({
      total_pnl_currency: manual,
      currency_code: currency || 'USD',
      trade_lines: tradeLines.map(t => ({
        symbol: t.symbol || 'Unknown',
        side: t.side,
        pnl_currency: parseFloat(t.pnl_currency) || 0
      })),
      trades_count: tradeLines.length,
      wins: tradeLines.filter(t => parseFloat(t.pnl_currency) > 0).length,
      losses: tradeLines.filter(t => parseFloat(t.pnl_currency) < 0).length
    });
  };

  return (
    <div className="glass-card rounded-lg border border-border p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Confirm Extracted Data</h3>
      
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-muted-foreground">
              {manualOverride ? 'Total P&L (Manual)' : 'Total P&L (Auto-calculated)'}
            </label>
            <button
              type="button"
              onClick={() => setManualOverride(!manualOverride)}
              className="text-xs text-primary hover:text-primary-foreground/80 underline"
            >
              {manualOverride ? 'Use auto-calc' : 'Override total'}
            </button>
          </div>
          {manualOverride ? (
            <Input
              type="number"
              step="0.01"
              value={manualTotal}
              onChange={(e) => setManualTotal(e.target.value)}
              placeholder="Enter total"
              className={cn(
                parseFloat(manualTotal) !== computedTotal && manualTotal !== '' && "border-amber-500"
              )}
            />
          ) : (
            <Input
              type="number"
              step="0.01"
              value={computedTotal.toFixed(2)}
              readOnly
              className="bg-muted/50"
            />
          )}
          {manualOverride && manualTotal !== '' && Math.abs(parseFloat(manualTotal) - computedTotal) > 0.01 && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Sum of lines: ${computedTotal.toFixed(2)}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Currency</label>
          <Input
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            placeholder="USD"
          />
        </div>
      </div>

      {showMismatch && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900 mb-1">
                Your manual total does not match the sum of trade lines.
              </p>
              <p className="text-xs text-amber-700">
                Manual total: ${parseFloat(manualTotal).toFixed(2)} • Sum of lines: ${computedTotal.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleUseSumOfLines}
              size="sm"
              variant="outline"
              className="border-amber-600 text-amber-700 hover:bg-amber-100"
            >
              Use sum of trade lines
            </Button>
            <Button
              onClick={handleKeepManualTotal}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Keep manual total
            </Button>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">Trade Lines</label>
        <div className="space-y-2">
          {tradeLines.map((line, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <Input
                placeholder="Symbol"
                value={line.symbol}
                onChange={(e) => handleLineChange(idx, 'symbol', e.target.value)}
                className="w-32"
              />
              <Select
                value={line.side}
                onValueChange={(v) => handleLineChange(idx, 'side', v)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">Buy</SelectItem>
                  <SelectItem value="SELL">Sell</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                placeholder="P&L"
                value={line.pnl_currency}
                onChange={(e) => handleLineChange(idx, 'pnl_currency', e.target.value)}
                className="w-32"
              />
              {tradeLines.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveLine(idx)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddLine}
          className="mt-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Trade Line
        </Button>
      </div>

      <div className="flex gap-2 pt-4 border-t border-border">
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleConfirm} className="bg-primary text-primary-foreground">
          Save & Continue
        </Button>
      </div>
    </div>
  );
}