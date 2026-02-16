import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function JournalRecapDisplay({ journalEntryId, userId, accountId }) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const { data: recap, isLoading, error, refetch } = useQuery({
    queryKey: ['journalRecap', journalEntryId],
    queryFn: async () => {
      const recaps = await api.entities.JournalRecaps.filter({
        journal_entry_id: journalEntryId,
        user_id: userId,
        account_id: accountId
      }, '-created_date', 1);
      
      return recaps && recaps.length > 0 ? recaps[0] : null;
    },
    enabled: !!journalEntryId && !!userId && !!accountId,
    refetchInterval: 2000
  });

  useEffect(() => {
    if (recap?.recap_status === 'COMPLETE' || recap?.recap_status === 'ERROR') {
      return;
    }
  }, [recap?.recap_status]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await api.functions.invoke('generateJournalRecap', {
        journal_entry_id: journalEntryId,
        account_id: accountId
      });
      await refetch();
    } catch (error) {
      console.error('Failed to regenerate recap:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <p className="text-sm">Loading recap...</p>
        </div>
      </div>
    );
  }

  if (!recap) {
    return null;
  }

  if (recap.recap_status === 'PENDING') {
    return (
      <div className="glass-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <p className="text-sm">Generating your journal recap...</p>
        </div>
      </div>
    );
  }

  if (recap.recap_status === 'ERROR') {
    return (
      <div className="glass-card rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Couldn't generate recap</p>
            {recap.error_message && (
              <p className="text-xs text-red-700 mt-1">{recap.error_message}</p>
            )}
            <Button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              size="sm"
              variant="outline"
              className="mt-3 border-red-200 text-red-600 hover:bg-red-100"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recap Cards Grid */}
      {recap.recap_cards_json && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(recap.recap_cards_json).map(([key, card]) => (
            <div
              key={key}
              className={cn(
                "glass-card rounded-lg border p-4 text-center",
                card.color === 'green' && "border-green-200 bg-green-50",
                card.color === 'red' && "border-red-200 bg-red-50",
                card.color === 'yellow' && "border-yellow-200 bg-yellow-50",
                card.color === 'blue' && "border-blue-200 bg-primary/10"
              )}
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{card.label}</p>
              <p className={cn(
                "text-lg font-bold",
                card.color === 'green' && "text-green-700",
                card.color === 'red' && "text-red-700",
                card.color === 'yellow' && "text-yellow-700",
                card.color === 'blue' && "text-primary-foreground/80"
              )}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Recap Narrative */}
      {recap.recap_text && (
        <div className="glass-card rounded-lg border border-border p-6">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {recap.recap_text}
          </p>
        </div>
      )}

      {/* Regenerate Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          size="sm"
          variant="outline"
          className="border-border"
        >
          {isRegenerating ? (
            <>
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              Regenerating...
            </>
          ) : (
            <>
              <RefreshCw className="w-3 h-3 mr-2" />
              Regenerate Recap
            </>
          )}
        </Button>
      </div>
    </div>
  );
}