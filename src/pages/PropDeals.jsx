import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter,
  ExternalLink,
  Copy,
  Check,
  Percent,
  Plus,
  Settings,
  Tag
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { cn } from "@/lib/utils";
import PropDealForm from '@/components/propdeals/PropDealForm';
import { toast } from "sonner";

const MARKET_TYPES = ['All', 'Forex', 'Futures', 'Crypto', 'All Markets'];

export default function PropDeals() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Percent className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Prop Deals Coming Soon</h1>
        <p className="text-muted-foreground leading-relaxed">
          Track and analyze performance across proprietary trading accounts. Advanced prop-firm analytics launching soon.
        </p>
      </div>
    </div>
  );
}

function PropDealsOriginal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [marketFilter, setMarketFilter] = useState('All');
  const [sortBy, setSortBy] = useState('discount');
  const [copiedCode, setCopiedCode] = useState(null);
  const [showDealForm, setShowDealForm] = useState(false);
  const [editDeal, setEditDeal] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: deals = [], refetch } = useQuery({
    queryKey: ['propDeals'],
    queryFn: () => api.entities.PropFirmDeal.list('-updated_date'),
  });

  const isAdmin = user?.role === 'admin';

  const filteredDeals = deals
    .filter(d => {
      const matchesSearch = d.firm_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           d.offer_title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMarket = marketFilter === 'All' || d.market_type === marketFilter;
      const isActive = d.is_active !== false;
      const notExpired = !d.end_date || isAfter(parseISO(d.end_date), new Date());
      return matchesSearch && matchesMarket && isActive && notExpired;
    })
    .sort((a, b) => {
      if (sortBy === 'discount') return (b.discount_percent || 0) - (a.discount_percent || 0);
      if (sortBy === 'updated') return new Date(b.updated_date) - new Date(a.updated_date);
      return 0;
    });

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Coupon code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prop Firm Deals</h1>
          <p className="text-gray-500 mt-1">Exclusive discounts on prop firm challenges</p>
        </div>
        {isAdmin && (
          <Button 
            onClick={() => setShowDealForm(true)}
            className="bg-green-500 hover:bg-green-600 text-black font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Deal
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search firms or offers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/5 border-white/10"
          />
        </div>
        <Select value={marketFilter} onValueChange={setMarketFilter}>
          <SelectTrigger className="w-full md:w-40 bg-card/5 border-white/10">
            <Filter className="w-4 h-4 mr-2 text-gray-500" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a24] border-white/10">
            {MARKET_TYPES.map(mt => (
              <SelectItem key={mt} value={mt}>{mt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-40 bg-card/5 border-white/10">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a24] border-white/10">
            <SelectItem value="discount">Highest Discount</SelectItem>
            <SelectItem value="updated">Recently Updated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDeals.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            {deals.length === 0 ? 'No deals available yet' : 'No deals match your filters'}
          </div>
        ) : (
          filteredDeals.map(deal => (
            <div 
              key={deal.id}
              className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">{deal.firm_name}</h3>
                  <p className="text-sm text-gray-500">{deal.market_type}</p>
                </div>
                <div className="flex items-center gap-1 bg-green-500/10 text-green-400 px-3 py-1 rounded-full border border-green-500/20">
                  <Percent className="w-4 h-4" />
                  <span className="font-bold">{deal.discount_percent}%</span>
                </div>
              </div>

              <p className="text-gray-300 mb-4">{deal.offer_title}</p>

              {deal.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {deal.tags.map((tag, i) => (
                    <Badge 
                      key={i} 
                      variant="secondary"
                      className="bg-card/5 text-gray-400 border border-white/10"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {deal.coupon_code && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 bg-card/5 rounded-lg px-4 py-2 font-mono text-sm border border-dashed border-white/10">
                    {deal.coupon_code}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyCode(deal.coupon_code)}
                    className="text-gray-400 hover:text-white"
                  >
                    {copiedCode === deal.coupon_code ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Updated {format(new Date(deal.updated_date), 'MMM d, yyyy')}
                </p>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditDeal(deal);
                        setShowDealForm(true);
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  )}
                  {deal.external_link && (
                    <a
                      href={deal.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                    >
                      Get Deal <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Deal Form Modal (Admin Only) */}
      {isAdmin && (
        <PropDealForm 
          open={showDealForm} 
          onClose={() => {
            setShowDealForm(false);
            setEditDeal(null);
          }}
          onSuccess={refetch}
          editDeal={editDeal}
        />
      )}
    </div>
  );
}