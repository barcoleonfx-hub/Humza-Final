import React from 'react';
import { Button } from "@/components/ui/button";
import { Crown, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { cn } from "@/lib/utils";

export default function UpgradeBanner({ onDismiss, className }) {
  return (
    <div className={cn(
      "glass-card border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-6",
      className
    )}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Your trial has ended</h3>
            <p className="text-xs text-muted-foreground">Subscribe to continue using premium features</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={createPageUrl('SettingsSubscription')}>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              Subscribe Now
            </Button>
          </Link>
          {onDismiss && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={onDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}