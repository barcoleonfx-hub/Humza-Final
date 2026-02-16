import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

const RULE_OPTIONS = [
  'Overtrading',
  'Early entry',
  'Late entry',
  'Ignored stop',
  'Revenge trade',
  'Emotional entry',
  'Other'
];

export default function RuleDisciplinePanel({ onComplete, initialData }) {
  const [ruleStatus, setRuleStatus] = useState(initialData?.rule_status || 'NONE');
  const [rulesBroken, setRulesBroken] = useState(initialData?.rules_broken || []);
  const [explanation, setExplanation] = useState(initialData?.rule_explanation || '');

  const handleToggleRule = (rule) => {
    if (rulesBroken.includes(rule)) {
      setRulesBroken(rulesBroken.filter(r => r !== rule));
    } else {
      setRulesBroken([...rulesBroken, rule]);
    }
  };

  const handleContinue = () => {
    onComplete({
      rule_status: ruleStatus,
      rules_broken: rulesBroken,
      rule_explanation: explanation
    });
  };

  return (
    <div className="glass-card rounded-xl border border-border p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Rule Discipline</h3>
        <p className="text-sm text-muted-foreground">
          Track your execution quality - not just P&L
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">Did you break any trading rules today?</Label>
        
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => {
              setRuleStatus('NONE');
              setRulesBroken([]);
              setExplanation('');
            }}
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
              ruleStatus === 'NONE'
                ? "border-green-500 bg-green-50"
                : "border-border hover:border-green-300"
            )}
          >
            <CheckCircle2 className={cn(
              "w-5 h-5 flex-shrink-0",
              ruleStatus === 'NONE' ? "text-green-600" : "text-slate-400"
            )} />
            <div>
              <p className={cn(
                "font-medium",
                ruleStatus === 'NONE' ? "text-green-900" : "text-foreground"
              )}>
                No – followed my plan
              </p>
              <p className="text-xs text-muted-foreground">I stuck to my trading rules</p>
            </div>
          </button>

          <button
            onClick={() => setRuleStatus('MINOR')}
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
              ruleStatus === 'MINOR'
                ? "border-yellow-500 bg-yellow-50"
                : "border-border hover:border-yellow-300"
            )}
          >
            <AlertTriangle className={cn(
              "w-5 h-5 flex-shrink-0",
              ruleStatus === 'MINOR' ? "text-yellow-600" : "text-slate-400"
            )} />
            <div>
              <p className={cn(
                "font-medium",
                ruleStatus === 'MINOR' ? "text-yellow-900" : "text-foreground"
              )}>
                Yes – minor deviation
              </p>
              <p className="text-xs text-muted-foreground">Small rule break, manageable</p>
            </div>
          </button>

          <button
            onClick={() => setRuleStatus('MAJOR')}
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
              ruleStatus === 'MAJOR'
                ? "border-red-500 bg-red-50"
                : "border-border hover:border-red-300"
            )}
          >
            <XCircle className={cn(
              "w-5 h-5 flex-shrink-0",
              ruleStatus === 'MAJOR' ? "text-red-600" : "text-slate-400"
            )} />
            <div>
              <p className={cn(
                "font-medium",
                ruleStatus === 'MAJOR' ? "text-red-900" : "text-foreground"
              )}>
                Yes – major rule break
              </p>
              <p className="text-xs text-muted-foreground">Significant violation</p>
            </div>
          </button>
        </div>
      </div>

      {(ruleStatus === 'MINOR' || ruleStatus === 'MAJOR') && (
        <>
          <div className="space-y-3">
            <Label className="text-sm font-medium">Which rules did you break? (select all that apply)</Label>
            <div className="grid grid-cols-2 gap-2">
              {RULE_OPTIONS.map((rule) => (
                <button
                  key={rule}
                  onClick={() => handleToggleRule(rule)}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left",
                    rulesBroken.includes(rule)
                      ? "border-blue-500 bg-primary/10 text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-blue-300"
                  )}
                >
                  {rule}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Short explanation (optional)</Label>
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Brief explanation of what happened..."
              className="min-h-[80px] text-sm"
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">
              {explanation.length}/300 characters
            </p>
          </div>
        </>
      )}

      <Button
        onClick={handleContinue}
        disabled={
          (ruleStatus === 'MINOR' || ruleStatus === 'MAJOR') && rulesBroken.length === 0
        }
        className="w-full bg-primary text-primary-foreground"
      >
        Continue
      </Button>
    </div>
  );
}