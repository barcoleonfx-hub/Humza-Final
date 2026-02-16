import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, Loader2, Save } from 'lucide-react';
import { cn } from "@/lib/utils";
import { api } from '@/api/apiClient';

export default function PsychologistPanel({ 
  userId,
  dateKey,
  accountId,
  journalEntryId,
  journalData,
  ruleDisciplineData,
  onClose, 
  onSaveSession,
  existingSession 
}) {
  const [messages, setMessages] = useState(existingSession?.messages || []);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState(existingSession?.id);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      let welcomeText = `Hey, I'm Coach Sam. This is not licensed therapy — just performance psychology support for traders.\n\nGuidance framework created in collaboration with a trader with 10+ years' experience.\n\nLooking at your trading day:\n- Trades: ${journalData.tradeCount || 0}\n- Net P&L: $${(journalData.totalPnl || 0).toFixed(2)}`;

      if (ruleDisciplineData) {
        if (ruleDisciplineData.rule_status === 'MAJOR') {
          welcomeText += `\n- Rule discipline: Major rule break (${ruleDisciplineData.rules_broken?.join(', ')})${ruleDisciplineData.rule_explanation ? `\n  "${ruleDisciplineData.rule_explanation}"` : ''}\n\nI see you broke some trading rules today. Let's explore what happened and how you're feeling about it.`;
        } else if (ruleDisciplineData.rule_status === 'MINOR') {
          welcomeText += `\n- Rule discipline: Minor deviation (${ruleDisciplineData.rules_broken?.join(', ')})\n\nYou mentioned a minor rule deviation. It's good that you're aware of it.`;
        } else {
          welcomeText += `\n- Rule discipline: Followed plan ✓\n\nI see you followed your trading plan today. That's excellent discipline.`;
        }
      }

      welcomeText += `\n\nWhat's on your mind about today's trading?`;
      
      const welcomeMsg = {
        role: 'assistant',
        content: welcomeText,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMsg]);
    }
  }, []);

  useEffect(() => {
    const saveMessages = async () => {
      if (!userId || !dateKey || !accountId || !journalEntryId || messages.length === 0) return;
      
      try {
        const chatData = {
          user_id: userId,
          account_id: accountId,
          journal_entry_id: journalEntryId,
          date_key: dateKey,
          messages_json: messages
        };

        if (sessionId) {
          await api.entities.PsychologistChats.update(sessionId, chatData);
        } else {
          const created = await api.entities.PsychologistChats.create(chatData);
          setSessionId(created.id);
        }
      } catch (error) {
        console.error('Failed to save psychologist messages:', error);
      }
    };

    saveMessages();
  }, [messages, userId, dateKey, accountId, journalEntryId]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isProcessing) return;

    const userMessage = { role: 'user', content: userInput, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setUserInput('');
    setIsProcessing(true);

    const conversationText = updatedMessages
      .map(m => `${m.role === 'user' ? 'Trader' : 'Coach Sam'}: ${m.content}`)
      .join('\n');

    const prompt = `You are Coach Sam, a performance psychology coach for traders. NOT a licensed therapist.

Today's trading context:
- Trades: ${journalData.tradeCount || 0}
- Net P&L: $${(journalData.totalPnl || 0).toFixed(2)}
- Win rate: ${journalData.winRate || 0}%
${journalData.notes ? `- Notes: ${journalData.notes}` : ''}

Conversation so far:
${conversationText}

Your role:
- Focus on emotions, discipline, decision-making
- Identify triggers: revenge trading, overtrading, hesitation, FOMO
- Provide calming reframes and practical coping steps
- Be human, grounded, supportive
- No medical claims, no diagnosis
- No exclamation marks, no hype

Respond to the trader's last message with practical psychology support:`;

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

    const summaryPrompt = `Based on this trading psychology conversation, provide:

Conversation:
${conversationText}

Return JSON:
{
  "summary": "2-3 sentence summary of the session",
  "tomorrowPlan": "3 practical coping steps for tomorrow's session"
}`;

    try {
      const result = await api.integrations.Core.InvokeLLM({
        prompt: summaryPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            tomorrowPlan: { type: "string" }
          }
        }
      });

      if (sessionId) {
        await api.entities.PsychologistChats.update(sessionId, {
          session_summary: result.summary,
          coping_plan: result.tomorrowPlan,
          ended_at: new Date().toISOString()
        });
      }

      await onSaveSession({
        id: sessionId,
        messages,
        summary: result.summary,
        tomorrowPlan: result.tomorrowPlan
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }

    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-foreground">Coach Sam</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              This is not a licensed therapist. This is performance psychology support for traders.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Guidance framework created in collaboration with a trader with 10+ years' experience.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
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
                  "rounded-2xl px-4 py-2.5 max-w-[80%]",
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

        {/* Input */}
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
              placeholder="Share what you're feeling..."
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
              onClick={onClose}
              disabled={isSaving}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}