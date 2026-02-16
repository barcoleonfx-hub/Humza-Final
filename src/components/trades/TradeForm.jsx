import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, X, Loader2 } from 'lucide-react';

const ASSET_CLASSES = ['Forex', 'Futures', 'Crypto', 'Indices', 'Stocks', 'Options'];
const DIRECTIONS = ['Buy', 'Sell'];

export default function TradeForm({ open, onClose, onSuccess, editTrade = null }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState(editTrade || {
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    symbol: '',
    asset_class: 'Futures',
    direction: 'Buy',
    strategy: '',
    risk_percent: '',
    result_r: '',
    pnl_amount: '',
    notes: '',
    chart_screenshot: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const { file_url } = await api.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, chart_screenshot: file_url }));
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const data = {
      ...formData,
      risk_percent: formData.risk_percent ? parseFloat(formData.risk_percent) : null,
      result_r: parseFloat(formData.result_r),
      pnl_amount: formData.pnl_amount ? parseFloat(formData.pnl_amount) : null,
    };

    if (editTrade) {
      await api.entities.Trade.update(editTrade.id, data);
    } else {
      await api.entities.Trade.create(data);
    }
    
    setLoading(false);
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f0f17] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editTrade ? 'Edit Trade' : 'Add New Trade'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="bg-card/5 border-white/10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
                className="bg-card/5 border-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Symbol</Label>
              <Input
                value={formData.symbol}
                onChange={(e) => handleChange('symbol', e.target.value.toUpperCase())}
                placeholder="ES, NQ, EUR/USD..."
                className="bg-card/5 border-white/10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Asset Class</Label>
              <Select value={formData.asset_class} onValueChange={(v) => handleChange('asset_class', v)}>
                <SelectTrigger className="bg-card/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a24] border-white/10">
                  {ASSET_CLASSES.map(ac => (
                    <SelectItem key={ac} value={ac}>{ac}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select value={formData.direction} onValueChange={(v) => handleChange('direction', v)}>
                <SelectTrigger className="bg-card/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a24] border-white/10">
                  {DIRECTIONS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Strategy</Label>
              <Input
                value={formData.strategy}
                onChange={(e) => handleChange('strategy', e.target.value)}
                placeholder="Breakout, Reversal..."
                className="bg-card/5 border-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Risk %</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.risk_percent}
                onChange={(e) => handleChange('risk_percent', e.target.value)}
                placeholder="1.0"
                className="bg-card/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Result (R)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.result_r}
                onChange={(e) => handleChange('result_r', e.target.value)}
                placeholder="2.0"
                className="bg-card/5 border-white/10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>P&L ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.pnl_amount}
                onChange={(e) => handleChange('pnl_amount', e.target.value)}
                placeholder="500"
                className="bg-card/5 border-white/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Trade setup, emotions, lessons learned..."
              className="bg-card/5 border-white/10 min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Chart Screenshot</Label>
            {formData.chart_screenshot ? (
              <div className="relative rounded-lg overflow-hidden">
                <img 
                  src={formData.chart_screenshot} 
                  alt="Chart" 
                  className="w-full h-32 object-cover"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                  onClick={() => handleChange('chart_screenshot', '')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-white/10 hover:border-white/20 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-400">Upload chart image</span>
                  </>
                )}
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-white/10 hover:bg-card/5"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-black font-semibold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editTrade ? 'Update' : 'Add Trade')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}