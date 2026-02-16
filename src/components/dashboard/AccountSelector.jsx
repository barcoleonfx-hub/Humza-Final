import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Settings, Loader2, Trash2, Edit2 } from 'lucide-react';
import AddAccountDialog from './AddAccountDialog';

export default function AccountSelector({ currentUser, selectedAccountId, onAccountChange }) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState('Prop Firm');
  const [newCurrency, setNewCurrency] = useState('USD');
  const [editingAccount, setEditingAccount] = useState(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['tradingAccounts', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return api.entities.TradingAccount.filter({ user_id: currentUser.email }, '-created_date');
    },
    enabled: !!currentUser?.email,
  });

  const createAccountMutation = useMutation({
    mutationFn: (data) => api.entities.TradingAccount.create(data),
    onSuccess: (newAccount) => {
      queryClient.invalidateQueries({ queryKey: ['tradingAccounts'] });
      setShowAddDialog(false);
      setNewAccountName('');
      setNewAccountType('Prop Firm');
      setNewCurrency('USD');
      onAccountChange(newAccount.id);
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.TradingAccount.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradingAccounts'] });
      setEditingAccount(null);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id) => api.entities.TradingAccount.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradingAccounts'] });
      const remaining = accounts.filter(a => a.id !== selectedAccountId);
      if (remaining.length > 0) {
        onAccountChange(remaining[0].id);
      }
    },
  });

  const handleCreateAccount = () => {
    if (!newAccountName.trim() || !newAccountType || !newCurrency) return;
    createAccountMutation.mutate({
      user_id: currentUser.email,
      account_name: newAccountName.trim(),
      account_type: newAccountType,
      currency_code: newCurrency,
      is_default: accounts.length === 0,
    });
  };

  const handleUpdateAccount = () => {
    if (!editingAccount) return;
    updateAccountMutation.mutate({
      id: editingAccount.id,
      data: {
        account_name: editingAccount.account_name,
        account_type: editingAccount.account_type,
        currency_code: editingAccount.currency_code,
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading accounts...</span>
      </div>
    );
  }

  const showSummary = accounts.length > 1;

  return (
    <>
      <div className="space-y-2">
        <Select value={selectedAccountId} onValueChange={onAccountChange}>
          <SelectTrigger className="w-full bg-card border-border h-9">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.account_name}
                {account.is_default && <span className="text-xs text-muted-foreground ml-2">(Default)</span>}
              </SelectItem>
            ))}
            {showSummary && (
              <SelectItem value="SUMMARY_ALL">
                Summary (All Accounts) - Read-only
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="border-border h-8 px-3 flex-1"
          >
            <span className="text-xs">Add Account</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManageDialog(true)}
            className="border-border h-8 px-3 gap-1.5 flex-1"
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs">Manage</span>
          </Button>
        </div>
      </div>

      {/* Add Account Dialog */}
      <AddAccountDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        currentUser={currentUser}
        onSuccess={(newAccount) => onAccountChange(newAccount.id)}
      />

      {/* Manage Accounts Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Accounts</DialogTitle>
            <DialogDescription>
              View and edit your trading accounts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-96 overflow-y-auto">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{account.account_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {account.account_type || 'Type not set'} • {account.currency_code || 'USD'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingAccount(account)}
                    className="text-primary hover:text-primary-foreground/80 hover:bg-primary/10"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {accounts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Delete "${account.account_name}"? This will remove all trades and data for this account.`)) {
                          deleteAccountMutation.mutate(account.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={() => setEditingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Update account details.
            </DialogDescription>
          </DialogHeader>
          {editingAccount && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Account Name *</Label>
                <Input
                  value={editingAccount.account_name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, account_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type *</Label>
                <Select
                  value={editingAccount.account_type || 'Prop Firm'}
                  onValueChange={(val) => setEditingAccount({ ...editingAccount, account_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prop Firm">Prop Firm</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency *</Label>
                <Select
                  value={editingAccount.currency_code || 'USD'}
                  onValueChange={(val) => setEditingAccount({ ...editingAccount, currency_code: val })}
                >
                  <SelectTrigger>
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAccount(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAccount}
              disabled={updateAccountMutation.isLoading}
              className="bg-primary text-primary-foreground"
            >
              {updateAccountMutation.isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}