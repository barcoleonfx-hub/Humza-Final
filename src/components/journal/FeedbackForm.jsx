import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { api } from '@/api/apiClient';

export default function FeedbackForm({ feedbackType, contextData, onComplete }) {
  const [helpful, setHelpful] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    try {
      await api.entities.UserFeedback.create({
        user_id: contextData.userId,
        feedback_type: feedbackType,
        was_helpful: helpful,
        what_was_missing: feedback,
        context_json: contextData
      });
      setSubmitted(true);
      setTimeout(() => onComplete?.(), 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
        <p className="text-sm text-green-900">Thank you for your feedback</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-muted/50 border border-border rounded-lg space-y-3">
      <p className="text-sm text-foreground font-medium">Was this helpful?</p>
      
      <div className="flex gap-2">
        <Button
          variant={helpful === true ? "default" : "outline"}
          size="sm"
          onClick={() => setHelpful(true)}
          className={helpful === true ? "bg-green-500 hover:bg-green-600 text-white" : ""}
        >
          <ThumbsUp className="w-4 h-4 mr-2" />
          Yes
        </Button>
        <Button
          variant={helpful === false ? "default" : "outline"}
          size="sm"
          onClick={() => setHelpful(false)}
          className={helpful === false ? "bg-red-500 hover:bg-red-600 text-white" : ""}
        >
          <ThumbsDown className="w-4 h-4 mr-2" />
          No
        </Button>
      </div>

      {helpful === false && (
        <div className="space-y-2">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What was missing or could be improved?"
            className="resize-none"
            rows={3}
          />
          <Button
            onClick={handleSubmit}
            disabled={!feedback.trim()}
            size="sm"
            className="w-full bg-primary text-primary-foreground"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Feedback
          </Button>
        </div>
      )}

      {helpful === true && (
        <Button
          onClick={handleSubmit}
          size="sm"
          className="w-full bg-green-500 hover:bg-green-600 text-white"
        >
          Submit
        </Button>
      )}
    </div>
  );
}