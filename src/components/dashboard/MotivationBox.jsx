import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, BookOpen, Brain } from 'lucide-react';
import { format, subDays } from 'date-fns';

const AFFIRMATIONS = [
  "Discipline beats emotion every time. Stick to your plan.",
  "Trading success is built on consistency, not home runs.",
  "Protect your capital. It's your most valuable asset.",
  "Trust the process. Every pro trader started where you are.",
  "Risk management is your edge. Never compromise it.",
  "Patience is profit. Wait for your setup.",
  "Your trading rules exist for a reason. Honor them.",
  "Small consistent wins compound into life-changing results.",
  "The market rewards discipline and punishes impulsivity.",
  "Your mental game determines your bottom line.",
  "Think like a sniper, not a machine gunner.",
  "Every trade is independent. Don't let the last one affect this one.",
  "Losses are feedback, not failures. Learn and adapt.",
  "Your edge isn't in predicting, it's in managing risk.",
  "Stay humble. The market can humble anyone at any time.",
];

export default function MotivationBox() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    api.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: yesterdayEntry } = useQuery({
    queryKey: ['yesterdayJournal', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      const entries = await api.entities.JournalEntry.filter(
        { created_by: currentUser.email, entry_date: yesterday },
        '-created_date',
        1
      );
      return entries[0] || null;
    },
    enabled: !!currentUser?.email,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getDailyAffirmation = () => {
    const dayOfYear = Math.floor(
      (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
    );
    return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];
  };

  if (!currentUser) return null;

  return (
    <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-green-400" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-xl font-bold">
              {getGreeting()}, {currentUser.full_name || 'Trader'}!
            </h3>
            <p className="text-sm text-green-400 font-medium mt-1">
              {getDailyAffirmation()}
            </p>
          </div>

          {yesterdayEntry && (
            <div className="bg-card/5 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-medium text-gray-400">Yesterday's Reflection</p>
              </div>
              <p className="text-sm text-gray-300 mb-2">
                {yesterdayEntry.psychology_snapshot}
              </p>
              {yesterdayEntry.ai_advice && (
                <div className="flex items-start gap-2 mt-3 pt-3 border-t border-white/5">
                  <Brain className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-400 italic">
                    "{yesterdayEntry.ai_advice.substring(0, 150)}
                    {yesterdayEntry.ai_advice.length > 150 ? '...' : ''}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}