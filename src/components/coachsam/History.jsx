import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export default function History({ currentUser, selectedAccountId }) {
  const [selectedSession, setSelectedSession] = useState(null);

  const { data: sessions = [] } = useQuery({
    queryKey: ['coachSamSessions', currentUser?.email, selectedAccountId],
    queryFn: () => api.entities.CoachSamSessions.filter({
      user_id: currentUser.email,
      account_id: selectedAccountId
    }, '-created_date', 50),
    enabled: !!currentUser?.email && !!selectedAccountId
  });

  if (selectedSession) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => setSelectedSession(null)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to History
        </Button>

        <div className="glass-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {selectedSession.mode === 'PSYCHOLOGY' ? 'Psychology' : 'Finance'} Session
              </h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(selectedSession.created_date), 'PPP p')}
              </p>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              selectedSession.mode === 'PSYCHOLOGY'
                ? "bg-blue-100 text-primary-foreground/80"
                : "bg-green-100 text-green-700"
            )}>
              {selectedSession.reason_category}
            </div>
          </div>

          {selectedSession.linked_journal_entry_id && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Linked to journal entry</p>
              <p className="text-sm font-medium text-foreground">
                {selectedSession.linked_journal_entry_id}
              </p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Summary</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {selectedSession.summary_text}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Next 7-Day Plan</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {selectedSession.next_7day_plan_text}
              </p>
            </div>

            {selectedSession.do_not_do_rule_text && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-semibold text-red-900 mb-2">Do Not Do</h4>
                <p className="text-sm text-red-800">
                  {selectedSession.do_not_do_rule_text}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Full Transcript</h4>
              <div className="space-y-3">
                {selectedSession.transcript_json?.map((msg, idx) => (
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
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Session History</h2>
        <p className="text-muted-foreground">All your Coach Sam sessions</p>
      </div>

      {sessions.length === 0 ? (
        <div className="glass-card rounded-2xl border border-border p-12 text-center">
          <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No sessions yet</h3>
          <p className="text-muted-foreground">Start a session with Coach Sam to see it here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className="glass-card rounded-xl border border-border p-4 cursor-pointer hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {session.mode === 'PSYCHOLOGY' ? (
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                    ) : (
                      <DollarSign className="w-4 h-4 text-green-500" />
                    )}
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded",
                      session.mode === 'PSYCHOLOGY'
                        ? "bg-blue-100 text-primary-foreground/80"
                        : "bg-green-100 text-green-700"
                    )}>
                      {session.mode === 'PSYCHOLOGY' ? 'Psychology' : 'Finance'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(session.created_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {session.reason_category}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {session.summary_text?.split('\n')[0] || 'No summary'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}