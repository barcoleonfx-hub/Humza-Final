import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FirstAccountOnboarding({ onAccountCreated }) {
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('Prop Firm');
  const [currency, setCurrency] = useState('USD');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!accountName.trim() || !accountType || !currency) return;

    setCreating(true);
    try {
      const user = await api.auth.me();
      const newAccount = await api.entities.TradingAccount.create({
        user_id: user.email,
        account_name: accountName.trim(),
        account_type: accountType,
        currency_code: currency,
        is_default: true,
      });

      localStorage.setItem('selectedAccountId', newAccount.id);
      onAccountCreated(newAccount);
    } catch (error) {
      console.error('Failed to create account:', error);
      alert('Failed to create account. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 premium-bg z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl p-8 max-w-md w-full border border-border shadow-xl"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Create your first trading profile
          </h2>
          <p className="text-muted-foreground">
            Set up your trading account to get started
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Topstep XFA, Personal Live"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="bg-card"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Account Type *</Label>
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger id="type" className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Prop Firm">Prop Firm</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency *</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency" className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
                <SelectItem value="AUD">AUD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCreate}
            disabled={!accountName.trim() || !accountType || !currency || creating}
            className="w-full bg-primary text-primary-foreground font-semibold h-12 mt-6"
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Profile'
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}