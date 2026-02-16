import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const questions = [
  {
    id: 'journaling_experience',
    question: 'How long have you been actively journaling your trades?',
    options: [
      { value: 'never', label: 'Never' },
      { value: 'occasionally', label: 'Occasionally' },
      { value: 'consistently', label: 'Consistently' },
      { value: 'professionally', label: 'Professionally' }
    ]
  },
  {
    id: 'struggle',
    question: 'What do you mainly struggle with in trading?',
    options: [
      { value: 'emotional_control', label: 'Emotional control' },
      { value: 'consistency', label: 'Consistency' },
      { value: 'risk_management', label: 'Risk management' },
      { value: 'overtrading', label: 'Overtrading' }
    ]
  },
  {
    id: 'markets',
    question: 'What markets do you primarily trade?',
    options: [
      { value: 'futures', label: 'Futures' },
      { value: 'forex', label: 'Forex' },
      { value: 'both', label: 'Both' },
      { value: 'other', label: 'Other' }
    ]
  },
  {
    id: 'goal',
    question: 'What do you want this journal to help you improve most?',
    options: [
      { value: 'discipline', label: 'Discipline' },
      { value: 'performance_tracking', label: 'Performance tracking' },
      { value: 'psychology', label: 'Psychology' },
      { value: 'long_term_consistency', label: 'Long-term consistency' }
    ]
  }
];

export default function OnboardingFlow({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  const handleSelectOption = (value) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    if (isLastStep) {
      setTimeout(() => {
        onComplete(newAnswers);
      }, 300);
    } else {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 300);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 md:p-12"
          >
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-400">
                  Question {currentStep + 1} of {questions.length}
                </span>
                <div className="flex gap-1">
                  {questions.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 w-8 rounded-full transition-colors",
                        i <= currentStep ? "bg-primary" : "bg-slate-700"
                      )}
                    />
                  ))}
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-50 leading-tight">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelectOption(option.value)}
                  className={cn(
                    "w-full text-left p-5 rounded-xl border-2 transition-all",
                    "hover:border-blue-500 hover:bg-slate-800/50",
                    answers[currentQuestion.id] === option.value
                      ? "border-blue-500 bg-slate-800/50"
                      : "border-slate-800 bg-slate-900/30"
                  )}
                >
                  <span className="text-lg text-slate-200">{option.label}</span>
                </button>
              ))}
            </div>

            {currentStep > 0 && (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-slate-400 hover:text-slate-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}