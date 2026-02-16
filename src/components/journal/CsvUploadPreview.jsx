import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, X } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function CsvUploadPreview({ csvData, onImport, onCancel }) {
  const [mapping, setMapping] = useState({
    date: '',
    time: '',
    symbol: '',
    side: '',
    pnl: '',
    notes: ''
  });
  const [importing, setImporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const headers = csvData.length > 0 ? Object.keys(csvData[0]) : [];
  const preview = csvData.slice(0, 20);

  const validateAndImport = () => {
    const errors = [];
    
    if (!mapping.date) errors.push('Date column is required');
    if (!mapping.symbol) errors.push('Symbol column is required');
    if (!mapping.side) errors.push('Side column is required');
    if (!mapping.pnl) errors.push('P&L column is required');

    // Validate P&L is numeric
    const pnlValues = csvData.map(row => row[mapping.pnl]);
    const nonNumeric = pnlValues.filter(val => isNaN(parseFloat(val)));
    if (nonNumeric.length > 0) {
      errors.push(`P&L column contains non-numeric values (${nonNumeric.length} rows)`);
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setImporting(true);
    onImport(mapping);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">CSV Preview</h3>
          <p className="text-sm text-muted-foreground">Map columns to import {csvData.length} trades</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Column Mapping */}
      <div className="grid grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg border border-border">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Date Column *</label>
          <Select value={mapping.date} onValueChange={(v) => setMapping({...mapping, date: v})}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Time Column</label>
          <Select value={mapping.time} onValueChange={(v) => setMapping({...mapping, time: v})}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>None</SelectItem>
              {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Symbol Column *</label>
          <Select value={mapping.symbol} onValueChange={(v) => setMapping({...mapping, symbol: v})}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Side Column *</label>
          <Select value={mapping.side} onValueChange={(v) => setMapping({...mapping, side: v})}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">P&L Column *</label>
          <Select value={mapping.pnl} onValueChange={(v) => setMapping({...mapping, pnl: v})}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Notes Column</label>
          <Select value={mapping.notes} onValueChange={(v) => setMapping({...mapping, notes: v})}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>None</SelectItem>
              {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-900 mb-1">Validation Errors:</p>
          <ul className="text-sm text-red-700 list-disc list-inside">
            {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      {/* Preview Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border sticky top-0">
              <tr>
                {headers.map(h => (
                  <th key={h} className="text-left p-2 text-xs font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  {headers.map(h => (
                    <td key={h} className={cn(
                      "p-2 text-xs text-muted-foreground",
                      mapping.pnl === h && isNaN(parseFloat(row[h])) && "bg-red-50 text-red-700"
                    )}>
                      {row[h]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel} disabled={importing}>
          Cancel
        </Button>
        <Button 
          onClick={validateAndImport} 
          disabled={importing}
          className="bg-primary text-primary-foreground"
        >
          {importing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Import {csvData.length} Trades
            </>
          )}
        </Button>
      </div>
    </div>
  );
}