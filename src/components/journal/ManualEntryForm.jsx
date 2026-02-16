import React, { useState, useEffect } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Calendar, AlertTriangle, CheckCircle2, DollarSign, BrainCircuit, Activity,
    TrendingUp, TrendingDown, Target, ShieldCheck, HeartPulse, Camera
} from 'lucide-react';
import { format } from 'date-fns';

export default function ManualEntryForm({ open, onOpenChange, currentUser, accounts, onSuccess }) {
    const queryClient = useQueryClient();

    // -- Layer 1: Core Fields --
    const [accountId, setAccountId] = useState('');
    const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [session, setSession] = useState('');
    const [instrument, setInstrument] = useState(''); // e.g., ES, NQ
    const [direction, setDirection] = useState('Long'); // Long/Short
    const [size, setSize] = useState('1'); // Contracts/Lots
    const [entryPrice, setEntryPrice] = useState('');
    const [exitPrice, setExitPrice] = useState('');
    const [pnl, setPnl] = useState('');
    const [riskMultiple, setRiskMultiple] = useState(''); // R-Multiple
    const [outcome, setOutcome] = useState('Full TP'); // Outcome Type

    // -- Layer 2: Behavior --
    const [setupTag, setSetupTag] = useState('');
    const [tradeIntent, setTradeIntent] = useState('A+ Planned');
    const [confidence, setConfidence] = useState(3);
    const [emotion, setEmotion] = useState('Focused');

    // -- Layer 3: Context --
    const [rulesChecked, setRulesChecked] = useState({
        dailyLoss: true,
        maxSize: true,
        consistency: true
    });
    const [newsEvent, setNewsEvent] = useState(false);
    const [reflection, setReflection] = useState('');
    const [screenshotUrl, setScreenshotUrl] = useState('');

    useEffect(() => {
        if (open) {
            // Auto-detect session on open
            const hour = new Date().getHours();
            if (hour >= 22 || hour < 7) setSession('Asia');
            else if (hour >= 7 && hour < 12) setSession('London');
            else if (hour >= 12 && hour < 16) setSession('NY AM');
            else setSession('NY PM');
        }
    }, [open]);

    // Validation
    const isFormValid = accountId && instrument && pnl && direction;

    const createEntryMutation = useMutation({
        mutationFn: async (data) => {
            // 1. Create Journal Entry
            const entry = await api.entities.JournalEntry.create({
                user_id: currentUser.email,
                account_id: accountId,
                entry_date: entryDate,
                daily_pnl: parseFloat(pnl),
                trade_count: 1,
                wins: parseFloat(pnl) > 0 ? 1 : 0,
                losses: parseFloat(pnl) <= 0 ? 1 : 0,
                journal_notes: `[Manual Entry] ${direction} ${instrument} (${size} lots) | ${outcome} | ${riskMultiple}R\n\nContext: ${reflection}\n\n[Session: ${session} | Setup: ${setupTag} | Intent: ${tradeIntent}]`,
                status: 'complete',
                // Store extra metadata in a JSON field if available, or just in notes. 
                // For this demo, notes is sufficient.
            });

            // 2. Create detailed trade line (optional but good for data)
            await api.entities.TradeEntries.create({
                user_id: currentUser.email,
                account_id: accountId,
                journal_entry_id: entry.id,
                date_key: entryDate,
                symbol: instrument,
                side: direction,
                pnl_currency: parseFloat(pnl),
                source: 'MANUAL',
                entry_price: parseFloat(entryPrice),
                exit_price: parseFloat(exitPrice),
                size: parseFloat(size),
                setup_tag: setupTag,
                emotion: emotion,
                confidence: confidence
            });

            return entry;
        },
        onSuccess: (newEntry) => {
            queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
            toast.success("Trade Logged", { description: `${instrument} trade saved to journal.` });
            onOpenChange(false);
            if (onSuccess) onSuccess(newEntry);

            // Reset crucial fields
            setPnl('');
            setReflection('');
        },
    });

    const handleSubmit = () => {
        if (!isFormValid) return;
        createEntryMutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><BrainCircuit className="w-5 h-5" /></div>
                        <div>
                            <DialogTitle>Log Manual Trade</DialogTitle>
                            <DialogDescription>Record a trade execution with full behavioral context.</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="core" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="core" className="gap-2"><Activity className="w-4 h-4" /> Core Data</TabsTrigger>
                        <TabsTrigger value="behavior" className="gap-2"><BrainCircuit className="w-4 h-4" /> Psychology</TabsTrigger>
                        <TabsTrigger value="context" className="gap-2"><ShieldCheck className="w-4 h-4" /> Risk & Notes</TabsTrigger>
                    </TabsList>

                    {/* --- Layer 1: Core Data --- */}
                    <TabsContent value="core" className="space-y-4 animate-in fade-in slide-in-from-left-2">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="col-span-2 lg:col-span-1 space-y-2">
                                <Label className="text-primary font-semibold">Trading Account *</Label>
                                <Select value={accountId} onValueChange={setAccountId}>
                                    <SelectTrigger className="border-primary/50"><SelectValue placeholder="Select Account" /></SelectTrigger>
                                    <SelectContent>
                                        {accounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.firmId})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <Label>Session</Label>
                                <Select value={session} onValueChange={setSession}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Asia">Asia</SelectItem>
                                        <SelectItem value="London">London</SelectItem>
                                        <SelectItem value="NY AM">NY AM</SelectItem>
                                        <SelectItem value="NY PM">NY PM</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="p-4 border rounded-xl bg-card/50 grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Instrument</Label>
                                <Input placeholder="e.g. NQ" value={instrument} onChange={e => setInstrument(e.target.value.toUpperCase())} />
                            </div>
                            <div className="space-y-2">
                                <Label>Direction</Label>
                                <Select value={direction} onValueChange={setDirection}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Long">Long 🟢</SelectItem>
                                        <SelectItem value="Short">Short 🔴</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Size</Label>
                                <Input type="number" value={size} onChange={e => setSize(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Outcome</Label>
                                <Select value={outcome} onValueChange={setOutcome}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Full TP">Full TP 🎯</SelectItem>
                                        <SelectItem value="Partial TP">Partial TP 💰</SelectItem>
                                        <SelectItem value="Breakeven">Breakeven 🛡️</SelectItem>
                                        <SelectItem value="Full SL">Full SL 🛑</SelectItem>
                                        <SelectItem value="Scratch">Scratch 💨</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Entry Price</Label>
                                <Input type="number" placeholder="0.00" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Exit Price</Label>
                                <Input type="number" placeholder="0.00" value={exitPrice} onChange={e => setExitPrice(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label className={cn("font-bold", parseFloat(pnl) > 0 ? "text-emerald-500" : parseFloat(pnl) < 0 ? "text-red-500" : "")}>
                                    Result P&L ($) *
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                        type="number"
                                        className={cn("pl-6 font-mono font-bold", parseFloat(pnl) > 0 ? "text-emerald-500" : parseFloat(pnl) < 0 ? "text-red-500" : "")}
                                        placeholder="0.00"
                                        value={pnl}
                                        onChange={e => setPnl(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- Layer 2: Behavior --- */}
                    <TabsContent value="behavior" className="space-y-6 animate-in fade-in slide-in-from-right-2">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label>Setup Tag</Label>
                                <Select value={setupTag} onValueChange={setSetupTag}>
                                    <SelectTrigger><SelectValue placeholder="Select Setup..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ORB">Opening Range Breakout</SelectItem>
                                        <SelectItem value="VWAP Reclaim">VWAP Reclaim</SelectItem>
                                        <SelectItem value="Liquidity Sweep">Liquidity Sweep</SelectItem>
                                        <SelectItem value="Trend Continuation">Trend Continuation</SelectItem>
                                        <SelectItem value="News Fade">News Fade</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label>Trade Intent</Label>
                                <Select value={tradeIntent} onValueChange={setTradeIntent}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A+ Planned">A+ Planned (Perfect)</SelectItem>
                                        <SelectItem value="A Planned">A Planned (Good)</SelectItem>
                                        <SelectItem value="B Reactive">B Reactive (Okay)</SelectItem>
                                        <SelectItem value="Emotional">Emotional / Impulse ⚠️</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Confidence Level</Label>
                                    <span className="text-sm font-bold text-primary">{confidence}/5</span>
                                </div>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setConfidence(v)}
                                            className={cn(
                                                "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
                                                confidence === v
                                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                    : "hover:bg-muted"
                                            )}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Emotional State</Label>
                                <div className="flex flex-wrap gap-2">
                                    {['Calm', 'Focused', 'Anxious', 'Frustrated', 'Overconfident'].map(e => (
                                        <Badge
                                            key={e}
                                            variant={emotion === e ? "default" : "outline"}
                                            className="cursor-pointer px-3 py-1"
                                            onClick={() => setEmotion(e)}
                                        >
                                            {e}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- Layer 3: Context --- */}
                    <TabsContent value="context" className="space-y-4 animate-in fade-in slide-in-from-right-2">
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 space-y-3">
                            <h4 className="text-sm font-semibold text-orange-600 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> Rule Awareness
                            </h4>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="r1" checked={rulesChecked.dailyLoss} onCheckedChange={c => setRulesChecked(prev => ({ ...prev, dailyLoss: c }))} />
                                    <label htmlFor="r1" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Within Daily Loss Limit?
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="r2" checked={rulesChecked.maxSize} onCheckedChange={c => setRulesChecked(prev => ({ ...prev, maxSize: c }))} />
                                    <label htmlFor="r2" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Position Size Safe?
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Post-Trade Reflection</Label>
                            <Textarea
                                placeholder="What did I do well? What would I change next time? (Max 240 chars)"
                                maxLength={240}
                                value={reflection}
                                onChange={e => setReflection(e.target.value)}
                                className="h-24 resize-none"
                            />
                            <div className="text-xs text-right text-muted-foreground">{reflection.length}/240</div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="news" checked={newsEvent} onCheckedChange={setNewsEvent} />
                            <label htmlFor="news" className="text-sm font-medium leading-none">
                                High Impact News Event during trade?
                            </label>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="gap-2 sm:gap-0">
                    {!isFormValid && (
                        <p className="text-xs text-red-500 mr-auto self-center">
                            * Please fill Account, Instrument, Direction, and P&L
                        </p>
                    )}
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!isFormValid || createEntryMutation.isLoading}>
                        {createEntryMutation.isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Entry
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
