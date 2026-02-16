import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Loader2,
  Plus,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Upload,
  X,
  TrendingUp,
  TrendingDown,
  Shield,
  Brain,
  Target,
  FileText,
  Search,
  Clock,
  Image,
  BarChart3,
  MessageSquare,
  Trash2,
  Download,
  Play,
  MoreVertical,
  Link as LinkIcon,
  Unlink
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";
import { createPageUrl } from '../utils';

export default function SessionWorkspace() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [disciplineFilter, setDisciplineFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deleteJournalToo, setDeleteJournalToo] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Summary mode flag
  const isSummaryMode = selectedAccountId === 'SUMMARY_ALL';

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => { });
  }, []);

  useEffect(() => {
    const savedAccountId = localStorage.getItem('selectedAccountId');
    setSelectedAccountId(savedAccountId);

    const handleAccountChange = (e) => {
      setSelectedAccountId(e.detail);
      setSelectedSessionId(null);
    };

    window.addEventListener('accountChanged', handleAccountChange);
    return () => window.removeEventListener('accountChanged', handleAccountChange);
  }, []);

  // Fetch sessions - ordered by created_date to show newest first
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessionWorkspaces', user?.email, selectedAccountId],
    queryFn: async () => {
      if (!user?.email || !selectedAccountId) return [];
      const allSessions = await api.entities.SessionWorkspace.filter({
        user_id: user.email,
        account_id: selectedAccountId
      }, '-created_date', 100);

      // Deduplicate by session ID (should not happen, but safety check)
      const uniqueSessions = Array.from(
        new Map(allSessions.map(s => [s.id, s])).values()
      );

      return uniqueSessions;
    },
    enabled: !!user?.email && !!selectedAccountId
  });

  // Fetch journal entries for metrics and linking
  const { data: journalEntries = [] } = useQuery({
    queryKey: ['sessionJournalEntries', user?.email, selectedAccountId],
    queryFn: async () => {
      if (!user?.email || !selectedAccountId) return [];
      return await api.entities.JournalEntry.filter({
        created_by: user.email,
        account_id: selectedAccountId
      }, '-entry_date', 100);
    },
    enabled: !!user?.email && !!selectedAccountId
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      return await api.entities.SessionWorkspace.create({
        user_id: user.email,
        account_id: selectedAccountId,
        session_date: format(now, 'yyyy-MM-dd'),
        status: 'draft',
        pre_market_intent: {},
        execution_notes: [],
        post_market_reflection: {}
      });
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['sessionWorkspaces'] });
      setSelectedSessionId(newSession.id);
      setExpandedSection('premarket');
    }
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async ({ sessionId, data }) => {
      return await api.entities.SessionWorkspace.update(sessionId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionWorkspaces'] });
    }
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async ({ sessionId, deleteJournal }) => {
      const session = sessions.find(s => s.id === sessionId);

      // Delete linked journal entry if requested
      if (deleteJournal && session?.journal_entry_id) {
        await api.entities.JournalEntry.delete(session.journal_entry_id);
      }

      // Delete the session
      await api.entities.SessionWorkspace.delete(sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionWorkspaces'] });
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      setSelectedSessionId(null);
      setShowDeleteModal(false);
      setSessionToDelete(null);
      setDeleteJournalToo(false);
    }
  });

  // Link session to journal entry
  const linkSessionMutation = useMutation({
    mutationFn: async ({ sessionId, journalEntryId }) => {
      return await api.entities.SessionWorkspace.update(sessionId, {
        journal_entry_id: journalEntryId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionWorkspaces'] });
      setShowLinkModal(false);
    }
  });

  // Generate AI insight
  const handleGenerateInsight = async (session) => {
    if (!session || generatingInsight) return;

    setGeneratingInsight(true);
    try {
      const journalEntry = journalEntries.find(e => e.entry_date === session.session_date);

      const prompt = `You are analyzing a trading session workspace for behavioral insights.

SESSION DATA:
Date: ${session.session_date}
Net P&L: ${journalEntry?.daily_pnl || 0}
Trades: ${journalEntry?.trade_count || 0}
Wins: ${journalEntry?.wins || 0}
Losses: ${journalEntry?.losses || 0}
Discipline Status: ${journalEntry?.rule_status || 'NONE'}

PRE-MARKET INTENT:
${JSON.stringify(session.pre_market_intent || {}, null, 2)}

EXECUTION NOTES:
${(session.execution_notes || []).map(n => n.note_text).join('\n')}

POST-MARKET REFLECTION:
${JSON.stringify(session.post_market_reflection || {}, null, 2)}

INSTRUCTIONS:
Generate a structured analysis with:

1. Session Summary (2-3 sentences): Objective overview of execution and results
2. Discipline Explanation (2-3 sentences): How well did the trader follow their plan?
3. Psychology Insight (2-3 sentences): Observable emotional patterns or triggers
4. Actionable Improvement (1 sentence): One specific, measurable behavior to improve

Tone: Professional, analytical, non-judgmental. Focus on behavior, not outcomes.`;

      const response = await api.integrations.Core.InvokeLLM({
        prompt: prompt
      });

      const insightText = typeof response === 'string' ? response : response.output || '';

      // Parse sections
      const sections = {
        session_summary: '',
        discipline_explanation: '',
        psychology_insight: '',
        actionable_improvement: '',
        generated_at: new Date().toISOString()
      };

      const lines = insightText.split('\n');
      let currentSection = null;

      for (const line of lines) {
        if (line.includes('Session Summary')) {
          currentSection = 'session_summary';
        } else if (line.includes('Discipline Explanation')) {
          currentSection = 'discipline_explanation';
        } else if (line.includes('Psychology Insight')) {
          currentSection = 'psychology_insight';
        } else if (line.includes('Actionable Improvement')) {
          currentSection = 'actionable_improvement';
        } else if (currentSection && line.trim()) {
          sections[currentSection] += (sections[currentSection] ? ' ' : '') + line.trim();
        }
      }

      await updateSessionMutation.mutateAsync({
        sessionId: session.id,
        data: { ai_insight: sections }
      });
    } catch (error) {
      console.error('Failed to generate insight:', error);
    } finally {
      setGeneratingInsight(false);
    }
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // Find journal entry by LINKED ID, not by date matching
  const selectedJournalEntry = selectedSession && selectedSession.journal_entry_id
    ? journalEntries.find(e => e.id === selectedSession.journal_entry_id)
    : null;

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const journalEntry = journalEntries.find(e => e.entry_date === session.session_date);

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'draft' && session.status !== 'draft') return false;
      if (statusFilter === 'complete' && session.status !== 'complete') return false;
    }

    // Discipline filter
    if (disciplineFilter !== 'all') {
      if (disciplineFilter === 'followed' && journalEntry?.rule_status !== 'NONE') return false;
      if (disciplineFilter === 'minor' && journalEntry?.rule_status !== 'MINOR') return false;
      if (disciplineFilter === 'major' && journalEntry?.rule_status !== 'MAJOR') return false;
    }

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const dateMatch = session.session_date.includes(searchLower);
      const notesMatch = session.execution_notes?.some(n =>
        n.note_text?.toLowerCase().includes(searchLower)
      );
      if (!dateMatch && !notesMatch) return false;
    }

    return true;
  });

  // Group sessions by date
  const sessionsByDate = filteredSessions.reduce((acc, session) => {
    const date = session.session_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {});

  // Calculate progress for draft sessions
  const calculateProgress = (session) => {
    const steps = [
      { key: 'pre_market_intent', label: 'Pre-market plan' },
      { key: 'execution_notes', label: 'Execution notes' },
      { key: 'post_market_reflection', label: 'Post-market reflection' },
      { key: 'ai_insight', label: 'AI insight' }
    ];

    let completed = 0;
    if (session.pre_market_intent?.market_bias) completed++;
    if (session.execution_notes?.length > 0) completed++;
    if (session.post_market_reflection?.what_went_well) completed++;
    if (session.ai_insight) completed++;

    return { completed, total: steps.length, percentage: (completed / steps.length) * 100 };
  };

  if (!user || !selectedAccountId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Block summary mode
  if (isSummaryMode) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md p-12 text-center border-blue-200">
          <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Summary Mode is Read-Only</h3>
          <p className="text-muted-foreground mb-6">
            Session Workspace is account-specific. Please switch to an individual account to create or view sessions.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Left Panel - Session List */}
      <div className="w-96 flex-shrink-0 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Sessions</h2>
            <p className="text-sm text-muted-foreground">Your session workspace history</p>
          </div>
          <Button
            size="sm"
            onClick={() => createSessionMutation.mutate()}
            disabled={createSessionMutation.isPending || isSummaryMode}
            className="font-semibold"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Session
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="complete">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Discipline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="followed">Followed</SelectItem>
              <SelectItem value="minor">Minor Break</SelectItem>
              <SelectItem value="major">Major Break</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <Card className="p-8 text-center border-border">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                {sessions.length === 0 ? 'No sessions yet' : 'No matching sessions'}
              </p>
              <p className="text-xs text-muted-foreground">
                {sessions.length === 0 ? 'Create your first session workspace' : 'Try adjusting your filters'}
              </p>
            </Card>
          ) : (
            Object.entries(sessionsByDate).map(([date, dateSessions]) => (
              <div key={date} className="space-y-2">
                {dateSessions.length > 1 && (
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                    {format(parseISO(date), 'MMM d, yyyy')} • {dateSessions.length} sessions
                  </p>
                )}

                {dateSessions.map((session) => {
                  // Find journal entry by linked ID, not by date
                  const journalEntry = session.journal_entry_id
                    ? journalEntries.find(e => e.id === session.journal_entry_id)
                    : null;
                  const isSelected = selectedSessionId === session.id;
                  const progress = calculateProgress(session);

                  return (
                    <Card
                      key={session.id}
                      className={cn(
                        "transition-all hover:shadow-md relative",
                        isSelected
                          ? "border-blue-500 bg-primary/10 shadow-sm"
                          : "border-border hover:border-blue-300"
                      )}
                    >
                      <div className="p-4 cursor-pointer" onClick={() => setSelectedSessionId(session.id)}>
                        {/* Top row: Date/time + Status + Menu */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {dateSessions.length === 1
                                ? format(parseISO(session.session_date), 'MMM d, yyyy')
                                : format(parseISO(session.created_date), 'h:mm a')}
                            </p>
                            <Clock className="w-3 h-3 text-slate-400" />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "px-2 py-0.5 rounded text-xs font-semibold",
                              session.status === 'complete'
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            )}>
                              {session.status === 'complete' ? 'Completed' : 'Draft'}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSessionId(session.id);
                                }}>
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSessionToDelete(session);
                                    setShowDeleteModal(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* P&L + Discipline */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={cn(
                            "text-2xl font-bold",
                            (journalEntry?.daily_pnl || 0) >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {(journalEntry?.daily_pnl || 0) >= 0 ? '+' : ''}${(journalEntry?.daily_pnl || 0).toFixed(0)}
                          </span>

                          <div className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-semibold",
                            journalEntry?.rule_status === 'NONE' && "bg-green-100 text-green-700",
                            journalEntry?.rule_status === 'MINOR' && "bg-amber-100 text-amber-700",
                            journalEntry?.rule_status === 'MAJOR' && "bg-red-100 text-red-700",
                            !journalEntry && "bg-muted text-muted-foreground"
                          )}>
                            {journalEntry?.rule_status === 'NONE' ? '✓ Followed' :
                              journalEntry?.rule_status === 'MINOR' ? '⚠️ Minor' :
                                journalEntry?.rule_status === 'MAJOR' ? '🔴 Major' : 'No Data'}
                          </div>
                        </div>

                        {/* Bottom: Trades + Evidence count */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <span>{journalEntry?.trade_count || 0} trades</span>
                            <span>{journalEntry?.wins || 0}W / {journalEntry?.losses || 0}L</span>
                          </div>
                          {(journalEntry?.before_screenshots?.length > 0 ||
                            journalEntry?.after_screenshots?.length > 0) && (
                              <div className="flex items-center gap-1 text-primary">
                                <Image className="w-3 h-3" />
                                <span>
                                  {(journalEntry?.before_screenshots?.length || 0) +
                                    (journalEntry?.after_screenshots?.length || 0)}
                                </span>
                              </div>
                            )}
                        </div>

                        {/* Progress bar for drafts */}
                        {session.status === 'draft' && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Progress</span>
                              <span className="text-xs font-semibold text-foreground">
                                {progress.completed}/{progress.total}
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${progress.percentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Session Workspace */}
      <div className="flex-1 overflow-y-auto">
        {!selectedSession ? (
          <div className="h-full flex items-center justify-center">
            <Card className="max-w-2xl w-full p-12 border-border">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Start a new session or open an existing one
                </h3>
                <p className="text-muted-foreground">
                  Your session workspace is where you plan trades, track execution, and reflect on discipline.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <Button
                  onClick={() => createSessionMutation.mutate()}
                  disabled={createSessionMutation.isPending}
                  className="h-24 flex-col gap-2 font-semibold"
                >
                  {createSessionMutation.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Plus className="w-6 h-6" />
                  )}
                  <span className="font-semibold">
                    {createSessionMutation.isPending ? 'Creating...' : 'Create New Session'}
                  </span>
                </Button>
                <Button
                  onClick={() => {
                    if (filteredSessions.length > 0) {
                      setSelectedSessionId(filteredSessions[0].id);
                    }
                  }}
                  disabled={filteredSessions.length === 0}
                  variant="outline"
                  className="h-24 flex-col gap-2 border-2"
                >
                  <Play className="w-6 h-6" />
                  <span className="font-semibold">Open Most Recent</span>
                </Button>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground mb-3">How it works:</p>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Set Pre-Market Intent</p>
                    <p className="text-xs text-muted-foreground">Define your bias, max trades, and emotional state</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Track Execution</p>
                    <p className="text-xs text-muted-foreground">Add notes during the session about what you're seeing</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Reflect & Get AI Insights</p>
                    <p className="text-xs text-muted-foreground">Complete post-market reflection and generate behavioral analysis</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Session Snapshot Header */}
            <Card className="border-border overflow-hidden">
              <div className="bg-muted/30 p-6 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {format(parseISO(selectedSession.session_date), 'EEEE, MMM d, yyyy')}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created {format(parseISO(selectedSession.created_date), 'h:mm a')}
                    </p>
                  </div>
                  <div className={cn(
                    "px-4 py-2 rounded-lg text-sm font-semibold",
                    selectedSession.status === 'complete'
                      ? "bg-green-500 text-white"
                      : "bg-amber-500 text-white"
                  )}>
                    {selectedSession.status === 'complete' ? '✓ Completed' : 'Draft'}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" /> Net P&L
                    </p>
                    <p className={cn(
                      "text-xl font-bold",
                      (selectedJournalEntry?.daily_pnl || 0) >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {(selectedJournalEntry?.daily_pnl || 0) >= 0 ? '+' : ''}${(selectedJournalEntry?.daily_pnl || 0).toFixed(0)}
                    </p>
                  </div>

                  <div className="bg-card rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Trades</p>
                    <p className="text-xl font-bold text-foreground">
                      {selectedJournalEntry?.trade_count || 0}
                    </p>
                  </div>

                  <div className="bg-card rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Win/Loss</p>
                    <p className="text-xl font-bold text-foreground">
                      {selectedJournalEntry?.wins || 0}W/{selectedJournalEntry?.losses || 0}L
                    </p>
                  </div>

                  <div className="bg-card rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Discipline
                    </p>
                    <div className={cn(
                      "px-2 py-1 rounded text-xs font-semibold inline-flex",
                      selectedJournalEntry?.rule_status === 'NONE' && "bg-green-100 text-green-700",
                      selectedJournalEntry?.rule_status === 'MINOR' && "bg-amber-100 text-amber-700",
                      selectedJournalEntry?.rule_status === 'MAJOR' && "bg-red-100 text-red-700",
                      !selectedJournalEntry && "bg-muted text-muted-foreground"
                    )}>
                      {selectedJournalEntry?.rule_status === 'NONE' ? '✓ Followed' :
                        selectedJournalEntry?.rule_status === 'MINOR' ? '⚠️ Minor' :
                          selectedJournalEntry?.rule_status === 'MAJOR' ? '🔴 Major' : 'N/A'}
                    </div>
                  </div>

                  <div className="bg-card rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Image className="w-3 h-3" /> Evidence
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {(selectedJournalEntry?.before_screenshots?.length || 0) +
                        (selectedJournalEntry?.after_screenshots?.length || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Primary Actions */}
              <div className="p-6 flex items-center gap-3">
                {selectedSession.status === 'draft' ? (
                  <>
                    <Button
                      className="flex-1 font-semibold h-12"
                      onClick={() => setExpandedSection('premarket')}
                    >
                      Continue Session
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setSessionToDelete(selectedSession);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold h-12"
                      onClick={() => {
                        if (selectedSession.journal_entry_id && selectedJournalEntry?.id) {
                          window.location.href = `${createPageUrl('Journal')}?view=detail&id=${selectedJournalEntry.id}`;
                        }
                      }}
                      disabled={!selectedSession.journal_entry_id || !selectedJournalEntry}
                    >
                      View Full Journal Entry
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setSessionToDelete(selectedSession);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </Card>

            {/* Progress Indicator for Drafts */}
            {selectedSession.status === 'draft' && (
              <Card className="p-6 border-blue-200 bg-primary/10">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-2">Session Progress</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className={cn(
                        "flex items-center gap-2",
                        selectedSession.pre_market_intent?.market_bias ? "text-green-700" : "text-muted-foreground"
                      )}>
                        {selectedSession.pre_market_intent?.market_bias ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                        )}
                        <span>Pre-market plan</span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-2",
                        selectedSession.execution_notes?.length > 0 ? "text-green-700" : "text-muted-foreground"
                      )}>
                        {selectedSession.execution_notes?.length > 0 ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                        )}
                        <span>Execution notes</span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-2",
                        selectedSession.post_market_reflection?.what_went_well ? "text-green-700" : "text-muted-foreground"
                      )}>
                        {selectedSession.post_market_reflection?.what_went_well ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                        )}
                        <span>Post-market reflection</span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-2",
                        selectedSession.ai_insight ? "text-green-700" : "text-muted-foreground"
                      )}>
                        {selectedSession.ai_insight ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                        )}
                        <span>AI insight generated</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Journal Entry Linking */}
            <Card className="p-4 bg-muted/50 border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Linked Journal Entry</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedSession.journal_entry_id ? (
                      <>ID: {selectedSession.journal_entry_id}</>
                    ) : (
                      'Not linked'
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedSession.journal_entry_id ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (confirm('Unlink this journal entry? The journal entry will not be deleted.')) {
                          await api.entities.SessionWorkspace.update(selectedSession.id, {
                            journal_entry_id: null
                          });
                          queryClient.invalidateQueries({ queryKey: ['sessionWorkspaces'] });
                        }
                      }}
                    >
                      <Unlink className="w-4 h-4 mr-1" />
                      Unlink
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setShowLinkModal(true)}
                    >
                      <LinkIcon className="w-4 h-4 mr-1" />
                      Link Entry
                    </Button>
                  )}
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className="pt-3 border-t border-slate-300 mt-3">
                  <p className="text-xs font-mono text-muted-foreground mb-1">
                    <span className="font-semibold">Session ID:</span> {selectedSession.id}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    <span className="font-semibold">Status:</span> {selectedSession.status}
                  </p>
                </div>
              )}
            </Card>

            {/* Pre-Market Intent */}
            <Card className="border-border">
              <button
                onClick={() => setExpandedSection(expandedSection === 'premarket' ? null : 'premarket')}
                className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Pre-Market Intent</h3>
                </div>
                <ChevronRight className={cn(
                  "w-5 h-5 text-slate-400 transition-transform",
                  expandedSection === 'premarket' && "rotate-90"
                )} />
              </button>

              {expandedSection === 'premarket' && (
                <div className="px-6 pb-6 space-y-4">
                  <div>
                    <Label>Market Bias</Label>
                    <Input
                      value={selectedSession.pre_market_intent?.market_bias || ''}
                      onChange={(e) => updateSessionMutation.mutate({
                        sessionId: selectedSession.id,
                        data: {
                          pre_market_intent: {
                            ...selectedSession.pre_market_intent,
                            market_bias: e.target.value
                          }
                        }
                      })}
                      placeholder="Bullish / Bearish / Neutral"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Max Trades Allowed</Label>
                      <Input
                        type="number"
                        value={selectedSession.pre_market_intent?.max_trades_allowed || ''}
                        onChange={(e) => updateSessionMutation.mutate({
                          sessionId: selectedSession.id,
                          data: {
                            pre_market_intent: {
                              ...selectedSession.pre_market_intent,
                              max_trades_allowed: parseInt(e.target.value)
                            }
                          }
                        })}
                        placeholder="e.g., 3"
                      />
                    </div>

                    <div>
                      <Label>Risk Limit ($)</Label>
                      <Input
                        type="number"
                        value={selectedSession.pre_market_intent?.risk_limit || ''}
                        onChange={(e) => updateSessionMutation.mutate({
                          sessionId: selectedSession.id,
                          data: {
                            pre_market_intent: {
                              ...selectedSession.pre_market_intent,
                              risk_limit: parseFloat(e.target.value)
                            }
                          }
                        })}
                        placeholder="e.g., 500"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Emotional State (1-5)</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          onClick={() => updateSessionMutation.mutate({
                            sessionId: selectedSession.id,
                            data: {
                              pre_market_intent: {
                                ...selectedSession.pre_market_intent,
                                emotional_state: num
                              }
                            }
                          })}
                          className={cn(
                            "w-12 h-12 rounded-lg border-2 font-semibold transition-all",
                            selectedSession.pre_market_intent?.emotional_state === num
                              ? "border-blue-500 bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-slate-300"
                          )}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">1 = Poor, 5 = Excellent</p>
                  </div>

                  <div>
                    <Label>What NOT to Trade</Label>
                    <Textarea
                      value={selectedSession.pre_market_intent?.what_not_to_trade || ''}
                      onChange={(e) => updateSessionMutation.mutate({
                        sessionId: selectedSession.id,
                        data: {
                          pre_market_intent: {
                            ...selectedSession.pre_market_intent,
                            what_not_to_trade: e.target.value
                          }
                        }
                      })}
                      placeholder="Conditions or setups to avoid today..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Execution Notes */}
            <Card className="border-border">
              <button
                onClick={() => setExpandedSection(expandedSection === 'execution' ? null : 'execution')}
                className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Execution Notes</h3>
                  <span className="text-sm text-muted-foreground">
                    ({selectedSession.execution_notes?.length || 0})
                  </span>
                </div>
                <ChevronRight className={cn(
                  "w-5 h-5 text-slate-400 transition-transform",
                  expandedSection === 'execution' && "rotate-90"
                )} />
              </button>

              {expandedSection === 'execution' && (
                <div className="px-6 pb-6 space-y-4">
                  {(selectedSession.execution_notes || []).map((note, idx) => (
                    <div key={idx} className="bg-muted/50 rounded-lg p-4 border border-border">
                      <p className="text-sm text-muted-foreground mb-2">{note.note_text}</p>
                      <p className="text-xs text-muted-foreground">{note.timestamp}</p>
                    </div>
                  ))}

                  <div className="space-y-2">
                    <Textarea
                      id="new-note"
                      placeholder="Add a note about this session..."
                      rows={3}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const noteText = document.getElementById('new-note').value;
                        if (!noteText.trim()) return;

                        updateSessionMutation.mutate({
                          sessionId: selectedSession.id,
                          data: {
                            execution_notes: [
                              ...(selectedSession.execution_notes || []),
                              {
                                timestamp: new Date().toISOString(),
                                note_text: noteText
                              }
                            ]
                          }
                        });
                        document.getElementById('new-note').value = '';
                      }}
                      className="bg-primary text-primary-foreground"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Note
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Post-Market Reflection */}
            <Card className="border-border">
              <button
                onClick={() => setExpandedSection(expandedSection === 'postmarket' ? null : 'postmarket')}
                className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Post-Market Reflection</h3>
                </div>
                <ChevronRight className={cn(
                  "w-5 h-5 text-slate-400 transition-transform",
                  expandedSection === 'postmarket' && "rotate-90"
                )} />
              </button>

              {expandedSection === 'postmarket' && (
                <div className="px-6 pb-6 space-y-4">
                  <div>
                    <Label>What Went Well</Label>
                    <Textarea
                      value={selectedSession.post_market_reflection?.what_went_well || ''}
                      onChange={(e) => updateSessionMutation.mutate({
                        sessionId: selectedSession.id,
                        data: {
                          post_market_reflection: {
                            ...selectedSession.post_market_reflection,
                            what_went_well: e.target.value
                          }
                        }
                      })}
                      placeholder="Positive behaviors and good execution..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>What Broke Discipline</Label>
                    <Textarea
                      value={selectedSession.post_market_reflection?.what_broke_discipline || ''}
                      onChange={(e) => updateSessionMutation.mutate({
                        sessionId: selectedSession.id,
                        data: {
                          post_market_reflection: {
                            ...selectedSession.post_market_reflection,
                            what_broke_discipline: e.target.value
                          }
                        }
                      })}
                      placeholder="Rule violations or deviations..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Emotional Triggers</Label>
                    <Textarea
                      value={selectedSession.post_market_reflection?.emotional_triggers || ''}
                      onChange={(e) => updateSessionMutation.mutate({
                        sessionId: selectedSession.id,
                        data: {
                          post_market_reflection: {
                            ...selectedSession.post_market_reflection,
                            emotional_triggers: e.target.value
                          }
                        }
                      })}
                      placeholder="What caused emotional responses..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Recovery Quality (if red day)</Label>
                    <Textarea
                      value={selectedSession.post_market_reflection?.recovery_quality || ''}
                      onChange={(e) => updateSessionMutation.mutate({
                        sessionId: selectedSession.id,
                        data: {
                          post_market_reflection: {
                            ...selectedSession.post_market_reflection,
                            recovery_quality: e.target.value
                          }
                        }
                      })}
                      placeholder="How did you handle losses..."
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* AI Insight */}
            <Card className="border-border">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">AI Insight</h3>
                  </div>

                  {!selectedSession.ai_insight && (
                    <Button
                      onClick={() => handleGenerateInsight(selectedSession)}
                      disabled={generatingInsight}
                      size="sm"
                      className="bg-primary text-primary-foreground"
                    >
                      {generatingInsight ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Insight
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {selectedSession.ai_insight ? (
                  <div className="space-y-4">
                    <div className="bg-primary/10 rounded-lg p-4 border border-blue-200">
                      <p className="text-xs font-semibold text-primary-foreground/80 uppercase tracking-wide mb-2">
                        Session Summary
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedSession.ai_insight.session_summary}
                      </p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Discipline Explanation
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedSession.ai_insight.discipline_explanation}
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">
                        Psychology Insight
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedSession.ai_insight.psychology_insight}
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                        Actionable Improvement
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedSession.ai_insight.actionable_improvement}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Generated {format(parseISO(selectedSession.ai_insight.generated_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-1">No AI insight generated yet</p>
                    <p className="text-xs text-muted-foreground">Click "Generate Insight" when you're ready</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Journal Entry Linking */}
            <Card className="p-4 bg-muted/50 border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Linked Journal Entry</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedSession.journal_entry_id ? (
                      <>ID: {selectedSession.journal_entry_id.slice(0, 8)}...</>
                    ) : (
                      'Not linked'
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedSession.journal_entry_id ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (confirm('Unlink this journal entry? The journal entry will not be deleted.')) {
                          await api.entities.SessionWorkspace.update(selectedSession.id, {
                            journal_entry_id: null
                          });
                          queryClient.invalidateQueries({ queryKey: ['sessionWorkspaces'] });
                        }
                      }}
                    >
                      <Unlink className="w-4 h-4 mr-1" />
                      Unlink
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setShowLinkModal(true)}
                    >
                      <LinkIcon className="w-4 h-4 mr-1" />
                      Link Entry
                    </Button>
                  )}
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className="pt-3 border-t border-slate-300 mt-3">
                  <p className="text-xs font-mono text-muted-foreground mb-1">
                    <span className="font-semibold">Session ID:</span> {selectedSession.id}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    <span className="font-semibold">Status:</span> {selectedSession.status}
                  </p>
                </div>
              )}
            </Card>

            {/* Mark Complete */}
            {selectedSession.status === 'draft' && (
              <Card className="border-green-200 bg-green-50">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-green-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">Ready to finalize?</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Mark this session as complete to lock it in and ensure discipline data is tracked.
                      </p>
                      <Button
                        onClick={async () => {
                          // If no journal entry linked, create one now
                          let journalEntryId = selectedSession.journal_entry_id;

                          if (!journalEntryId) {
                            const newEntry = await api.entities.JournalEntry.create({
                              entry_date: selectedSession.session_date,
                              account_id: selectedAccountId,
                              uploaded_pnl_screenshots: [],
                              before_screenshots: [],
                              after_screenshots: [],
                              daily_pnl: 0,
                              trade_count: 0,
                              wins: 0,
                              losses: 0,
                              coach_conversation: [],
                              psychologist_conversation: [],
                              journal_notes: '',
                              status: 'registered'
                            });
                            journalEntryId = newEntry.id;
                          }

                          updateSessionMutation.mutate({
                            sessionId: selectedSession.id,
                            data: {
                              status: 'complete',
                              completed_at: new Date().toISOString(),
                              journal_entry_id: journalEntryId
                            }
                          });
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark Session Complete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the session workspace.
              {sessionToDelete?.journal_entry_id && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-900 mb-2">
                    This session is linked to a journal entry.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="deleteJournal"
                      checked={deleteJournalToo}
                      onChange={(e) => setDeleteJournalToo(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="deleteJournal" className="text-sm text-muted-foreground cursor-pointer">
                      Also delete the linked journal entry
                    </label>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteModal(false);
              setSessionToDelete(null);
              setDeleteJournalToo(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (sessionToDelete) {
                  deleteSessionMutation.mutate({
                    sessionId: sessionToDelete.id,
                    deleteJournal: deleteJournalToo
                  });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteSessionMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Delete {deleteJournalToo ? 'Both' : 'Session'}</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Link Journal Entry Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Link this session to a journal entry</DialogTitle>
            <DialogDescription>
              Select an existing journal entry or create a new one to link with this session.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {/* Create new entry option */}
            <Card
              className="p-4 border-2 border-dashed border-blue-300 bg-primary/10 cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={async () => {
                if (selectedSession) {
                  const newEntry = await api.entities.JournalEntry.create({
                    entry_date: selectedSession.session_date,
                    account_id: selectedAccountId,
                    uploaded_pnl_screenshots: [],
                    before_screenshots: [],
                    after_screenshots: [],
                    daily_pnl: 0,
                    trade_count: 0,
                    wins: 0,
                    losses: 0,
                    coach_conversation: [],
                    psychologist_conversation: [],
                    journal_notes: '',
                    status: 'incomplete'
                  });

                  linkSessionMutation.mutate({
                    sessionId: selectedSession.id,
                    journalEntryId: newEntry.id
                  });
                }
              }}
            >
              <div className="flex items-center gap-3">
                <Plus className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Create New Journal Entry</p>
                  <p className="text-xs text-muted-foreground">Creates a new entry for this session date</p>
                </div>
              </div>
            </Card>

            {/* Existing entries */}
            {journalEntries
              .filter(e => e.account_id === selectedAccountId)
              .sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date))
              .slice(0, 10)
              .map(entry => (
                <Card
                  key={entry.id}
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-blue-300"
                  onClick={() => {
                    if (selectedSession) {
                      linkSessionMutation.mutate({
                        sessionId: selectedSession.id,
                        journalEntryId: entry.id
                      });
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {format(parseISO(entry.entry_date), 'MMM d, yyyy')}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className={cn(
                          "font-semibold",
                          (entry.daily_pnl || 0) >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {(entry.daily_pnl || 0) >= 0 ? '+' : ''}${(entry.daily_pnl || 0).toFixed(2)}
                        </span>
                        <span>{entry.trade_count || 0} trades</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded",
                          entry.status === 'registered'
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        )}>
                          {entry.status}
                        </span>
                      </div>
                    </div>
                    <LinkIcon className="w-4 h-4 text-slate-400" />
                  </div>
                </Card>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}