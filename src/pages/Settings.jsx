import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  CreditCard, 
  Download, 
  Image as ImageIcon, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteAnalysis, setDeleteAnalysis] = useState(null);
  const [profileData, setProfileData] = useState({
    full_name: '',
    trading_account: '',
    preferred_asset: ''
  });

  useEffect(() => {
    api.auth.me().then(u => {
      setUser(u);
      setProfileData({
        full_name: u.full_name || '',
        trading_account: u.trading_account || '',
        preferred_asset: u.preferred_asset || ''
      });
      setLoading(false);
    });
  }, []);

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: () => api.entities.Trade.list('-date'),
  });

  const { data: pnlAnalyses = [], refetch: refetchPnL } = useQuery({
    queryKey: ['pnlAnalyses'],
    queryFn: () => api.entities.PnLAnalysis.list('-created_date'),
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    await api.auth.updateMe(profileData);
    toast.success('Profile updated');
    setSaving(false);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    
    const headers = ['Date', 'Time', 'Symbol', 'Asset Class', 'Direction', 'Strategy', 'Risk %', 'Result R', 'P&L', 'Notes'];
    const rows = trades.map(t => [
      t.date,
      t.time || '',
      t.symbol,
      t.asset_class,
      t.direction,
      t.strategy || '',
      t.risk_percent || '',
      t.result_r,
      t.pnl_amount || '',
      t.notes?.replace(/"/g, '""') || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading_journal_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Journal exported');
    setExporting(false);
  };

  const handleDeleteAnalysis = async () => {
    if (deleteAnalysis) {
      await api.entities.PnLAnalysis.delete(deleteAnalysis.id);
      setDeleteAnalysis(null);
      refetchPnL();
      toast.success('Analysis deleted');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <User className="w-5 h-5 text-green-400" />
          </div>
          <h2 className="font-semibold text-lg">Profile</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={profileData.full_name}
              onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
              className="bg-card/5 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-card/5 border-white/10 opacity-50"
            />
          </div>
          <div className="space-y-2">
            <Label>Trading Account</Label>
            <Input
              value={profileData.trading_account}
              onChange={(e) => setProfileData(prev => ({ ...prev, trading_account: e.target.value }))}
              placeholder="Account ID or name"
              className="bg-card/5 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label>Preferred Asset Class</Label>
            <Input
              value={profileData.preferred_asset}
              onChange={(e) => setProfileData(prev => ({ ...prev, preferred_asset: e.target.value }))}
              placeholder="Futures, Forex, etc."
              className="bg-card/5 border-white/10"
            />
          </div>
        </div>

        <Button
          onClick={handleSaveProfile}
          disabled={saving}
          className="bg-green-500 hover:bg-green-600 text-black font-semibold"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save Changes
        </Button>
      </div>

      {/* Subscription Section */}
      <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <CreditCard className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="font-semibold text-lg">Subscription</h2>
        </div>

        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <div>
            <p className="font-medium text-green-400">Free Trial Active</p>
            <p className="text-sm text-gray-400">Full access to all features</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card/5 border border-white/10">
          <p className="text-sm text-gray-400 mb-4">
            Upgrade to Pro for unlimited AI analyses and premium features.
          </p>
          <Button variant="outline" className="border-white/10 hover:bg-card/5" disabled>
            <ExternalLink className="w-4 h-4 mr-2" />
            Upgrade to Pro (Coming Soon)
          </Button>
        </div>
      </div>

      {/* Export Section */}
      <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-blue-500/20">
            <Download className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="font-semibold text-lg">Export Data</h2>
        </div>

        <p className="text-sm text-gray-400">
          Download your trading journal as a CSV file for backup or analysis in other tools.
        </p>

        <Button
          onClick={handleExportCSV}
          disabled={exporting || trades.length === 0}
          variant="outline"
          className="border-white/10 hover:bg-card/5"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export Journal ({trades.length} trades)
        </Button>
      </div>

      {/* Uploaded Images Section */}
      <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
            <ImageIcon className="w-5 h-5 text-orange-400" />
          </div>
          <h2 className="font-semibold text-lg">P&L Analyses</h2>
        </div>

        {pnlAnalyses.length === 0 ? (
          <p className="text-sm text-gray-500">No P&L analyses yet</p>
        ) : (
          <div className="space-y-3">
            {pnlAnalyses.map(analysis => (
              <div 
                key={analysis.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-card/5 border border-white/10"
              >
                {analysis.screenshot_url && (
                  <img 
                    src={analysis.screenshot_url} 
                    alt="P&L Screenshot"
                    className="w-16 h-12 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {analysis.ai_summary?.slice(0, 50)}...
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(analysis.created_date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-red-400"
                  onClick={() => setDeleteAnalysis(analysis)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAnalysis} onOpenChange={() => setDeleteAnalysis(null)}>
        <AlertDialogContent className="bg-[#0f0f17] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this P&L analysis? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-card/5 border-white/10 hover:bg-card/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAnalysis}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}