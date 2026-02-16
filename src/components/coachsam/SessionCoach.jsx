import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Send, Save, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

const PSYCHOLOGY_REASONS = [
  { value: 'tilt', label: 'Tilt / Anger' },
  { value: 'anxiety', label: 'Anxiety' },
  { value: 'overtrading', label: 'Overtrading' },
  { value: 'revenge', label: 'Revenge Trading' },
  { value: 'confidence', label: 'Confidence Dip' },
  { value: 'blew_account', label: 'Blew an Account' },
  { value: 'general', label: 'General Reset' }
];

const FINANCE_REASONS = [
  { value: 'overspending', label: 'Spending too much on prop firms' },
  { value: 'resets', label: 'Keep buying resets / new accounts' },
  { value: 'debt', label: 'In debt / financial pressure' },
  { value: 'payout_plan', label: 'Need a plan for next payout' },
  { value: 'money_stress', label: 'General money stress' }
];

export default function SessionCoach({ currentUser, selectedAccountId }) {
  const [mode, setMode] = useState('PSYCHOLOGY');
  const [sessionStage, setSessionStage] = useState('SELECT_REASON'); // SELECT_REASON, SELECT_JOURNAL, CHAT
  const [selectedReason, setSelectedReason] = useState(null);
  const [linkedJournalId, setLinkedJournalId] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showSafetyStop, setShowSafetyStop] = useState(false);
  
  // Finance mode specific
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [outstandingDebt, setOutstandingDebt] = useState('');
  const [last30DaysSpend, setLast30DaysSpend] = useState(0);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentUser?.email && selectedAccountId) {
      api.entities.JournalEntry.filter({
        created_by: currentUser.email,
        account_id: selectedAccountId,
        status: 'registered'
      }, '-entry_date', 10).then(setJournalEntries);
      
      // Load last 30 days spending
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      api.entities.AccountPurchaseEvent.filter({
        user_id: currentUser.email
      }).then(events => {
        const recent = events.filter(e => new Date(e.created_date) >= thirtyDaysAgo);
        const total = recent.reduce((sum, e) => sum + (e.cost || 0), 0);
        setLast30DaysSpend(total);
      });
    }
  }, [currentUser, selectedAccountId]);

  const handleStartSession = async () => {
    if (!selectedReason) return;
    
    setSessionStage('CHAT');
    
    let welcomeText = `Hey, I'm Coach Sam. This is not licensed therapy — just performance psychology support for traders.\n\nGuidance framework created in collaboration with a trader with 10+ years' experience.\n\n`;
    
    if (mode === 'PSYCHOLOGY') {
      const reasonLabels = {
        tilt: "dealing with tilt or anger",
        anxiety: "feeling anxious about trading",
        overtrading: "overtrading today",
        revenge: "revenge trading",
        confidence: "experiencing a confidence dip",
        blew_account: "just blew an account",
        general: "needing a reset"
      };
      welcomeText += `I see you're ${reasonLabels[selectedReason] || 'looking for support'}.\n\n`;
      
      if (linkedJournalId) {
        const entry = journalEntries.find(e => e.id === linkedJournalId);
        if (entry) {
          welcomeText += `Looking at your journal entry from ${format(new Date(entry.entry_date), 'MMM d')}:\n`;
          welcomeText += `- P&L: ${entry.daily_pnl >= 0 ? '+' : ''}$${entry.daily_pnl?.toFixed(2) || '0.00'}\n`;
          welcomeText += `- Trades: ${entry.trade_count || 0} (${entry.wins || 0}W/${entry.losses || 0}L)\n`;
          welcomeText += `- Discipline: ${entry.rule_status === 'NONE' ? 'Followed plan ✓' : entry.rule_status === 'MINOR' ? 'Minor deviation' : 'Major break'}\n\n`;
        }
      }
      
      welcomeText += `What's on your mind?`;
    } else {
      // Finance mode
      welcomeText += `Budgeting guidance only. Not financial advice.\n\n`;
      const financeLabels = {
        overspending: "spending too much on prop accounts",
        resets: "buying too many resets",
        debt: "under financial pressure",
        payout_plan: "planning your next payout",
        money_stress: "experiencing money stress"
      };
      welcomeText += `I see you're ${financeLabels[selectedReason] || 'looking for help with spending'}.\n\n`;
      
      if (last30DaysSpend > 0) {
        welcomeText += `Quick context:\n- Last 30 days spending: $${last30DaysSpend.toFixed(2)}\n`;
      }
      if (monthlyBudget) {
        welcomeText += `- Your monthly budget: $${monthlyBudget}\n`;
      }
      if (outstandingDebt) {
        welcomeText += `- Outstanding debt: $${outstandingDebt}\n`;
      }
      welcomeText += `\nWhat's the situation today?`;
    }
    
    setMessages([{
      role: 'assistant',
      content: welcomeText,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isProcessing) return;

    const userMessage = { role: 'user', content: userInput, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setUserInput('');
    setIsProcessing(true);

    // Self-harm detection
    const harmKeywords = ['kill myself', 'suicide', 'end it all', 'not worth living', 'want to die'];
    const containsHarm = harmKeywords.some(keyword => userInput.toLowerCase().includes(keyword));
    
    if (containsHarm) {
      setShowSafetyStop(true);
      const safetyMsg = {
        role: 'assistant',
        content: `I hear you're in serious distress. Please reach out to a crisis helpline immediately:\n\n🇺🇸 National Suicide Prevention Lifeline: 988\n🇬🇧 Samaritans: 116 123\n🌍 International: findahelpline.com\n\nThis chat cannot provide crisis support. Please get help now.`,
        timestamp: new Date().toISOString()
      };
      setMessages([...updatedMessages, safetyMsg]);
      setIsProcessing(false);
      return;
    }

    const conversationText = updatedMessages
      .map(m => `${m.role === 'user' ? 'Trader' : 'Coach Sam'}: ${m.content}`)
      .join('\n\n');

    let prompt = '';
    
    if (mode === 'PSYCHOLOGY') {
      prompt = `You are Coach Sam, a performance psychology coach for traders. Not a licensed therapist.

Reason for session: ${selectedReason}

Conversation so far:
${conversationText}

Your role:
- 2-3 short structured questions max
- Focus on emotions, triggers, discipline
- Identify patterns: revenge trading, overtrading, hesitation, FOMO
- Provide calming reframes and practical steps
- Be human, grounded, supportive
- No medical claims, no diagnosis
- No exclamation marks, no hype

Respond to the trader's last message:`;
    } else {
      prompt = `You are Coach Sam, a budgeting accountability coach for traders. Not a financial advisor.

Context:
- Reason: ${selectedReason}
- Monthly budget: ${monthlyBudget || 'not set'}
- Outstanding debt: ${outstandingDebt || 'none'}
- Last 30 days spending: $${last30DaysSpend.toFixed(2)}

Conversation so far:
${conversationText}

Your role:
- Ask 1-2 clarifying questions about spending patterns
- Reflect back the numbers
- Normalize the situation (many traders struggle with this)
- Provide a simple "next 7 days" spending discipline plan
- No financial advice, no investment advice
- Warm, supportive, accountability-focused

Budgeting guidance only. Not financial advice.

Respond to the trader's last message:`;
    }

    try {
      const response = await api.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      const aiMessage = { role: 'assistant', content: response, timestamp: new Date().toISOString() };
      setMessages([...updatedMessages, aiMessage]);
    } catch (error) {
      const errorMsg = { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages([...updatedMessages, errorMsg]);
    }

    setIsProcessing(false);
  };

  const handleEndSession = async () => {
    setIsSaving(true);

    const conversationText = messages
      .map(m => `${m.role === 'user' ? 'Trader' : 'Coach Sam'}: ${m.content}`)
      .join('\n\n');

    const summaryPrompt = `Based on this ${mode === 'PSYCHOLOGY' ? 'psychology' : 'finance'} coaching session, provide:

Conversation:
${conversationText}

Return JSON:
{
  "summary": "3-bullet summary of the session",
  "next7DayPlan": "3 practical action steps for the next 7 days",
  "doNotDoRule": "One 'Do Not Do' rule (1 sentence)"
}`;

    try {
      const result = await api.integrations.Core.InvokeLLM({
        prompt: summaryPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            next7DayPlan: { type: "string" },
            doNotDoRule: { type: "string" }
          }
        }
      });

      const sessionData = {
        user_id: currentUser.email,
        account_id: selectedAccountId,
        mode,
        reason_category: selectedReason,
        linked_journal_entry_id: linkedJournalId,
        transcript_json: messages,
        summary_text: result.summary,
        next_7day_plan_text: result.next7DayPlan,
        do_not_do_rule_text: result.doNotDoRule,
        ended_at: new Date().toISOString()
      };

      await api.entities.CoachSamSessions.create(sessionData);
      
      // Reset
      setSessionStage('SELECT_REASON');
      setMessages([]);
      setSelectedReason(null);
      setLinkedJournalId(null);
      setMonthlyBudget('');
      setOutstandingDebt('');
      
      alert('Session saved successfully!');
    } catch (error) {
      console.error('Failed to save session:', error);
      alert('Failed to save session. Please try again.');
    }

    setIsSaving(false);
  };

  if (showSafetyStop) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="glass-card rounded-2xl border border-red-300 bg-red-50 p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-900 mb-4">Please Get Help Now</h3>
          <div className="text-left space-y-3 text-sm text-red-800">
            <p className="font-semibold">Crisis helplines:</p>
            <p>🇺🇸 National Suicide Prevention Lifeline: <strong>988</strong></p>
            <p>🇬🇧 Samaritans: <strong>116 123</strong></p>
            <p>🌍 International: <strong>findahelpline.com</strong></p>
          </div>
          <Button
            onClick={() => {
              setShowSafetyStop(false);
              setSessionStage('SELECT_REASON');
              setMessages([]);
            }}
            className="mt-6 bg-slate-800 hover:bg-slate-900 text-white"
          >
            Close Session
          </Button>
        </div>
      </div>
    );
  }

  if (sessionStage === 'SELECT_REASON') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="glass-card rounded-2xl border border-border p-6">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2">
              This is not a licensed therapist. This is performance psychology support for traders.
            </p>
            <p className="text-xs text-muted-foreground">
              Guidance framework created in collaboration with a trader with 10+ years' experience.
            </p>
          </div>

          <Tabs value={mode} onValueChange={setMode} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="PSYCHOLOGY">Trading Psychology</TabsTrigger>
              <TabsTrigger value="FINANCE">Prop Firm & Finance</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">
                What brings you here today?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(mode === 'PSYCHOLOGY' ? PSYCHOLOGY_REASONS : FINANCE_REASONS).map(reason => (
                  <Button
                    key={reason.value}
                    variant={selectedReason === reason.value ? 'default' : 'outline'}
                    onClick={() => setSelectedReason(reason.value)}
                    className="justify-start h-auto py-3"
                  >
                    {reason.label}
                  </Button>
                ))}
              </div>
            </div>

            {mode === 'PSYCHOLOGY' && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Link to journal entry (optional)
                </label>
                <Select value={linkedJournalId || ''} onValueChange={setLinkedJournalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No journal entry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No journal entry</SelectItem>
                    {journalEntries.map(entry => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {format(new Date(entry.entry_date), 'MMM d, yyyy')} — 
                        {entry.daily_pnl >= 0 ? '+' : ''}${entry.daily_pnl?.toFixed(2) || '0.00'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {mode === 'FINANCE' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Monthly budget for prop firms (optional)</label>
                  <Input
                    type="number"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Outstanding debt (optional)</label>
                  <Input
                    type="number"
                    value={outstandingDebt}
                    onChange={(e) => setOutstandingDebt(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                {last30DaysSpend > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Last 30 days spending</p>
                    <p className="text-lg font-bold text-foreground">${last30DaysSpend.toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleStartSession}
              disabled={!selectedReason}
              className="w-full bg-primary text-primary-foreground h-12"
            >
              Start Session with Coach Sam
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card rounded-2xl border border-border flex flex-col h-[70vh]">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-lg text-foreground">Coach Sam Session</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === 'PSYCHOLOGY' ? 'Performance psychology support' : 'Budgeting guidance only. Not financial advice.'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 max-w-[85%]",
                  msg.role === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border space-y-2">
          <div className="flex gap-2">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Share what's on your mind..."
              className="resize-none"
              rows={2}
              disabled={isSaving}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isProcessing || isSaving}
              className="bg-primary text-primary-foreground"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleEndSession}
              disabled={isSaving || messages.length <= 1}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  End Session & Save
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                if (confirm('Exit without saving?')) {
                  setSessionStage('SELECT_REASON');
                  setMessages([]);
                  setSelectedReason(null);
                }
              }}
              disabled={isSaving}
              variant="outline"
              className="flex-1"
            >
              Exit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}