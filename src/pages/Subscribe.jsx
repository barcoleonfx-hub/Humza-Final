import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, TrendingUp, Shield, Clock, Zap } from 'lucide-react';
import { createPageUrl } from '../utils';
import { Link } from 'react-router-dom';

export default function Subscribe() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    api.auth.me().then(async (currentUser) => {
      setUser(currentUser);
      
      // Check if user already has subscription
      if (currentUser?.email) {
        const subs = await api.entities.Subscription.filter({
          user_id: currentUser.email
        });
        if (subs.length > 0) {
          setSubscription(subs[0]);
        }
      }
    }).catch(() => {});
  }, []);

  const handleStartTrial = async () => {
    if (!user) {
      // Redirect to login
      api.auth.redirectToLogin(window.location.pathname);
      return;
    }

    setLoading(true);
    try {
      const response = await api.functions.invoke('createCheckoutSession', {});
      
      if (response.data.url) {
        window.location.href = response.data.url;
      } else if (response.data.error) {
        // Display the actual error from the server
        const errorMessage = response.data.error;
        const errorCode = response.data.errorCode || response.data.code || 'UNKNOWN';
        console.error('Checkout error:', { errorMessage, errorCode, fullResponse: response.data });
        alert(`Couldn't start checkout.\n\nReason: ${errorMessage}\n\nError code: ${errorCode}\n\nPlease contact support if this persists.`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      
      // Try to extract error message from response
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      const errorCode = error.response?.data?.errorCode || error.response?.data?.code || 'REQUEST_FAILED';
      
      console.error('Full error details:', { errorMessage, errorCode, error });
      alert(`Couldn't start checkout.\n\nReason: ${errorMessage}\n\nError code: ${errorCode}\n\nPlease try again or contact support.`);
      setLoading(false);
    }
  };

  if (subscription && subscription.status !== 'canceled') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
          <p className="text-muted-foreground mb-6">
            {subscription.status === 'trialing' 
              ? `Your 7-day free trial is active until ${new Date(subscription.trial_end_date).toLocaleDateString()}`
              : 'Your subscription is active'}
          </p>
          <Link to={createPageUrl('Home')}>
            <Button className="w-full bg-primary text-primary-foreground">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Landing')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">TraderJNL</span>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Value Proposition */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Start Your 7-Day Free Trial
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Track your trades, master your discipline, and improve your trading psychology — all with AI-powered insights.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">7 Days Free</h3>
                  <p className="text-sm text-muted-foreground">Full access to all features, no credit card required upfront</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">AI-Powered Insights</h3>
                  <p className="text-sm text-muted-foreground">Get personalized coaching and psychology analysis for every trade</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Cancel Anytime</h3>
                  <p className="text-sm text-muted-foreground">No commitment, cancel before the trial ends if it's not for you</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Setup in Minutes</h3>
                  <p className="text-sm text-muted-foreground">Start journaling your trades immediately after signup</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Signup Card */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Get Started</h2>
              <p className="text-muted-foreground">
                {user ? 'Complete your subscription' : 'Sign in to start your free trial'}
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-muted/50 rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Monthly Plan</h3>
                    <p className="text-sm text-muted-foreground">Billed monthly after trial</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-foreground">$29</div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Unlimited journal entries
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    AI trading coach & psychologist
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Advanced analytics & insights
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Multi-account tracking
                  </div>
                </div>

                <Button
                  onClick={handleStartTrial}
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground h-12 text-lg font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      {user ? 'Start 7-Day Free Trial' : 'Sign In to Start Free Trial'}
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                By starting your trial, you agree to provide payment information. You won't be charged until your 7-day trial ends. Cancel anytime before then at no cost.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}