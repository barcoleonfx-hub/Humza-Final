import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from "@/lib/utils";

const PROTOCOLS = [
  {
    name: 'Red Day Recovery Protocol',
    description: 'Reset after a losing day',
    steps: [
      'Close trading platform immediately',
      'Take a 10-minute walk outside',
      'Write down 3 things you did right today',
      'Review violated rules (if any) without judgment',
      'Set a clear plan for tomorrow with reduced risk',
      'No revenge trading — walk away with dignity'
    ]
  },
  {
    name: 'Post-Loss Cooldown Protocol',
    description: 'Manage emotions after a big loss',
    steps: [
      'Stop trading immediately',
      'Take 5 deep breaths: 4 seconds in, 6 seconds out',
      'Acknowledge the loss without judging yourself',
      'Close your charts for at least 30 minutes',
      'Drink water and eat something healthy',
      'Write down what happened (facts only, no emotions)'
    ]
  },
  {
    name: 'Overtrading Reset',
    description: 'Stop the overtrading cycle',
    steps: [
      'Admit you are overtrading right now',
      'Close all open positions',
      'Set a hard trade limit for tomorrow (e.g., max 3 trades)',
      'Write down your baseline trade frequency',
      'Commit to walking away after your limit is hit',
      'Review this protocol before every session for 7 days'
    ]
  },
  {
    name: 'Pre-Session Grounding',
    description: 'Mental preparation before trading',
    steps: [
      'Close all distracting tabs and apps',
      'Review your trading plan and rules',
      'Set your max trades and risk limits for today',
      'Take 3 deep breaths',
      'Visualize executing your plan with discipline',
      'Say out loud: "I will follow my rules today"'
    ]
  },
  {
    name: 'Confidence Reset',
    description: 'Rebuild confidence after a rough patch',
    steps: [
      'Review your last 10 winning trades',
      'Write down what you did right in each one',
      'Identify your edge in simple words',
      'Reduce position size by 50% for next 5 trades',
      'Focus on execution quality, not P&L',
      'Celebrate small wins — discipline counts'
    ]
  },
  {
    name: 'Rule Integrity Check',
    description: 'Daily discipline check-in',
    steps: [
      "Review your trading rules (write them if you don't have them)",
      'Rate your rule adherence today: 1-10',
      'Identify which rule you broke (if any)',
      'Write down why you broke it (trigger, emotion, situation)',
      'Set a specific plan to prevent it tomorrow',
      'Forgive yourself and commit to tomorrow'
    ]
  },
  {
    name: 'Account Reset Reflection',
    description: 'Process after blowing an account',
    steps: [
      'Acknowledge the loss and take a 24-hour break',
      'Do not buy a new account immediately',
      'Write down every rule you broke',
      'Identify the pattern: what triggered the spiral?',
      'Set a hard spending freeze (14 days minimum)',
      'Only return when you have a concrete plan'
    ]
  }
];

export default function Protocols({ currentUser }) {
  const [activeProtocol, setActiveProtocol] = useState(null);
  const [checkedSteps, setCheckedSteps] = useState({});
  const [completing, setCompleting] = useState(false);

  const handleToggleStep = (protocolName, stepIndex) => {
    const key = `${protocolName}-${stepIndex}`;
    setCheckedSteps(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCompleteProtocol = async (protocol) => {
    setCompleting(true);
    try {
      await api.entities.ProtocolCompletions.create({
        user_id: currentUser.email,
        protocol_name: protocol.name,
        completed_at: new Date().toISOString()
      });
      
      setCheckedSteps({});
      setActiveProtocol(null);
      alert('Protocol completed!');
    } catch (error) {
      console.error('Failed to save protocol completion:', error);
      alert('Failed to save. Please try again.');
    }
    setCompleting(false);
  };

  if (activeProtocol) {
    const protocol = PROTOCOLS.find(p => p.name === activeProtocol);
    const allChecked = protocol.steps.every((_, idx) => 
      checkedSteps[`${protocol.name}-${idx}`]
    );

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => setActiveProtocol(null)}
          className="mb-4"
        >
          ← Back to Protocols
        </Button>

        <div className="glass-card rounded-2xl border border-border p-6">
          <h3 className="text-xl font-bold text-foreground mb-2">{protocol.name}</h3>
          <p className="text-sm text-muted-foreground mb-6">{protocol.description}</p>

          <div className="space-y-4">
            {protocol.steps.map((step, idx) => {
              const key = `${protocol.name}-${idx}`;
              const isChecked = checkedSteps[key];

              return (
                <div
                  key={idx}
                  onClick={() => handleToggleStep(protocol.name, idx)}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                    isChecked
                      ? "bg-green-50 border-green-200"
                      : "bg-card border-border hover:bg-muted/50"
                  )}
                >
                  {isChecked ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  )}
                  <p className={cn(
                    "text-sm leading-relaxed",
                    isChecked ? "text-green-900" : "text-foreground"
                  )}>
                    {step}
                  </p>
                </div>
              );
            })}
          </div>

          <Button
            onClick={() => handleCompleteProtocol(protocol)}
            disabled={!allChecked || completing}
            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white h-12"
          >
            {completing ? 'Saving...' : 'Complete Protocol'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Recovery Protocols</h2>
        <p className="text-muted-foreground">Guided routines to reset your mindset</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROTOCOLS.map((protocol) => (
          <div
            key={protocol.name}
            onClick={() => setActiveProtocol(protocol.name)}
            className="glass-card rounded-xl border border-border p-6 cursor-pointer hover:border-blue-300 transition-all"
          >
            <h3 className="font-semibold text-lg text-foreground mb-2">{protocol.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{protocol.description}</p>
            <p className="text-xs text-muted-foreground">{protocol.steps.length} steps</p>
          </div>
        ))}
      </div>
    </div>
  );
}