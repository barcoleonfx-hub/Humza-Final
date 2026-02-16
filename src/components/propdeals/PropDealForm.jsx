import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, X, Plus } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const MARKET_TYPES = ['Forex', 'Futures', 'Crypto', 'All Markets'];

export default function PropDealForm({ open, onClose, onSuccess, editDeal = null }) {
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState(editDeal || {
    firm_name: '',
    market_type: 'Futures',
    offer_title: '',
    discount_percent: '',
    coupon_code: '',
    external_link: '',
    start_date: '',
    end_date: '',
    tags: [],
    is_active: true
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const data = {
      ...formData,
      discount_percent: parseFloat(formData.discount_percent) || 0,
    };

    if (editDeal) {
      await api.entities.PropFirmDeal.update(editDeal.id, data);
    } else {
      await api.entities.PropFirmDeal.create(data);
    }
    
    setLoading(false);
    onSuccess();
    onClose();
  };

  const handleDelete = async () => {
    if (editDeal) {
      setLoading(true);
      await api.entities.PropFirmDeal.delete(editDeal.id);
      setLoading(false);
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f0f17] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editDeal ? 'Edit Deal' : 'Add New Deal'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prop Firm Name</Label>
              <Input
                value={formData.firm_name}
                onChange={(e) => handleChange('firm_name', e.target.value)}
                placeholder="FTMO, Topstep..."
                className="bg-card/5 border-white/10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Market Type</Label>
              <Select value={formData.market_type} onValueChange={(v) => handleChange('market_type', v)}>
                <SelectTrigger className="bg-card/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a24] border-white/10">
                  {MARKET_TYPES.map(mt => (
                    <SelectItem key={mt} value={mt}>{mt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Offer Title</Label>
            <Input
              value={formData.offer_title}
              onChange={(e) => handleChange('offer_title', e.target.value)}
              placeholder="Summer Sale - 25% off all challenges"
              className="bg-card/5 border-white/10"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discount %</Label>
              <Input
                type="number"
                value={formData.discount_percent}
                onChange={(e) => handleChange('discount_percent', e.target.value)}
                placeholder="25"
                className="bg-card/5 border-white/10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Coupon Code</Label>
              <Input
                value={formData.coupon_code}
                onChange={(e) => handleChange('coupon_code', e.target.value.toUpperCase())}
                placeholder="SUMMER25"
                className="bg-card/5 border-white/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>External Link</Label>
            <Input
              type="url"
              value={formData.external_link}
              onChange={(e) => handleChange('external_link', e.target.value)}
              placeholder="https://..."
              className="bg-card/5 border-white/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className="bg-card/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className="bg-card/5 border-white/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                className="bg-card/5 border-white/10"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag} className="border-white/10">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-card/5 border-white/10">
                    {tag}
                    <button 
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-card/5 border border-white/10">
            <div>
              <p className="font-medium">Active</p>
              <p className="text-sm text-gray-500">Show this deal to users</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(v) => handleChange('is_active', v)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            {editDeal && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={loading}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Delete
              </Button>
            )}
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editDeal ? 'Update' : 'Add Deal')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}