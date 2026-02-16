import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Trash2,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from "@/lib/utils";

export default function AnalysisSummary({ 
  analysis, 
  onConfirm, 
  onReanalyze, 
  onDelete 
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!analysis) return null;

  const statusConfig = {
    UPLOADED: { icon: Loader2, color: 'text-blue-500', bg: 'bg-primary/10', label: 'Uploaded', spin: true },
    PROCESSING: { icon: Loader2, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Processing...', spin: true },
    COMPLETE: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', label: 'Complete', spin: false },
    ERROR: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Error', spin: false }
  };

  const status = statusConfig[analysis.status] || statusConfig.PROCESSING;
  const Icon = status.icon;

  const hasExtractedData = analysis.extracted_json && Object.keys(analysis.extracted_json).length > 0;
  const hasTrades = analysis.extracted_json?.trade_lines?.length > 0 || 
                    analysis.extracted_json?.trades?.length > 0;

  return (
    <div className="glass-card rounded-lg border border-border p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", status.bg)}>
            <Icon className={cn("w-5 h-5", status.color, status.spin && "animate-spin")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold text-foreground truncate">
                {analysis.file_name}
              </h4>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                status.bg,
                status.color
              )}>
                {status.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {analysis.file_type.replace('_', ' ')}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={async () => {
            setIsDeleting(true);
            await onDelete(analysis.id);
          }}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* Error Message */}
      {analysis.status === 'ERROR' && analysis.error_message && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-900">{analysis.error_message}</p>
        </div>
      )}

      {/* Extracted Summary */}
      {analysis.status === 'COMPLETE' && analysis.extracted_summary && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <h5 className="text-xs font-semibold text-muted-foreground mb-2">Analysis Summary</h5>
          <div className="space-y-1">
            {analysis.extracted_summary.split('\n').filter(line => line.trim()).map((line, idx) => (
              <p key={idx} className="text-sm text-foreground">• {line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Key Extracted Values */}
      {analysis.status === 'COMPLETE' && hasExtractedData && (
        <div className="grid grid-cols-2 gap-3">
          {analysis.extracted_json.total_pnl_currency !== undefined && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Net P&L</p>
              <div className="flex items-center gap-1">
                {analysis.extracted_json.total_pnl_currency >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <p className={cn(
                  "text-lg font-bold",
                  analysis.extracted_json.total_pnl_currency >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  ${Number(analysis.extracted_json.total_pnl_currency).toFixed(2)}
                </p>
              </div>
            </div>
          )}
          {analysis.extracted_json.trades_count !== undefined && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Trades</p>
              <p className="text-lg font-bold text-foreground">
                {analysis.extracted_json.trades_count}
              </p>
            </div>
          )}
          {analysis.extracted_json.wins !== undefined && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Wins</p>
              <p className="text-lg font-bold text-green-600">
                {analysis.extracted_json.wins}
              </p>
            </div>
          )}
          {analysis.extracted_json.losses !== undefined && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Losses</p>
              <p className="text-lg font-bold text-red-600">
                {analysis.extracted_json.losses}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {analysis.status === 'COMPLETE' && (
        <div className="flex gap-2 pt-2 border-t border-border">
          {hasTrades && (
            <Button
              onClick={() => onConfirm(analysis)}
              className="flex-1 bg-primary text-primary-foreground"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Create Trades
            </Button>
          )}
          <Button
            onClick={() => onReanalyze(analysis)}
            variant="outline"
            className="border-border"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Re-analyze
          </Button>
        </div>
      )}
    </div>
  );
}