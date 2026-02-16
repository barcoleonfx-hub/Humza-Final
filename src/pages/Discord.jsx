import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Shield, 
  Lock,
  CheckCircle2,
  Loader2,
  X
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Discord() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [discordUsername, setDiscordUsername] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.auth.me()
      .then(u => {
        setUser(u);
        setDiscordUsername(u.discordUsername || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const isPremium = user?.subscriptionStatus === 'TRIAL_ACTIVE' || user?.subscriptionStatus === 'ACTIVE';

  const handleSaveDiscordUsername = async () => {
    setSaving(true);
    try {
      await api.auth.updateMe({ discordUsername });
      setUser({ ...user, discordUsername });
      setShowConnectModal(false);
    } catch (error) {
      console.error('Failed to save Discord username:', error);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">TraderJNL Discord Community</h1>
            <p className="text-muted-foreground mt-1">A place for TraderJNL members to discuss, review, and level up together.</p>
          </div>
        </div>
      </div>

      {/* Access Status Card */}
      <div className={cn(
        "glass-card rounded-xl p-6 mb-6 border",
        isPremium ? "border-green-200 bg-green-50/50" : "border-border"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isPremium ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Included with Pro — free for premium members</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">Pro membership required</span>
              </>
            )}
          </div>
        </div>

        {isPremium ? (
          <div>
            {user?.discordUsername ? (
              <div className="bg-card rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Discord Username</p>
                    <p className="text-lg font-semibold text-foreground">{user.discordUsername}</p>
                  </div>
                  <Button 
                    onClick={() => setShowConnectModal(true)}
                    variant="outline"
                    size="sm"
                  >
                    Update
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  We will grant access to member channels shortly.
                </p>
              </div>
            ) : (
              <div>
                <Button 
                  onClick={() => setShowConnectModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Get Discord Access
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Connect your Discord to unlock member channels.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-muted-foreground mb-4">
              Discord access is included for premium members only. Start your 7-day free trial to join the community.
            </p>
            <Link to={createPageUrl('SettingsSubscription')}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Start 7-day free trial
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">What's Included</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-5 border border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Live Trading Sessions</h3>
                <p className="text-sm text-muted-foreground">Educational walkthroughs of trade setups and market analysis</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 border border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Daily Reviews & Recaps</h3>
                <p className="text-sm text-muted-foreground">Review sessions and learn from wins and losses together</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 border border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">General Chat Hub</h3>
                <p className="text-sm text-muted-foreground">Connect with other TraderJNL users and share experiences</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 border border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Accountability & Discipline</h3>
                <p className="text-sm text-muted-foreground">Build discipline with community support and shared goals</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="glass-card rounded-xl p-4 border border-amber-200 bg-amber-50/50">
        <p className="text-xs text-muted-foreground">
          <strong>Disclaimer:</strong> No financial advice. No guaranteed profits. Educational discussion only. 
          All trading involves risk.
        </p>
      </div>

      {/* Connect Modal */}
      <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Discord</DialogTitle>
            <DialogDescription>
              Discord access setup is being finalized. Provide your Discord username below and we'll grant access shortly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Discord Username
              </label>
              <Input
                placeholder="username#1234"
                value={discordUsername}
                onChange={(e) => setDiscordUsername(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your Discord username (e.g., username#1234)
              </p>
            </div>
            <Button
              onClick={handleSaveDiscordUsername}
              disabled={!discordUsername || saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Discord Username'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}