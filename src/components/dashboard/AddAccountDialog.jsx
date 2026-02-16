import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertTriangle, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { PROP_FIRMS, getFirmById } from '@/lib/fundedHubDatabase';
import { toast } from "sonner";

export default function AddAccountDialog({ open, onOpenChange, currentUser, initialData = null, onSuccess }) {
    const queryClient = useQueryClient();

    // -- Selection State --
    const [accountType, setAccountType] = useState('Prop Firm'); // 'Prop Firm', 'Personal'
    const [selectedFirmId, setSelectedFirmId] = useState(''); // 'custom' or firm.id
    const [selectedFamilyId, setSelectedFamilyId] = useState('');
    const [selectedPlanId, setSelectedPlanId] = useState('');

    // -- Form Fields --
    const [customFirmName, setCustomFirmName] = useState('');
    const [accountName, setAccountName] = useState('');
    const [currency, setCurrency] = useState('USD');

    // -- Rule Fields --
    const [balance, setBalance] = useState('');
    const [dailyLoss, setDailyLoss] = useState('');
    const [maxDrawdown, setMaxDrawdown] = useState('');
    const [profitTarget, setProfitTarget] = useState('');
    const [consistencyRule, setConsistencyRule] = useState('');

    const [isScraping, setIsScraping] = useState(false);

    // -- Derived Data --
    const selectedFirm = useMemo(() =>
        selectedFirmId && selectedFirmId !== 'custom' ? getFirmById(selectedFirmId) : null
        , [selectedFirmId]);

    const availableFamilies = useMemo(() => selectedFirm?.planFamilies || [], [selectedFirm]);

    const selectedFamily = useMemo(() =>
        availableFamilies.find(f => f.id === selectedFamilyId)
        , [availableFamilies, selectedFamilyId]);

    const availablePlans = useMemo(() => selectedFamily?.plans || [], [selectedFamily]);

    // -- Effects --

    // Auto-fill when a verified plan is selected
    useEffect(() => {
        if (selectedPlanId && selectedFamily) {
            const plan = availablePlans.find(p => p.id === selectedPlanId);
            if (plan) {
                setBalance(plan.size.toString());
                setDailyLoss(plan.dailyLoss ? plan.dailyLoss.toString() : '');
                setMaxDrawdown(plan.maxDrawdown ? plan.maxDrawdown.toString() : '');
                setProfitTarget(plan.profitTarget ? plan.profitTarget.toString() : '');
                setConsistencyRule(plan.consistency || '');

                // Auto-generate name if empty or default
                if (!accountName || accountName.includes(selectedFirm.name)) {
                    setAccountName(`${selectedFirm.name} - ${plan.size / 1000}K ${selectedFamily.name}`);
                }
            }
        }
    }, [selectedPlanId, selectedFamily, selectedFirm, availablePlans]);

    // Reset when opening
    useEffect(() => {
        if (open && !initialData) {
            setAccountType('Prop Firm');
            setSelectedFirmId('');
            setSelectedFamilyId('');
            setSelectedPlanId('');
            setCustomFirmName('');
            setAccountName('');
            setBalance('');
            setDailyLoss('');
            setMaxDrawdown('');
            setProfitTarget('');
            setConsistencyRule('');
        }
    }, [open, initialData]);

    const createAccountMutation = useMutation({
        mutationFn: (data) => api.entities.TradingAccount.create(data),
        onSuccess: (newAccount) => {
            queryClient.invalidateQueries({ queryKey: ['tradingAccounts'] });
            toast.success("Account Created", { description: `${newAccount.account_name} is now active.` });
            onOpenChange(false);
            if (onSuccess) onSuccess(newAccount);
        },
    });

    const handleAIScrape = () => {
        setIsScraping(true);
        // Mock API call
        setTimeout(() => {
            setIsScraping(false);
            setBalance('50000');
            setDailyLoss('1000');
            setMaxDrawdown('2000');
            setProfitTarget('3000');
            setConsistencyRule('50%');
            toast.success("Rules Auto-Filled", { description: "Extracted rules from firm documentation." });
        }, 1500);
    };

    const handleSubmit = () => {
        if (!accountName.trim()) return;

        const isCustom = selectedFirmId === 'custom' || accountType === 'Personal';
        const finalFirmName = isCustom ? customFirmName : selectedFirm?.name;

        if (accountType === 'Prop Firm' && !finalFirmName) {
            toast.error("Please select or enter a firm name");
            return;
        }

        const accountData = {
            user_id: currentUser?.email,
            account_name: accountName.trim(),
            account_type: accountType, // 'Prop Firm' or 'Personal'
            currency_code: currency,
            is_default: false,

            // Core Rules
            initial_balance: parseFloat(balance) || 0,
            daily_loss_limit: parseFloat(dailyLoss) || 0,
            max_drawdown: parseFloat(maxDrawdown) || 0,
            profit_target: parseFloat(profitTarget) || 0,

            // Store rich metadata for the engine
            metadata: {
                firmName: finalFirmName,
                isCustomFirm: isCustom,
                consistencyRule: consistencyRule || null,
                firmId: isCustom ? null : selectedFirmId,
                planId: isCustom ? null : selectedPlanId,
                source: isCustom ? 'Manual/AI' : 'Verified Database'
            }
        };

        createAccountMutation.mutate(accountData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Trading Account</DialogTitle>
                    <DialogDescription>
                        Connect a verified prop firm account or track a custom personal account.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">

                    {/* 1. Account Category */}
                    <div className="space-y-3">
                        <Label>Account Category</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => setAccountType('Prop Firm')}
                                className={cn(
                                    "cursor-pointer border rounded-xl p-4 transition-all hover:bg-muted/50 flex flex-col items-center gap-2 text-center",
                                    accountType === 'Prop Firm' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                                )}
                            >
                                <div className="p-2 bg-blue-500/10 rounded-full text-blue-500"><Sparkles className="w-5 h-5" /></div>
                                <span className="font-semibold text-sm">Prop Firm</span>
                            </div>
                            <div
                                onClick={() => { setAccountType('Personal'); setSelectedFirmId(''); }}
                                className={cn(
                                    "cursor-pointer border rounded-xl p-4 transition-all hover:bg-muted/50 flex flex-col items-center gap-2 text-center",
                                    accountType === 'Personal' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                                )}
                            >
                                <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-500"><CheckCircle2 className="w-5 h-5" /></div>
                                <span className="font-semibold text-sm">Personal / Broker</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Firm Selection (Prop Only) */}
                    {accountType === 'Prop Firm' && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="col-span-1 space-y-2">
                                <Label>Select Firm</Label>
                                <Select value={selectedFirmId} onValueChange={(val) => {
                                    setSelectedFirmId(val);
                                    setSelectedFamilyId('');
                                    setSelectedPlanId('');
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose Firm..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="custom" className="font-semibold text-primary">
                                            + Add Custom Firm
                                        </SelectItem>
                                        {PROP_FIRMS.map(firm => (
                                            <SelectItem key={firm.id} value={firm.id}>{firm.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedFirmId && selectedFirmId !== 'custom' ? (
                                <div className="col-span-1 space-y-2">
                                    <Label>Account Plan</Label>
                                    <Select value={selectedPlanId} onValueChange={(val) => {
                                        const found = availablePlans.find(p => p.id === val);
                                        // If plan is unique across families, great. If IDs clash, we might need logic.
                                        // Our DB schema guarantees unique IDs (e.g. ts-50k).
                                        // We need to set family ID if we can deduce it, or use grouped select.
                                        // Simplified: Flatten list for now or dependent dropdowns.
                                        // Let's use dependent dropdown logic for better UX.
                                        setSelectedPlanId(val);
                                    }}>
                                        <SelectTrigger disabled={!selectedFamilyId}>
                                            <SelectValue placeholder="Select Size..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availablePlans.map(plan => (
                                                <SelectItem key={plan.id} value={plan.id}>
                                                    {plan.size / 1000}K {selectedFamily.id !== 'default' ? `- ${plan.price}` : ''}
                                                    {/* Simplification: Price helps distinguish */}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : selectedFirmId === 'custom' ? (
                                <div className="col-span-1 space-y-2 animate-in fade-in">
                                    <Label>Firm Name</Label>
                                    <Input
                                        placeholder="e.g. Bespoke Funding"
                                        value={customFirmName}
                                        onChange={e => setCustomFirmName(e.target.value)}
                                    />
                                </div>
                            ) : null}

                            {/* Family Selector (Intermediate Step) */}
                            {selectedFirm && availableFamilies.length > 0 && (
                                <div className="col-span-2 space-y-2">
                                    <Label>Program Type</Label>
                                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                        {availableFamilies.map(fam => (
                                            <button
                                                key={fam.id}
                                                onClick={() => { setSelectedFamilyId(fam.id); setSelectedPlanId(''); }}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap",
                                                    selectedFamilyId === fam.id
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-muted hover:bg-muted/80 border-transparent text-muted-foreground"
                                                )}
                                            >
                                                {fam.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. Account Details */}
                    <div className="space-y-4 pt-2 border-t">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label>Account Nickname</Label>
                                <Input
                                    placeholder="My Trading Account"
                                    value={accountName}
                                    onChange={e => setAccountName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Currency</Label>
                                <Select value={currency} onValueChange={setCurrency}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD ($)</SelectItem>
                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                        <SelectItem value="GBP">GBP (£)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Rules Grid */}
                        <div className="bg-muted/30 p-4 rounded-xl space-y-4 border border-border/50">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                                    Risk Rules
                                </h4>
                                {(selectedFirmId === 'custom' || accountType === 'Personal') && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs gap-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                        onClick={handleAIScrape}
                                        disabled={isScraping}
                                    >
                                        {isScraping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                        AI Auto-Fill
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Start Balance</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                                        <Input className="pl-6 h-8 text-sm" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Profit Target</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                                        <Input className="pl-6 h-8 text-sm" value={profitTarget} onChange={e => setProfitTarget(e.target.value)} placeholder="Optional" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Daily Loss Limit</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                                        <Input className="pl-6 h-8 text-sm" value={dailyLoss} onChange={e => setDailyLoss(e.target.value)} placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Max Drawdown</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                                        <Input className="pl-6 h-8 text-sm" value={maxDrawdown} onChange={e => setMaxDrawdown(e.target.value)} placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <Label className="text-xs text-muted-foreground">Consistency Rule</Label>
                                    <Input
                                        className="h-8 text-sm"
                                        value={consistencyRule}
                                        onChange={e => setConsistencyRule(e.target.value)}
                                        placeholder="e.g. 50% max profit per day (Leave empty if none)"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!accountName || createAccountMutation.isLoading}>
                        {createAccountMutation.isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create Account
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
