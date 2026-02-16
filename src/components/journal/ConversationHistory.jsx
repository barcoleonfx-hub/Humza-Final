import React from 'react';
import { cn } from "@/lib/utils";
import { MessageCircle, Brain } from 'lucide-react';
import { format } from 'date-fns';

export default function ConversationHistory({ coachingChat, psychologistChat }) {
  if (!coachingChat && !psychologistChat) {
    return (
      <div className="glass-card rounded-lg border border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">No conversation saved for this day yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {coachingChat && coachingChat.messages_json && coachingChat.messages_json.length > 0 && (
        <div className="glass-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            Coaching Chat History
          </h3>
          <div className="space-y-3">
            {coachingChat.messages_json.map((msg, idx) => (
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
                      : "bg-muted text-foreground shadow-sm"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: msg.role === 'user' ? 'white' : 'hsl(222, 47%, 11%)' }}>{msg.content}</p>
                  {msg.timestamp && (
                    <p className="text-xs opacity-60 mt-1">
                      {format(new Date(msg.timestamp), 'h:mm a')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {coachingChat.summary && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-blue-200">
              <p className="text-sm text-primary-foreground">{coachingChat.summary}</p>
            </div>
          )}
        </div>
      )}

      {psychologistChat && psychologistChat.messages_json && psychologistChat.messages_json.length > 0 && (
        <div className="glass-card rounded-lg border border-border p-6">
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-900">
              This is not a licensed therapist. Performance psychology support for traders.
            </p>
            <p className="text-xs text-yellow-800 mt-1">
              Guidance framework created with a trader with 10+ years' experience.
            </p>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Coach Sam Session
          </h3>
          <div className="space-y-3">
            {psychologistChat.messages_json.map((msg, idx) => (
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
                      ? "bg-purple-500 text-white"
                      : "bg-muted text-foreground shadow-sm"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: msg.role === 'user' ? 'white' : 'hsl(222, 47%, 11%)' }}>{msg.content}</p>
                  {msg.timestamp && (
                    <p className="text-xs opacity-60 mt-1">
                      {format(new Date(msg.timestamp), 'h:mm a')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {psychologistChat.session_summary && (
            <div className="mt-4 space-y-3">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs font-medium text-purple-900 mb-1">Session Summary</p>
                <p className="text-sm text-purple-800">{psychologistChat.session_summary}</p>
              </div>
              {psychologistChat.coping_plan && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs font-medium text-green-900 mb-1">Coping Plan for Tomorrow</p>
                  <p className="text-sm text-green-800">{psychologistChat.coping_plan}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}