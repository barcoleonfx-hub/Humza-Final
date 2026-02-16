import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AFFIRMATIONS = [
  "Discipline creates consistency, consistency creates results.",
  "Every trade is a learning opportunity.",
  "Trust your process, not your emotions.",
  "Patience is the trader's greatest asset.",
  "You are building long-term success, one trade at a time.",
  "Focus on execution, not outcomes.",
  "Your trading plan is your guide through uncertainty.",
  "Small, consistent wins compound into greatness.",
];

export default function LoadingAffirmation({ message = "Processing your data..." }) {
  const [currentAffirmation, setCurrentAffirmation] = useState('');
  
  useEffect(() => {
    const randomAffirmation = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    setCurrentAffirmation(randomAffirmation);
    
    // Change affirmation every 4 seconds
    const interval = setInterval(() => {
      const newAffirmation = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
      setCurrentAffirmation(newAffirmation);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 to-blue-900/95 z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 border border-blue-400/30">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-2">{message}</h3>
          <p className="text-sm text-slate-300">This may take a moment...</p>
        </motion.div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAffirmation}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="bg-card/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-300" />
              <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide">
                Trading Wisdom
              </p>
            </div>
            <p className="text-white text-base leading-relaxed italic">
              "{currentAffirmation}"
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}