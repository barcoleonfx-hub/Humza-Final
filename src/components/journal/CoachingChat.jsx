import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { api } from '@/api/apiClient';

const COACHING_QUESTIONS = [
  "How did you feel while trading today (calm, anxious, frustrated, confident)?",
  "Did you follow your rules today, or break any (overtrading, chasing, revenge)?",
  "What's one thing you want to do differently tomorrow?"
];

export default function CoachingChat({ 
  userId,
  dateKey,
  accountId,
  journalEntryId,
  journalData,
  ruleDisciplineData,
  onComplete,
  existingChat
}) {
  const [messages, setMessages] = useState(existingChat?.messages_json || []);
  const [currentIndex, setCurrentIndex] = useState(existingChat?.current_question_index || 0);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState(existingChat?.stage || 'ASKING');
  const [chatId, setChatId] = useState(existingChat?.id);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      let summaryText = `Summary: ${journalData.trades_count || 0} trades | Net P&L: $${(journalData.total_pnl_currency || 0).toFixed(2)}`;
      
      if (ruleDisciplineData) {
        if (ruleDisciplineData.rule_status === 'NONE') {
          summaryText += ` | Rule discipline: Followed plan ✓`;
        } else if (ruleDisciplineData.rule_status === 'MINOR') {
          summaryText += ` | Rule discipline: Minor deviation (${ruleDisciplineData.rules_broken?.join(', ') || 'unspecified'})`;
        } else if (ruleDisciplineData.rule_status === 'MAJOR') {
          summaryText += ` | Rule discipline: Major rule break (${ruleDisciplineData.rules_broken?.join(', ') || 'unspecified'})`;
        }
      }
      
      summaryText += `\n\nLet's reflect on your trading day.`;
      
      const summaryMsg = {
        role: 'assistant',
        content: summaryText,
        timestamp: new Date().toISOString()
      };
      const firstQuestion = {
        role: 'assistant',
        content: COACHING_QUESTIONS[0],
        timestamp: new Date().toISOString()
      };
      setMessages([summaryMsg, firstQuestion]);
    }
  }, []);

  useEffect(() => {
    const saveChat = async () => {
      if (!userId || !dateKey || !accountId || !journalEntryId) return;
      
      try {
        const chatData = {
          user_id: userId,
          account_id: accountId,
          journal_entry_id: journalEntryId,
          date_key: dateKey,
          stage,
          messages_json: messages,
          current_question_index: currentIndex
        };

        if (chatId) {
          await api.entities.JournalCoachingChats.update(chatId, chatData);
        } else {
          const created = await api.entities.JournalCoachingChats.create(chatData);
          setChatId(created.id);
        }
      } catch (error) {
        console.error('Failed to save coaching chat:', error);
      }
    };

    if (messages.length > 0) {
      saveChat();
    }
  }, [messages, stage, currentIndex, userId, dateKey, accountId, journalEntryId]);

  const detectSelfHarm = (text) => {
    const keywords = ['suicide', 'suicidal', 'kill myself', 'end it', 'not worth living', 'self harm', 'hurt myself'];
    return keywords.some(k => text.toLowerCase().includes(k));
  };

  const handleAnswer = async (answer) => {
    if (detectSelfHarm(answer)) {
      const safetyMsg = {
        role: 'assistant',
        content: `I'm deeply sorry to hear you're struggling. Please know that you're not alone, and there are steps you can take to navigate through this challenging time.\n\nImmediate Steps:\n\n1. Seek Support: Reach out to trusted friends, family members, or a mental health professional. Sharing your feelings can provide relief and perspective.\n\n2. Contact a Crisis Helpline: Organizations like the National Suicide Prevention Lifeline (1-800-273-8255) offer confidential support 24/7.\n\n3. Avoid Isolation: Stay connected with supportive individuals who can provide comfort and assistance.\n\nYour well-being is the top priority. Please consider reaching out for help today.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, { role: 'user', content: answer, timestamp: new Date().toISOString() }, safetyMsg]);
      setStage('SAFETY_STOP');
      return;
    }

    const userMsg = { role: 'user', content: answer, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    const nextIndex = currentIndex + 1;

    if (nextIndex < COACHING_QUESTIONS.length) {
      setTimeout(() => {
        const nextQuestion = {
          role: 'assistant',
          content: COACHING_QUESTIONS[nextIndex],
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, nextQuestion]);
        setCurrentIndex(nextIndex);
        setIsProcessing(false);
      }, 800);
    } else {
      setStage('COMPLETE');
      setIsProcessing(false);
      onComplete?.();
    }
  };

  const handleSkip = () => {
    const skipMsg = { role: 'user', content: '(skipped)' };
    handleAnswer('(skipped)');
  };

  if (stage === 'SAFETY_STOP') {
    return (
      <div className="glass-card rounded-lg border-2 border-red-500 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
          <div className="space-y-3">
            {messages.filter(m => m.role === 'assistant').slice(-1).map((msg, i) => (
              <p key={i} className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
            ))}
          </div>
        </div>
        <div className="pt-4 border-t border-red-200">
          <p className="text-xs text-muted-foreground">
            The coaching session has been paused for your safety. Please reach out for support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-lg border border-border p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Coaching Chat</h3>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
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
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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

      {stage === 'ASKING' && !isProcessing && (
        <div className="space-y-2 pt-4 border-t border-border">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (userInput.trim()) handleAnswer(userInput);
              }
            }}
            placeholder="Your response..."
            rows={2}
            className="resize-none"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => handleAnswer(userInput)}
              disabled={!userInput.trim()}
              className="flex-1 bg-primary text-primary-foreground"
            >
              Answer
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex-1"
            >
              Skip
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}