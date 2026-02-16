import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Loader2,
  Crown
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from "@/lib/utils";

export default function SettingsSubscription() {
  const [user, setUser] = useState(null);
  const [subscription, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const u = await api.auth.me();
        setUser(u);

        if (u.stripeSubscriptionId) {
          const subs = await api.entities.Subscription.filter({
            user_id: u.email
          });
          if (subs.length > 0) {
            setSub(subs[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleStartTrial = async () => {
    setActionLoading(true);
    try {
      const response = await api.functions.invoke('createCheckoutSession', {});
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Failed to start checkout:', error);
      setActionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setActionLoading(true);
    try {
      const response = await api.functions.invoke('createCustomerPortalSession', {});
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Failed to open portal:', error);
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const isPremium = user?.subscriptionStatus === 'TRIAL_ACTIVE' || user?.subscriptionStatus === 'ACTIVE';
  const isTrialing = user?.subscriptionStatus === 'TRIAL_ACTIVE';
  const isPastDue = user?.subscriptionStatus === 'PAST_DUE';
  const isCanceled = user?.subscriptionStatus === 'CANCELED';

  let trialDaysRemaining = 0;
  if (isTrialing && user?.trialEndsAt) {
    trialDaysRemaining = differenceInDays(new Date(user.trialEndsAt), new Date());
    if (trialDaysRemaining < 0) trialDaysRemaining = 0;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Subscription</h1>
        <p className="text-muted-foreground">Manage your TraderJNL Pro membership</p>
      </div>

      {/* Current Plan Card */}
      <div className={cn(
        "glass-card rounded-xl p-6 mb-6 border",
        isPremium ? "border-green-200 bg-gradient-to-br from-green-50/50 to-blue-50/30" : "border-border"
      )}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              isPremium ? "bg-green-100" : "bg-muted"
            )}>
              {isPremium ? (
                <Crown className="w-6 h-6 text-green-600" />
              ) : (
                <CreditCard className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {isPremium ? 'TraderJNL Pro' : 'No Active Plan'}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isTrialing && 'Trial Active'}
                {user?.subscriptionStatus === 'ACTIVE' && 'Active Subscription'}
                {user?.subscriptionStatus === 'NONE' && 'Free plan'}
                {isPastDue && 'Payment Issue'}
                {isCanceled && 'Subscription Canceled'}
              </p>
            </div>
          </div>

          {isPremium && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Active</span>
            </div>
          )}
        </div>

        {/* Status Details */}
        <div className="space-y-3">
          {isTrialing && (
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Trial Period</p>
                  <p className="text-xs text-muted-foreground">
                    {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} remaining
                  </p>
                </div>
              </div>
              {user?.trialEndsAt && (
                <p className="text-sm text-muted-foreground">
                  Ends {format(new Date(user.trialEndsAt), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          )}

          {user?.subscriptionStatus === 'ACTIVE' && subscription?.current_period_end && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Next Billing Date</p>
                <p className="text-xs text-muted-foreground">$29.00 USD</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}
              </p>
            </div>
          )}

          {isPastDue && (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">Payment Failed</p>
                <p className="text-xs text-red-700">Please update your payment method to restore access</p>
              </div>
            </div>
          )}

          {isCanceled && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-900">Subscription Canceled</p>
                <p className="text-xs text-amber-700">Your subscription has ended</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plan Features */}
      <div className="glass-card rounded-xl p-6 mb-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4">TraderJNL Pro Features</h3>
        <ul className="space-y-3">
          {[
            'Unlimited journal entries',
            'Advanced analytics & insights',
            'AI-powered insights & coaching',
            'Discord community access',
            'Session workspace & planning',
            'Account discipline tracking',
            'Market analysis tools'
          ].map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!isPremium && (
          <Button
            onClick={handleStartTrial}
            disabled={actionLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base"
          >
            {actionLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Start 7-day free trial
                <ExternalLink className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        )}

        {isPremium && (
          <Button
            onClick={handleManageSubscription}
            disabled={actionLoading}
            variant="outline"
            className="w-full h-12 text-base"
          >
            {actionLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Manage Subscription
                <ExternalLink className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        )}

        {(isPastDue || isCanceled) && (
          <Button
            onClick={handleStartTrial}
            disabled={actionLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base"
          >
            {actionLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Resume Subscription'
            )}
          </Button>
        )}
      </div>

      {/* Pricing Info */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground text-center">
          7-day free trial • Then $29/month • Cancel anytime
        </p>
      </div>
    </div>
  );
}