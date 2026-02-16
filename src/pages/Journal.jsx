import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen,
  Upload,
  Loader2,
  Plus,
  ArrowLeft,
  DollarSign,
  Heart,
  Trash2,
  Download,
  FileText,
  Lightbulb,
  CheckCircle2,
  FileUp,
  Image as ImageIcon,
  Filter,
  Search,
  ChevronDown,
  Shield,
  TrendingUp,
  Calendar,
  BarChart3
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from 'date-fns';
import { useMarketSessions } from '@/hooks/useMarketSessions';
import { cn } from "@/lib/utils";
import RegretReplayModal from '@/components/performance/RegretReplayModal';
import ManualEntryForm from '@/components/journal/ManualEntryForm';
import { motion } from "framer-motion";
import CsvUploadPreview from '@/components/journal/CsvUploadPreview';
import PsychologistPanel from '@/components/journal/PsychologistPanel';
import FeedbackForm from '@/components/journal/FeedbackForm';
import TradeLineConfirmation from '@/components/journal/TradeLineConfirmation';
import CoachingChat from '@/components/journal/CoachingChat';
import ConversationHistory from '@/components/journal/ConversationHistory';
import AnalysisSummary from '@/components/journal/AnalysisSummary';
import LoadingAffirmation from '@/components/journal/LoadingAffirmation';
import RuleDisciplinePanel from '@/components/journal/RuleDisciplinePanel';
import ScreenshotsSection from '@/components/journal/ScreenshotsSection';
import JournalRecapDisplay from '@/components/journal/JournalRecapDisplay';
import ImageViewerModal from '@/components/journal/ImageViewerModal';
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

export default function Journal() {
  const { intelligence } = useMarketSessions();
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view');
  const idParam = urlParams.get('id');
  const actionParam = urlParams.get('action');

  const getSessionContextString = () => {
    if (!intelligence || !intelligence.verdict) return '';
    return `\n\n[Session Context: ${intelligence.verdict} | Liquidity: ${intelligence.liquidityScore} | Volatility: ${intelligence.volatility}]`;
  };

  const initialView = viewParam === 'detail' ? 'detail' : actionParam === 'new' ? 'new' : 'history';
  const [view, setView] = useState(initialView);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const dataFileInputRef = useRef(null);
  const [journalNotes, setJournalNotes] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [replayModalOpen, setReplayModalOpen] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [selectedTradeForReplay, setSelectedTradeForReplay] = useState(null);
  const [showPsychologist, setShowPsychologist] = useState(false);
  const [psychologySession, setPsychologySession] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [dailyJournalId, setDailyJournalId] = useState(null);
  const [coachingStage, setCoachingStage] = useState(null);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [loadedCoachingChat, setLoadedCoachingChat] = useState(null);
  const [loadedPsychologistChat, setLoadedPsychologistChat] = useState(null);
  const [isEditingAdditionalNotes, setIsEditingAdditionalNotes] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isProcessingData, setIsProcessingData] = useState(false);
  const [showRuleDiscipline, setShowRuleDiscipline] = useState(false);
  const [ruleDisciplineData, setRuleDisciplineData] = useState(null);
  const [showScreenshots, setShowScreenshots] = useState(false);
  const [beforeScreenshots, setBeforeScreenshots] = useState([]);
  const [afterScreenshots, setAfterScreenshots] = useState([]);
  const [viewingImage, setViewingImage] = useState(null);
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
  const [incompleteEntry, setIncompleteEntry] = useState(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all'); // all | completed | draft
  const [disciplineFilter, setDisciplineFilter] = useState('all'); // all | followed | minor | major
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('all'); // all | 7d | 30d | 90d

  const queryClient = useQueryClient();

  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [hasIncompleteTodayEntry, setHasIncompleteTodayEntry] = useState(false);

  useEffect(() => {
    api.auth.me().then(setCurrentUser).catch(() => { });
  }, []);

  const { data: userAccounts = [] } = useQuery({
    queryKey: ['userAccounts', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await api.entities.TradingAccount.filter({ user_id: currentUser.email });
    },
    enabled: !!currentUser?.email
  });

  useEffect(() => {
    const savedAccountId = localStorage.getItem('selectedAccountId');
    setSelectedAccountId(savedAccountId);

    const handleAccountChange = (e) => {
      setSelectedAccountId(e.detail);
      queryClient.invalidateQueries();
    };

    window.addEventListener('accountChanged', handleAccountChange);
    return () => window.removeEventListener('accountChanged', handleAccountChange);
  }, [queryClient]);

  const isSummaryMode = selectedAccountId === 'SUMMARY_ALL';

  const { data: journalEntries = [], refetch: refetchJournalEntries } = useQuery({
    queryKey: ['journalEntries', currentUser?.email, selectedAccountId],
    queryFn: async () => {
      if (!currentUser?.email || !selectedAccountId) return [];

      if (isSummaryMode) {
        // Aggregate across all real accounts
        const allEntries = await api.entities.JournalEntry.filter({
          created_by: currentUser.email,
          status: 'registered'
        }, '-entry_date', 200);
        // Exclude any SUMMARY_ALL account entries
        return allEntries.filter(e => e.account_id !== 'SUMMARY_ALL');
      }

      return api.entities.JournalEntry.filter({
        created_by: currentUser.email,
        account_id: selectedAccountId
      }, '-entry_date', 50);
    },
    enabled: !!currentUser?.email && !!selectedAccountId,
  });

  const { data: allAccounts = [] } = useQuery({
    queryKey: ['allAccounts', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await api.entities.TradingAccount.filter({ user_id: currentUser.email });
    },
    enabled: !!currentUser?.email && isSummaryMode
  });

  const { data: journalSessions = [] } = useQuery({
    queryKey: ['journalSessions', currentUser?.email, selectedAccountId],
    queryFn: async () => {
      if (!currentUser?.email || !selectedAccountId || isSummaryMode) return [];
      return api.entities.JournalEntrySessions.filter({
        user_id: currentUser.email,
        account_id: selectedAccountId
      });
    },
    enabled: !!currentUser?.email && !!selectedAccountId && !isSummaryMode,
  });

  const { data: journalNotesRecords = [] } = useQuery({
    queryKey: ['journalNotes', currentUser?.email, selectedAccountId],
    queryFn: async () => {
      if (!currentUser?.email || !selectedAccountId || isSummaryMode) return [];
      return api.entities.JournalNotes.filter({
        user_id: currentUser.email,
        account_id: selectedAccountId
      });
    },
    enabled: !!currentUser?.email && !!selectedAccountId && !isSummaryMode,
  });

  const { data: allTrades = [] } = useQuery({
    queryKey: ['trades', currentUser?.email, selectedAccountId],
    queryFn: async () => {
      if (!currentUser?.email || !selectedAccountId || isSummaryMode) return [];
      return api.entities.Trade.filter({
        created_by: currentUser.email,
        account_id: selectedAccountId
      }, '-date', 100);
    },
    enabled: !!currentUser?.email && !!selectedAccountId && !isSummaryMode,
  });

  const { data: uploadAnalyses = [], refetch: refetchUploadAnalyses } = useQuery({
    queryKey: ['uploadAnalyses', currentUser?.email, selectedAccountId, selectedEntry?.entry_date],
    queryFn: async () => {
      if (!currentUser?.email || !selectedAccountId || isSummaryMode) return [];
      const dateKey = selectedEntry?.entry_date || format(new Date(), 'yyyy-MM-dd');
      return api.entities.UploadAnalysis.filter({
        user_id: currentUser.email,
        account_id: selectedAccountId,
        date_key: dateKey
      }, '-created_date', 20);
    },
    enabled: !!currentUser?.email && !!selectedAccountId && !isSummaryMode,
    refetchInterval: 2000,
  });

  const { data: journalRecaps = [] } = useQuery({
    queryKey: ['journalRecaps', currentUser?.email, selectedAccountId],
    queryFn: async () => {
      if (!currentUser?.email || !selectedAccountId) return [];

      if (isSummaryMode) {
        // Fetch recaps for all accounts
        return api.entities.JournalRecaps.filter({
          user_id: currentUser.email
        });
      }

      return api.entities.JournalRecaps.filter({
        user_id: currentUser.email,
        account_id: selectedAccountId
      });
    },
    enabled: !!currentUser?.email && !!selectedAccountId,
  });

  useQuery({
    queryKey: ['incompleteJournalEntries', currentUser?.email, selectedAccountId],
    queryFn: async () => {
      if (!currentUser?.email || !selectedAccountId || isSummaryMode) return [];
      const today = format(new Date(), 'yyyy-MM-dd');
      return api.entities.JournalEntry.filter({
        created_by: currentUser.email,
        account_id: selectedAccountId,
        status: 'incomplete',
        entry_date: today
      }, '-entry_date', 1);
    },
    enabled: !!currentUser?.email && !!selectedAccountId && !isSummaryMode,
    onSuccess: (entries) => {
      setHasIncompleteTodayEntry(entries.length > 0);
      if (entries.length > 0) {
        setIncompleteEntry(entries[0]);
      } else {
        setIncompleteEntry(null);
      }
    }
  });

  // Handle direct navigation from URL
  useEffect(() => {
    if (viewParam === 'detail' && idParam && journalEntries.length > 0) {
      const entry = journalEntries.find(e => e.id === idParam);
      if (entry) {
        setSelectedEntry(entry);
        setView('detail');
      }
    }
  }, [viewParam, idParam, journalEntries]);

  const createEntryMutation = useMutation({
    mutationFn: (data) => api.entities.JournalEntry.create(data),
    onSuccess: (newEntry) => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries', currentUser?.email, selectedAccountId] });
      queryClient.invalidateQueries({ queryKey: ['incompleteJournalEntries', currentUser?.email, selectedAccountId] });
      queryClient.invalidateQueries({ queryKey: ['trades', currentUser?.email, selectedAccountId] });
      queryClient.invalidateQueries({ queryKey: ['accountStats', currentUser?.email, selectedAccountId] });
      setSelectedEntry(newEntry);
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id) => api.entities.JournalEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries', currentUser?.email, selectedAccountId] });
      queryClient.invalidateQueries({ queryKey: ['accountStats', currentUser?.email, selectedAccountId] });
    },
  });

  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  const deleteAllEntriesMutation = useMutation({
    mutationFn: async () => {
      const entriesToDelete = journalEntries;
      await Promise.all(entriesToDelete.map(entry => api.entities.JournalEntry.delete(entry.id)));

      const allAccountTrades = await api.entities.Trade.filter({
        created_by: currentUser.email,
        account_id: selectedAccountId
      });
      await Promise.all(allAccountTrades.map(trade => api.entities.Trade.delete(trade.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries', currentUser?.email, selectedAccountId] });
      queryClient.invalidateQueries({ queryKey: ['trades', currentUser?.email, selectedAccountId] });
      queryClient.invalidateQueries({ queryKey: ['incompleteJournalEntries', currentUser?.email, selectedAccountId] });
      queryClient.invalidateQueries({ queryKey: ['accountStats', currentUser?.email, selectedAccountId] });
      setShowDeleteAllDialog(false);
    },
  });

  const resetSession = () => {
    setUploadedFiles([]);
    setJournalNotes('');
    setShowUploadModal(false);
    setSelectedEntry(null);
    setShowPsychologist(false);
    setPsychologySession(null);
    setCsvData(null);
    setShowFeedback(false);
    setExtractedData(null);
    setShowConfirmation(false);
    setDailyJournalId(null);
    setCoachingStage(null);
    setShowActionButtons(false);
    setLoadedCoachingChat(null);
    setLoadedPsychologistChat(null);
    setIsEditingAdditionalNotes(false);
    setAdditionalNotes('');
    setShowRuleDiscipline(false);
    setRuleDisciplineData(null);
    setShowScreenshots(false);
    setBeforeScreenshots([]);
    setAfterScreenshots([]);
  };

  const handleMultipleImageUpload = async (files, fileType = 'PNL_IMAGE', dateKey = null) => {
    if (!files || files.length === 0) return;

    const targetDate = dateKey || selectedEntry?.entry_date || format(new Date(), 'yyyy-MM-dd');
    setShowUploadModal(false);

    const filesToUpload = Array.from(files).map(f => ({
      name: f.name,
      status: 'uploading',
      type: 'image',
      file: f
    }));

    setUploadedFiles(prev => [...prev, ...filesToUpload]);
    setIsProcessingData(true);

    try {
      const uploadPromises = Array.from(files).map(file =>
        api.integrations.Core.UploadFile({ file })
      );

      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);

      // Create or get journal entry immediately if not exists
      let journalEntryIdToUse = selectedEntry?.id;
      if (!journalEntryIdToUse) {
        const sessionTag = targetDate === format(new Date(), 'yyyy-MM-dd') ? getSessionContextString() : '';
        const newEntry = await api.entities.JournalEntry.create({
          entry_date: targetDate,
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
          journal_notes: sessionTag,
          status: 'incomplete'
        });
        setSelectedEntry(newEntry);
        journalEntryIdToUse = newEntry.id;
      }

      for (let i = 0; i < results.length; i++) {
        await api.entities.UploadAnalysis.create({
          user_id: currentUser.email,
          account_id: selectedAccountId,
          date_key: targetDate,
          journal_entry_id: journalEntryIdToUse,
          file_type: fileType,
          original_file_url: results[i].file_url,
          file_name: Array.from(files)[i].name,
          status: 'PROCESSING'
        });
      }

      await refetchUploadAnalyses();

      setUploadedFiles(prev => prev.map((f, i) => {
        const matchingFile = filesToUpload.find(fu => fu.name === f.name);
        const matchingResult = matchingFile ? results[filesToUpload.indexOf(matchingFile)] : null;
        return matchingResult && f.status === 'uploading' ? { ...f, status: 'processing', url: matchingResult.file_url } : f;
      }));

      const analysisPrompt = `Analyze these P&L screenshots. Extract visible data only.

Return JSON:
{
  "total_pnl_currency": number (net P&L visible),
  "currency_code": string or null (currency code like "USD", "EUR", "GBP" if visible, otherwise null),
  "trades_count": number or null (if not visible),
  "wins": number or null,
  "losses": number or null,
  "largest_win": number or null,
  "largest_loss": number or null,
  "trade_lines": [
    {"symbol": "string or empty", "side": "BUY/SELL", "pnl_currency": number}
  ] (empty array if individual trades not visible)
}`;

      const extracted = await api.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        file_urls: urls,
        response_json_schema: {
          type: "object",
          properties: {
            total_pnl_currency: { type: "number" },
            currency_code: { type: ["string", "null"] },
            trades_count: { type: ["number", "null"] },
            wins: { type: ["number", "null"] },
            losses: { type: ["number", "null"] },
            largest_win: { type: ["number", "null"] },
            largest_loss: { type: ["number", "null"] },
            trade_lines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  symbol: { type: "string" },
                  side: { type: "string" },
                  pnl_currency: { type: "number" }
                }
              }
            }
          }
        }
      });

      const summaryLines = [];
      if (extracted.total_pnl_currency !== undefined) {
        summaryLines.push(`Net P&L: $${Number(extracted.total_pnl_currency).toFixed(2)}`);
      }
      if (extracted.trades_count) {
        summaryLines.push(`${extracted.trades_count} trades detected`);
      }
      if (extracted.wins !== null && extracted.losses !== null) {
        summaryLines.push(`${extracted.wins} wins, ${extracted.losses} losses`);
      }
      if (extracted.trade_lines?.length > 0) {
        summaryLines.push(`${extracted.trade_lines.length} individual trade lines extracted`);
      }

      const analyses = await api.entities.UploadAnalysis.filter({
        user_id: currentUser.email,
        account_id: selectedAccountId,
        date_key: targetDate,
        status: 'PROCESSING'
      });

      for (const analysis of analyses) {
        await api.entities.UploadAnalysis.update(analysis.id, {
          status: 'COMPLETE',
          extracted_json: extracted,
          extracted_summary: summaryLines.join('\n')
        });
      }

      setUploadedFiles(prev => prev.map(f =>
        f.status === 'processing' ? { ...f, status: 'analyzed' } : f
      ));

      setExtractedData(extracted);
      setShowConfirmation(true);

      await refetchUploadAnalyses();

    } catch (error) {
      console.error('Upload error:', error);
      setUploadedFiles(prev => prev.filter(f => f.status !== 'uploading' && f.status !== 'processing'));
      alert('Failed to process images');
    } finally {
      setIsProcessingData(false);
    }
  };

  const handleDataFileUpload = async (file, fileType = 'CSV', dateKey = null) => {
    if (!file) return;

    const targetDate = dateKey || selectedEntry?.entry_date || format(new Date(), 'yyyy-MM-dd');
    const fileExt = file.name.split('.').pop().toLowerCase();

    if (fileExt === 'csv' || fileType === 'CSV') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const rows = lines.slice(1).map(line => {
          const values = line.split(',');
          const row = {};
          headers.forEach((h, i) => {
            row[h] = values[i]?.trim() || '';
          });
          return row;
        });

        await api.entities.UploadAnalysis.create({
          user_id: currentUser.email,
          account_id: selectedAccountId,
          date_key: targetDate,
          journal_entry_id: selectedEntry?.id,
          file_type: 'CSV',
          original_file_url: '',
          file_name: file.name,
          status: 'COMPLETE',
          extracted_json: { preview_rows: rows.slice(0, 20), headers, total_rows: rows.length },
          extracted_summary: `CSV file with ${rows.length} rows detected\nHeaders: ${headers.join(', ')}\nReady for field mapping`
        });

        setCsvData(rows);
        await refetchUploadAnalyses();
      };
      reader.readAsText(file);
      setShowUploadModal(false);
      return;
    }

    setUploading(true);
    setShowUploadModal(false);
    setIsProcessingData(true);

    const uploadFile = { name: file.name, status: 'uploading', type: 'data' };
    setUploadedFiles(prev => [...prev, uploadFile]);

    let analysis;

    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });

      analysis = await api.entities.UploadAnalysis.create({
        user_id: currentUser.email,
        account_id: selectedAccountId,
        date_key: targetDate,
        journal_entry_id: selectedEntry?.id,
        file_type: fileType,
        original_file_url: file_url,
        file_name: file.name,
        status: 'PROCESSING'
      });

      await refetchUploadAnalyses();

      setUploadedFiles(prev => prev.map(f =>
        f.name === file.name ? { ...f, status: 'processing', url: file_url } : f
      ));

      const analysisPrompt = fileType === 'PDF'
        ? `Extract trading data from this PDF. If it contains a table with trade data, extract:
- Net P&L (currency)
- Trade lines (symbol, side, P&L) if visible
- Totals, wins/losses if visible

If the PDF is not machine-readable or lacks structured data, explain what you see and what's missing.

Return JSON with: total_pnl_currency (number or null), trades_count (number or null), wins/losses (number or null), trade_lines (array), notes (string)`
        : `Extract trade data from this ${fileType} file. Return JSON with trades array and summary.`;

      const extractedData = await api.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            trades: { type: "array", items: { type: "object" } },
            summary: { type: "object" },
            total_pnl_currency: { type: ["number", "null"] },
            trades_count: { type: ["number", "null"] },
            wins: { type: ["number", "null"] },
            losses: { type: ["number", "null"] },
            trade_lines: { type: "array" },
            notes: { type: "string" }
          }
        }
      });

      const summaryLines = [];
      if (extractedData.total_pnl_currency !== null && extractedData.total_pnl_currency !== undefined) {
        summaryLines.push(`Net P&L: $${Number(extractedData.total_pnl_currency).toFixed(2)}`);
      }
      if (extractedData.trades_count) {
        summaryLines.push(`${extractedData.trades_count} trades detected`);
      }
      if (extractedData.trades?.length > 0) {
        summaryLines.push(`${extractedData.trades.length} trade records extracted`);
      }
      if (extractedData.trade_lines?.length > 0) {
        summaryLines.push(`${extractedData.trade_lines.length} individual trade lines found`);
      }
      if (extractedData.notes) {
        summaryLines.push(extractedData.notes);
      }

      if (summaryLines.length === 0) {
        summaryLines.push('No structured trade data found in this file');
        summaryLines.push('Consider uploading a screenshot of the P&L page instead');
      }

      await api.entities.UploadAnalysis.update(analysis.id, {
        status: summaryLines.some(line => line.includes('No structured')) ? 'ERROR' : 'COMPLETE',
        extracted_json: extractedData,
        extracted_summary: summaryLines.join('\n'),
        error_message: summaryLines.some(line => line.includes('No structured'))
          ? 'Could not extract structured trade data from this file'
          : null
      });

      setUploadedFiles(prev => prev.map(f =>
        f.name === file.name ? { ...f, status: 'analyzed', data: extractedData.summary } : f
      ));

      await refetchUploadAnalyses();
    } catch (error) {
      console.error('File upload error:', error);

      if (analysis?.id) {
        await api.entities.UploadAnalysis.update(analysis.id, {
          status: 'ERROR',
          error_message: error.message || 'Failed to process file'
        });
      }

      setUploadedFiles(prev => prev.filter(f => f.name !== file.name));
      await refetchUploadAnalyses();
    } finally {
      setUploading(false);
      setIsProcessingData(false);
    }
  };

  const handleConfirmExtraction = async (confirmedData) => {
    const todayDate = format(new Date(), 'yyyy-MM-dd');
    setIsProcessingData(true);

    try {
      // Step 1: Create or update journal entry with confirmed data
      const uploadedUrls = uploadedFiles
        .filter(f => f.type === 'image' && f.url)
        .map(f => f.url);

      let journalEntry;
      if (selectedEntry?.id) {
        // Update existing entry with confirmed P&L data and screenshots
        await api.entities.JournalEntry.update(selectedEntry.id, {
          uploaded_pnl_screenshots: uploadedUrls,
          daily_pnl: confirmedData.total_pnl_currency,
          trade_count: confirmedData.trades_count,
          wins: confirmedData.wins,
          losses: confirmedData.losses
        });
        journalEntry = {
          ...selectedEntry,
          uploaded_pnl_screenshots: uploadedUrls,
          daily_pnl: confirmedData.total_pnl_currency,
          trade_count: confirmedData.trades_count,
          wins: confirmedData.wins,
          losses: confirmedData.losses
        };
        setSelectedEntry(journalEntry);
      } else {
        const sessionTag = todayDate === format(new Date(), 'yyyy-MM-dd') ? getSessionContextString() : '';
        journalEntry = await createEntryMutation.mutateAsync({
          entry_date: todayDate,
          account_id: selectedAccountId,
          uploaded_pnl_screenshots: uploadedUrls,
          before_screenshots: [],
          after_screenshots: [],
          daily_pnl: confirmedData.total_pnl_currency,
          trade_count: confirmedData.trades_count,
          wins: confirmedData.wins,
          losses: confirmedData.losses,
          coach_conversation: [],
          psychologist_conversation: [],
          journal_notes: sessionTag,
          status: 'incomplete'
        });
      }

      // Step 2: Save trade lines linked to journal_entry_id
      await api.entities.TradeEntries.bulkCreate(
        confirmedData.trade_lines.map(line => ({
          user_id: currentUser.email,
          account_id: selectedAccountId,
          journal_entry_id: journalEntry.id,
          date_key: todayDate,
          symbol: line.symbol,
          side: line.side,
          pnl_currency: line.pnl_currency,
          source: 'SCREENSHOT_IMPORT'
        }))
      );

      // Step 3: Update existing summary trade or create new
      const existingSummaryTrades = await api.entities.Trade.filter({
        date: todayDate,
        account_id: selectedAccountId,
        symbol: 'Daily P&L'
      });

      if (existingSummaryTrades.length > 0) {
        await api.entities.Trade.update(existingSummaryTrades[0].id, {
          pnl_amount: confirmedData.total_pnl_currency,
          notes: `${confirmedData.trades_count} trades`
        });
      } else {
        await api.entities.Trade.create({
          date: todayDate,
          account_id: selectedAccountId,
          symbol: 'Daily P&L',
          asset_class: 'Summary',
          direction: confirmedData.total_pnl_currency >= 0 ? 'Buy' : 'Sell',
          pnl_amount: confirmedData.total_pnl_currency,
          notes: `${confirmedData.trades_count} trades`
        });
      }

      setShowConfirmation(false);
      setShowRuleDiscipline(true);

      await queryClient.invalidateQueries({ queryKey: ['accountStats', currentUser.email, selectedAccountId] });
      await queryClient.invalidateQueries({ queryKey: ['journalEntries', currentUser.email, selectedAccountId] });
      await queryClient.invalidateQueries({ queryKey: ['trades', currentUser.email, selectedAccountId] });
      await refetchJournalEntries();
    } catch (error) {
      console.error('Failed to confirm:', error);
      alert('Failed to save data');
    } finally {
      setIsProcessingData(false);
    }
  };

  const handleCsvImport = async (mapping) => {
    if (!csvData) return;

    setIsProcessingData(true);

    try {
      const trades = csvData.map(row => ({
        date: row[mapping.date] || format(new Date(), 'yyyy-MM-dd'),
        time: mapping.time ? row[mapping.time] : '',
        symbol: row[mapping.symbol]?.toUpperCase() || 'Unknown',
        direction: row[mapping.side]?.toLowerCase().includes('buy') ? 'Buy' : 'Sell',
        pnl_amount: parseFloat(row[mapping.pnl]) || 0,
        notes: mapping.notes ? row[mapping.notes] : '',
        asset_class: 'Futures',
        account_id: selectedAccountId
      }));

      await api.entities.Trade.bulkCreate(trades);

      const totalPnl = trades.reduce((sum, t) => sum + t.pnl_amount, 0);
      const winCount = trades.filter(t => t.pnl_amount > 0).length;
      const lossCount = trades.filter(t => t.pnl_amount < 0).length;
      const todayDate = format(new Date(), 'yyyy-MM-dd');

      await createEntryMutation.mutateAsync({
        entry_date: todayDate,
        account_id: selectedAccountId,
        chart_screenshots: [],
        daily_pnl: totalPnl,
        trade_count: trades.length,
        wins: winCount,
        losses: lossCount,
        conversation: [],
        journal_notes: `Imported ${trades.length} trades from CSV`,
        status: 'incomplete'
      });

      setCsvData(null);
      queryClient.invalidateQueries({ queryKey: ['accountStats', currentUser.email, selectedAccountId] });
      queryClient.invalidateQueries({ queryKey: ['journalEntries', currentUser.email, selectedAccountId] });
      queryClient.invalidateQueries({ queryKey: ['trades', currentUser.email, selectedAccountId] });
    } finally {
      setIsProcessingData(false);
    }
  };

  const handleRuleDisciplineComplete = async (data) => {
    if (!selectedEntry?.id) {
      console.error('No journal entry selected for rule discipline save');
      alert('Session lost. Please start over.');
      resetSession();
      setView('history');
      return;
    }

    setRuleDisciplineData(data);

    // Save rule discipline data to entry immediately
    try {
      await api.entities.JournalEntry.update(selectedEntry.id, {
        rule_status: data.rule_status,
        rules_broken: data.rules_broken || [],
        rule_explanation: data.rule_explanation || ''
      });

      setSelectedEntry(prev => ({
        ...prev,
        rule_status: data.rule_status,
        rules_broken: data.rules_broken || [],
        rule_explanation: data.rule_explanation || ''
      }));

      await queryClient.invalidateQueries({ queryKey: ['journalEntries', currentUser.email, selectedAccountId] });
    } catch (error) {
      console.error('Failed to save rule discipline:', error);
      alert('Failed to save rule discipline. Please try again.');
      return;
    }

    setShowRuleDiscipline(false);
    setCoachingStage('ASKING');
  };

  const handleCoachingComplete = async () => {
    if (!selectedEntry?.id) {
      console.error('No journal entry for coaching completion');
      alert('Session lost. Please start over.');
      resetSession();
      setView('history');
      return;
    }

    setCoachingStage('COMPLETE');

    const dateKey = selectedEntry.entry_date;
    const coachingChats = await api.entities.JournalCoachingChats.filter({
      journal_entry_id: selectedEntry.id
    });

    if (coachingChats.length > 0) {
      setSelectedEntry(prev => ({
        ...prev,
        coach_conversation: coachingChats[0].messages_json
      }));
      setLoadedCoachingChat(coachingChats[0]);

      // Update journal entry with coach conversation
      try {
        await api.entities.JournalEntry.update(selectedEntry.id, {
          coach_conversation: coachingChats[0].messages_json
        });
        await queryClient.invalidateQueries({ queryKey: ['journalEntries', currentUser.email, selectedAccountId] });
      } catch (error) {
        console.error('Failed to update journal entry with coach conversation:', error);
      }
    }

    setShowScreenshots(true);
  };

  const handleOpenPsychologist = async () => {
    if (selectedEntry?.id && currentUser?.email) {
      const existing = await api.entities.PsychologistChats.filter({
        journal_entry_id: selectedEntry.id
      });

      if (existing.length > 0) {
        setLoadedPsychologistChat(existing[0]);
      }
    }

    setShowPsychologist(true);
  };

  const handleSavePsychologySession = async (sessionData) => {
    if (!selectedEntry?.id) {
      console.error('No journal entry for psychology session save');
      alert('Session lost. Please start over.');
      setShowPsychologist(false);
      resetSession();
      setView('history');
      return;
    }

    try {
      if (sessionData.id) {
        await api.entities.PsychologistChats.update(sessionData.id, {
          session_summary: sessionData.summary,
          coping_plan: sessionData.tomorrowPlan,
          ended_at: new Date().toISOString()
        });
      } else {
        await api.entities.PsychologistChats.create({
          user_id: currentUser.email,
          account_id: selectedAccountId,
          journal_entry_id: selectedEntry.id,
          date_key: selectedEntry.entry_date,
          messages_json: sessionData.messages,
          session_summary: sessionData.summary,
          coping_plan: sessionData.tomorrowPlan,
          ended_at: new Date().toISOString()
        });
      }

      setPsychologySession(sessionData);
      setShowPsychologist(false);
      setShowActionButtons(true);

      const psychChats = await api.entities.PsychologistChats.filter({
        journal_entry_id: selectedEntry.id
      });

      if (psychChats.length > 0) {
        // Update journal entry with psychologist data
        await api.entities.JournalEntry.update(selectedEntry.id, {
          psychologist_conversation: psychChats[0].messages_json,
          psychology_snapshot: psychChats[0].session_summary
        });

        setSelectedEntry(prev => ({
          ...prev,
          psychologist_conversation: psychChats[0].messages_json,
          psychology_snapshot: psychChats[0].session_summary
        }));
        setLoadedPsychologistChat(psychChats[0]);

        await queryClient.invalidateQueries({ queryKey: ['journalEntries', currentUser.email, selectedAccountId] });
      }
    } catch (error) {
      console.error('Failed to save psychology session:', error);
      alert('Failed to save session. Please try again.');
    }
  };

  const handleScreenshotsContinue = async () => {
    if (!selectedEntry?.id) {
      console.error('No journal entry selected');
      alert('Session expired. Please start a new entry.');
      resetSession();
      setView('history');
      return;
    }

    try {
      await api.entities.JournalEntry.update(selectedEntry.id, {
        before_screenshots: beforeScreenshots,
        after_screenshots: afterScreenshots
      });

      setSelectedEntry(prev => ({
        ...prev,
        before_screenshots: beforeScreenshots,
        after_screenshots: afterScreenshots
      }));

      await queryClient.invalidateQueries({ queryKey: ['journalEntries', currentUser.email, selectedAccountId] });

      setShowScreenshots(false);
      setShowActionButtons(true);
    } catch (error) {
      console.error('Failed to save screenshots:', error);
      alert('Failed to save evidence. Please try again.');
    }
  };

  const handleSubmitEntry = async () => {
    if (!selectedEntry?.id) {
      console.error('No journal entry selected for submission');
      alert('Session expired. Please start over.');
      resetSession();
      setView('history');
      return;
    }

    setIsProcessingData(true);

    try {
      // Fetch all linked data by journal_entry_id
      const coachingChats = await api.entities.JournalCoachingChats.filter({
        journal_entry_id: selectedEntry.id
      });

      const coachConversation = coachingChats.length > 0 ? coachingChats[0].messages_json : [];

      const psychChats = await api.entities.PsychologistChats.filter({
        journal_entry_id: selectedEntry.id
      });

      const psychConversation = psychChats.length > 0 ? psychChats[0].messages_json : [];
      const psychSummary = psychChats.length > 0 ? psychChats[0].session_summary : '';

      // Verify trade lines exist
      const tradeLines = await api.entities.TradeEntries.filter({
        journal_entry_id: selectedEntry.id
      });

      if (tradeLines.length === 0) {
        alert('No trade lines found. Please go back and confirm your trade data.');
        setIsProcessingData(false);
        return;
      }

      // Ensure all data is persisted to entry
      const updateData = {
        journal_notes: journalNotes,
        psychology_snapshot: psychSummary,
        coach_conversation: coachConversation,
        psychologist_conversation: psychConversation,
        before_screenshots: beforeScreenshots,
        after_screenshots: afterScreenshots,
        rule_status: ruleDisciplineData?.rule_status || selectedEntry.rule_status || 'NONE',
        rules_broken: ruleDisciplineData?.rules_broken || selectedEntry.rules_broken || [],
        rule_explanation: ruleDisciplineData?.rule_explanation || selectedEntry.rule_explanation || '',
        status: 'registered'
      };

      // Generate AI summary of rule discipline
      if (ruleDisciplineData || selectedEntry.rule_status) {
        const summaryPrompt = `Provide a brief 1-2 sentence summary of the trader's rule discipline status:
  - Status: ${ruleDisciplineData?.rule_status || selectedEntry.rule_status || 'NONE'}
  - Rules Broken: ${(ruleDisciplineData?.rules_broken || selectedEntry.rules_broken || []).join(', ') || 'None'}
  - Explanation: ${ruleDisciplineData?.rule_explanation || selectedEntry.rule_explanation || 'No explanation provided'}

  Keep it concise and professional.`;

        const summaryResult = await api.integrations.Core.InvokeLLM({
          prompt: summaryPrompt
        });
        updateData.ai_advice = summaryResult;
      }

      // Save updated entry
      await api.entities.JournalEntry.update(selectedEntry.id, updateData);

      // Invalidate queries
      await refetchJournalEntries();
      await queryClient.invalidateQueries({ queryKey: ['accountStats', currentUser.email, selectedAccountId] });
      await queryClient.invalidateQueries({ queryKey: ['journalEntries', currentUser.email, selectedAccountId] });
      await queryClient.invalidateQueries({ queryKey: ['trades', currentUser.email, selectedAccountId] });

      // Trigger recap generation via backend function
      try {
        await api.functions.invoke('generateJournalRecap', {
          journal_entry_id: selectedEntry.id,
          account_id: selectedAccountId
        });
      } catch (recapError) {
        console.error('Recap generation failed, but entry saved:', recapError);
      }

      setIsProcessingData(false);
      resetSession();
      setView('history');
    } catch (error) {
      console.error('Failed to submit entry:', error);
      alert('Failed to save entry. Your work is still on screen. Please retry.');
      setIsProcessingData(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Daily P&L', 'Journal Notes', 'Psychology Snapshot'];
    const rows = journalEntries.map(entry => [
      format(new Date(entry.entry_date), 'yyyy-MM-dd'),
      format(new Date(entry.created_date), 'HH:mm:ss'),
      entry.daily_pnl || '',
      entry.journal_notes || '',
      entry.psychology_snapshot || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;

    doc.setFontSize(18);
    doc.text('Trading Journal Export', margin, yPos);
    yPos += 15;

    doc.setFontSize(10);
    doc.text(`Exported: ${format(new Date(), 'PPP')}`, margin, yPos);
    yPos += 15;

    journalEntries.forEach((entry, idx) => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Entry ${idx + 1}: ${format(new Date(entry.entry_date), 'PPP')}`, margin, yPos);
      yPos += lineHeight;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');

      if (entry.daily_pnl !== null && entry.daily_pnl !== undefined) {
        doc.text(`P&L: $${entry.daily_pnl.toFixed(2)}`, margin, yPos);
        yPos += lineHeight;
      }

      if (entry.journal_notes) {
        doc.text('Journal Notes:', margin, yPos);
        yPos += lineHeight;
        const notesLines = doc.splitTextToSize(entry.journal_notes, 170);
        doc.text(notesLines, margin + 5, yPos);
        yPos += notesLines.length * lineHeight;
      }

      yPos += 10;
    });

    doc.save(`journal_export_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const [editingNotes, setEditingNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }) => api.entities.JournalEntry.update(id, { journal_notes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries', currentUser?.email, selectedAccountId] });
      setIsEditingNotes(false);
    },
  });

  const handleSaveNotes = () => {
    if (selectedEntry) {
      updateNotesMutation.mutate({ id: selectedEntry.id, notes: editingNotes });
      setSelectedEntry({ ...selectedEntry, journal_notes: editingNotes });
    }
  };

  // Auto-populate session context when starting a new entry
  useEffect(() => {
    if (view === 'new' && !journalNotes && !selectedEntry) {
      setJournalNotes(getSessionContextString());
    }
  }, [view, selectedEntry, journalNotes]);

  useEffect(() => {
    const loadChats = async () => {
      if (view !== 'detail' || !selectedEntry?.id || !currentUser?.email || !selectedAccountId) return;

      try {
        // Load by journal_entry_id for guaranteed linkage
        const coachingChats = await api.entities.JournalCoachingChats.filter({
          journal_entry_id: selectedEntry.id
        });

        const psychChats = await api.entities.PsychologistChats.filter({
          journal_entry_id: selectedEntry.id
        });

        const additionalNotesRecords = await api.entities.JournalNotes.filter({
          journal_entry_id: selectedEntry.id
        });

        const tradeLines = await api.entities.TradeEntries.filter({
          journal_entry_id: selectedEntry.id
        });

        if (coachingChats.length > 0) setLoadedCoachingChat(coachingChats[0]);
        if (psychChats.length > 0) setLoadedPsychologistChat(psychChats[0]);
        if (additionalNotesRecords.length > 0) setAdditionalNotes(additionalNotesRecords[0].notes_text);
      } catch (error) {
        console.error('Error loading journal data:', error);
      }
    };

    loadChats();
  }, [view, selectedEntry?.id, currentUser?.email, selectedAccountId]);

  // Load existing data when selecting an incomplete entry
  useEffect(() => {
    const loadIncompleteEntryData = async () => {
      if (view !== 'new' || !selectedEntry?.id || !currentUser?.email || !selectedAccountId) return;

      try {
        // Load by journal_entry_id
        const coachingChats = await api.entities.JournalCoachingChats.filter({
          journal_entry_id: selectedEntry.id
        });

        const psychChats = await api.entities.PsychologistChats.filter({
          journal_entry_id: selectedEntry.id
        });

        const tradeLines = await api.entities.TradeEntries.filter({
          journal_entry_id: selectedEntry.id
        });

        if (coachingChats.length > 0) setLoadedCoachingChat(coachingChats[0]);
        if (psychChats.length > 0) setLoadedPsychologistChat(psychChats[0]);

        // Set states from selectedEntry
        setJournalNotes(selectedEntry.journal_notes || '');
        setBeforeScreenshots(selectedEntry.before_screenshots || []);
        setAfterScreenshots(selectedEntry.after_screenshots || []);

        if (selectedEntry.rule_status && selectedEntry.rule_status !== 'NONE') {
          setRuleDisciplineData({
            rule_status: selectedEntry.rule_status,
            rules_broken: selectedEntry.rules_broken || [],
            rule_explanation: selectedEntry.rule_explanation || ''
          });
        }

      } catch (error) {
        console.error('Error loading entry data:', error);
      }
    };

    loadIncompleteEntryData();
  }, [view, selectedEntry?.id, currentUser?.email, selectedAccountId]);

  if (isProcessingData) {
    return <LoadingAffirmation message="Saving your trading data..." />;
  }

  if (view === 'detail' && selectedEntry) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pointer-events-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                setView('history');
                setSelectedEntry(null);
                setIsEditingNotes(false);
                setLoadedCoachingChat(null);
                setLoadedPsychologistChat(null);
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Journal Entry (Read-Only)</h1>
              <p className="text-sm text-muted-foreground">
                {selectedEntry.entry_date ? format(new Date(selectedEntry.entry_date), 'EEEE, MMMM d, yyyy') : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {selectedEntry.status === 'registered' && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Journal Recap</h2>
            <JournalRecapDisplay
              journalEntryId={selectedEntry.id}
              userId={currentUser?.email}
              accountId={selectedAccountId}
            />
          </div>
        )}

        <div className="glass-card rounded-lg border border-border overflow-hidden">
          {selectedEntry.rule_status && selectedEntry.rule_status !== 'NONE' && (
            <div className={cn(
              "border-b border-border p-6",
              selectedEntry.rule_status === 'MAJOR' ? "bg-red-50" : "bg-yellow-50"
            )}>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                {selectedEntry.rule_status === 'MAJOR' ? '🔴' : '⚠️'} Rule Discipline
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status: </span>
                  <span className={cn(
                    "text-sm font-medium",
                    selectedEntry.rule_status === 'MAJOR' ? "text-red-700" : "text-yellow-700"
                  )}>
                    {selectedEntry.rule_status === 'MAJOR' ? 'Major rule break' : 'Minor deviation'}
                  </span>
                </div>
                {selectedEntry.rules_broken && selectedEntry.rules_broken.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rules Broken: </span>
                    <span className="text-sm text-foreground">{selectedEntry.rules_broken.join(', ')}</span>
                  </div>
                )}
                {selectedEntry.rule_explanation && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Explanation: </span>
                    <p className="text-sm text-foreground leading-relaxed">{selectedEntry.rule_explanation}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedEntry.uploaded_pnl_screenshots && selectedEntry.uploaded_pnl_screenshots.length > 0 && (
            <div className="border-b border-border p-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">📊 Uploaded P&L Screenshots</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedEntry.uploaded_pnl_screenshots.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`P&L ${idx + 1}`}
                    className="rounded-lg max-h-64 object-contain border border-border cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setViewingImage(url)}
                  />
                ))}
              </div>
            </div>
          )}

          {selectedEntry.before_screenshots && selectedEntry.before_screenshots.length > 0 && (
            <div className="border-b border-border p-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">📊 Before Charts</h4>
              <div className="space-y-3">
                {selectedEntry.before_screenshots.map((screenshot, idx) => (
                  <div key={idx}>
                    <img
                      src={screenshot.url}
                      alt={`Before ${idx + 1}`}
                      className="rounded-lg max-h-64 object-contain mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setViewingImage(screenshot.url)}
                    />
                    {screenshot.comment && (
                      <p className="text-sm text-muted-foreground italic">{screenshot.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedEntry.after_screenshots && selectedEntry.after_screenshots.length > 0 && (
            <div className="border-b border-border p-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">💰 After Results</h4>
              <div className="space-y-3">
                {selectedEntry.after_screenshots.map((screenshot, idx) => (
                  <div key={idx}>
                    <img
                      src={screenshot.url}
                      alt={`After ${idx + 1}`}
                      className="rounded-lg max-h-64 object-contain mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setViewingImage(screenshot.url)}
                    />
                    {screenshot.comment && (
                      <p className="text-sm text-muted-foreground italic">{screenshot.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 border-b border-border">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              Journal Notes
            </h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {selectedEntry.journal_notes || 'No notes yet'}
            </p>
          </div>

          <div className="p-4 bg-muted/50 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Daily P&L</p>
              {selectedEntry.daily_pnl !== null && selectedEntry.daily_pnl !== undefined ? (
                <p className={cn(
                  "text-lg font-bold",
                  selectedEntry.daily_pnl >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {selectedEntry.daily_pnl >= 0 ? '+' : ''}${Number(selectedEntry.daily_pnl).toFixed(2)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Not specified</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Psychology</p>
              <p className="text-sm text-muted-foreground">{selectedEntry.psychology_snapshot || 'No summary'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Conversation History</h3>
          <ConversationHistory
            coachingChat={loadedCoachingChat}
            psychologistChat={loadedPsychologistChat}
          />
        </div>

        {uploadAnalyses.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Upload Analysis</h3>
            <div className="space-y-3">
              {uploadAnalyses.map((analysis) => (
                <AnalysisSummary
                  key={analysis.id}
                  analysis={analysis}
                  onConfirm={(analysis) => {
                    setExtractedData(analysis.extracted_json);
                    setShowConfirmation(true);
                  }}
                  onReanalyze={async (analysis) => {
                    await api.entities.UploadAnalysis.update(analysis.id, {
                      status: 'PROCESSING'
                    });
                    await refetchUploadAnalyses();
                  }}
                  onDelete={async (analysisId) => {
                    await api.entities.UploadAnalysis.delete(analysisId);
                    await refetchUploadAnalyses();
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {selectedEntry.status === 'registered' && additionalNotes && (
          <div className="glass-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Additional Notes</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {additionalNotes}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (view === 'new') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setView('history')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Trading Journal</h1>
            <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>

        {uploadedFiles.length === 0 && !uploading && !csvData && !selectedEntry && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className={cn(
                  "glass-card rounded-2xl p-12 bg-card border border-border text-center cursor-pointer hover:border-blue-300 transition-all hover:shadow-lg"
                )}
                onClick={() => setShowUploadModal(true)}
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4 border border-blue-200">
                  <Upload className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Upload Trading Data</h3>
                <p className="text-muted-foreground">Upload screenshots or CSV files</p>
              </div>

              <div
                className={cn(
                  "glass-card rounded-2xl p-12 bg-card border border-border text-center cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg"
                )}
                onClick={() => setShowManualEntry(true)}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <PenTool className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Manual Entry</h3>
                <p className="text-muted-foreground">Log a trade with full context</p>
              </div>
            </div>

            {showUploadModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowUploadModal(false)}>
                <div className="bg-card rounded-2xl p-8 max-w-md w-full border border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-xl font-bold mb-6 text-foreground">Upload Trading Data</h3>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleMultipleImageUpload(e.target.files)}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={(e) => handleMultipleImageUpload(e.target.files)}
                    className="hidden"
                  />
                  <input
                    ref={dataFileInputRef}
                    type="file"
                    accept=".pdf,.xlsx,.xls,.csv"
                    onChange={(e) => handleDataFileUpload(e.target.files[0])}
                    className="hidden"
                  />

                  <div className="space-y-3">
                    <Button
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full bg-primary text-primary-foreground font-semibold h-14"
                    >
                      <Upload className="w-5 h-5 mr-3" />
                      Take Photos
                    </Button>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full border-border h-14"
                    >
                      <Upload className="w-5 h-5 mr-3" />
                      Upload Screenshots
                    </Button>
                    <Button
                      onClick={() => dataFileInputRef.current?.click()}
                      variant="outline"
                      className="w-full border-border h-14"
                    >
                      <FileText className="w-5 h-5 mr-3" />
                      Upload CSV/PDF
                    </Button>
                    <Button
                      onClick={() => setShowUploadModal(false)}
                      variant="ghost"
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Uploaded Files</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="glass-card rounded-lg border border-border p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      file.status === 'uploading' && "bg-primary/10",
                      file.status === 'processing' && "bg-yellow-50",
                      file.status === 'analyzed' && "bg-green-50"
                    )}>
                      {file.type === 'image' ? <ImageIcon className="w-5 h-5 text-muted-foreground" /> : <FileUp className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className={cn(
                        "text-xs mt-1",
                        file.status === 'uploading' && "text-primary",
                        file.status === 'processing' && "text-yellow-600",
                        file.status === 'analyzed' && "text-green-600"
                      )}>
                        {file.status === 'uploading' && 'Uploading...'}
                        {file.status === 'processing' && 'Processing...'}
                        {file.status === 'analyzed' && 'Analyzed'}
                      </p>
                    </div>
                  </div>
                  {file.url && file.type === 'image' && (
                    <img src={file.url} alt="Upload" className="mt-3 rounded-lg w-full h-32 object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {csvData && (
          <CsvUploadPreview
            csvData={csvData}
            onImport={handleCsvImport}
            onCancel={() => setCsvData(null)}
          />
        )}

        {showConfirmation && extractedData && (
          <TradeLineConfirmation
            extractedData={extractedData}
            onConfirm={handleConfirmExtraction}
            onCancel={() => {
              setShowConfirmation(false);
              setExtractedData(null);
            }}
          />
        )}

        {showRuleDiscipline && (
          <RuleDisciplinePanel
            onComplete={handleRuleDisciplineComplete}
            initialData={ruleDisciplineData}
          />
        )}

        {coachingStage === 'ASKING' && selectedEntry?.id && (
          <CoachingChat
            userId={currentUser?.email}
            dateKey={selectedEntry.entry_date}
            accountId={selectedAccountId}
            journalEntryId={selectedEntry.id}
            journalData={{
              trades_count: selectedEntry.trade_count || 0,
              total_pnl_currency: selectedEntry.daily_pnl || 0,
              wins: selectedEntry.wins || 0,
              losses: selectedEntry.losses || 0
            }}
            ruleDisciplineData={ruleDisciplineData}
            onComplete={handleCoachingComplete}
          />
        )}

        {showScreenshots && (
          <ScreenshotsSection
            beforeScreenshots={beforeScreenshots}
            afterScreenshots={afterScreenshots}
            onBeforeChange={setBeforeScreenshots}
            onAfterChange={setAfterScreenshots}
            onContinue={handleScreenshotsContinue}
          />
        )}

        {showActionButtons && selectedEntry && (
          <div className="glass-card rounded-lg border border-border overflow-hidden mb-6">
            <div className="p-6 border-b border-border">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                Your Journal Notes
              </h3>
              <Textarea
                value={journalNotes}
                onChange={(e) => setJournalNotes(e.target.value)}
                placeholder="Write about your trading day, mindset, what you learned, patterns you noticed..."
                className="min-h-[150px] text-base"
              />
            </div>

            {(beforeScreenshots.length > 0 || afterScreenshots.length > 0) && (
              <div className="p-6 border-b border-border">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                  Trade Evidence
                </h3>
                {beforeScreenshots.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">Before Charts</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {beforeScreenshots.map((screenshot, idx) => (
                        <div key={idx} className="relative">
                          <img src={screenshot.url} alt={`Before ${idx + 1}`} className="rounded-lg w-full h-auto object-cover" />
                          {screenshot.comment && <p className="text-xs text-muted-foreground italic mt-1">{screenshot.comment}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {afterScreenshots.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">After Results</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {afterScreenshots.map((screenshot, idx) => (
                        <div key={idx} className="relative">
                          <img src={screenshot.url} alt={`After ${idx + 1}`} className="rounded-lg w-full h-auto object-cover" />
                          {screenshot.comment && <p className="text-xs text-muted-foreground italic mt-1">{screenshot.comment}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(loadedCoachingChat || loadedPsychologistChat) && (
              <div className="p-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-500" />
                  Conversation History
                </h3>
                <ConversationHistory
                  coachingChat={loadedCoachingChat}
                  psychologistChat={loadedPsychologistChat}
                />
              </div>
            )}
          </div>
        )}

        {showActionButtons && (
          <div className="space-y-3">
            <Button
              onClick={() => setShowScreenshots(true)}
              variant="outline"
              className="w-full border-blue-200 bg-primary/10 text-primary-foreground/80 hover:bg-blue-100 h-12"
            >
              <Upload className="w-4 h-4 mr-2" />
              Add Before/After Evidence
            </Button>
            <Button
              onClick={handleSubmitEntry}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Done – Register My Journal
            </Button>
            <Button
              onClick={handleOpenPsychologist}
              variant="outline"
              className="w-full border-border h-12"
            >
              Talk to Coach Sam
            </Button>

            {psychologySession && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-2">Psychology Session Saved</p>
                <p className="text-xs text-green-700">{psychologySession.summary}</p>
              </div>
            )}

            {showFeedback && (
              <FeedbackForm
                feedbackType="journal_ai"
                contextData={{
                  userId: currentUser?.email,
                  entryId: selectedEntry?.id
                }}
                onComplete={() => setShowFeedback(false)}
              />
            )}
          </div>
        )}

        {showPsychologist && selectedEntry?.id && (
          <PsychologistPanel
            userId={currentUser?.email}
            dateKey={selectedEntry.entry_date}
            accountId={selectedAccountId}
            journalEntryId={selectedEntry.id}
            journalData={{
              tradeCount: selectedEntry.trade_count || 0,
              totalPnl: selectedEntry.daily_pnl || 0,
              winRate: 0,
              notes: journalNotes
            }}
            ruleDisciplineData={ruleDisciplineData}
            onClose={() => setShowPsychologist(false)}
            onSaveSession={handleSavePsychologySession}
            existingSession={loadedPsychologistChat}
          />
        )}
      </div>
    );
  }

  // Calculate summary statistics
  const completedEntries = journalEntries.filter(e => e.status === 'registered');
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now);
  monthStart.setDate(now.getDate() - 30);

  const todayEntries = completedEntries.filter(e => e.entry_date === today);
  const weekEntries = completedEntries.filter(e => new Date(e.entry_date) >= weekStart);
  const monthEntries = completedEntries.filter(e => new Date(e.entry_date) >= monthStart);

  const todayStats = {
    netPnl: todayEntries.reduce((sum, e) => sum + (e.daily_pnl || 0), 0),
    trades: todayEntries.reduce((sum, e) => sum + (e.trade_count || 0), 0),
    wins: todayEntries.reduce((sum, e) => sum + (e.wins || 0), 0),
    losses: todayEntries.reduce((sum, e) => sum + (e.losses || 0), 0),
    disciplined: todayEntries.every(e => e.rule_status === 'NONE')
  };

  const weekStats = {
    netPnl: weekEntries.reduce((sum, e) => sum + (e.daily_pnl || 0), 0),
    sessions: weekEntries.length,
    minorBreaks: weekEntries.filter(e => e.rule_status === 'MINOR').length,
    majorBreaks: weekEntries.filter(e => e.rule_status === 'MAJOR').length
  };

  const monthStats = {
    netPnl: monthEntries.reduce((sum, e) => sum + (e.daily_pnl || 0), 0),
    wins: monthEntries.reduce((sum, e) => sum + (e.wins || 0), 0),
    losses: monthEntries.reduce((sum, e) => sum + (e.losses || 0), 0),
    winRate: monthEntries.reduce((sum, e) => sum + (e.wins || 0), 0) + monthEntries.reduce((sum, e) => sum + (e.losses || 0), 0) > 0
      ? (monthEntries.reduce((sum, e) => sum + (e.wins || 0), 0) / (monthEntries.reduce((sum, e) => sum + (e.wins || 0), 0) + monthEntries.reduce((sum, e) => sum + (e.losses || 0), 0))) * 100
      : null
  };

  const disciplinedCount = completedEntries.filter(e => e.rule_status === 'NONE').length;
  const disciplineScore = completedEntries.length > 0 ? (disciplinedCount / completedEntries.length) * 100 : 0;

  let currentStreak = 0;
  for (let i = completedEntries.length - 1; i >= 0; i--) {
    if (completedEntries[i].rule_status === 'NONE') {
      currentStreak++;
    } else {
      break;
    }
  }

  // Apply filters
  const filteredJournalEntries = journalEntries.filter(entry => {
    // Status filter
    if (statusFilter === 'completed' && entry.status !== 'registered') return false;
    if (statusFilter === 'draft' && entry.status !== 'incomplete') return false;

    // Discipline filter
    if (disciplineFilter === 'followed' && entry.rule_status !== 'NONE') return false;
    if (disciplineFilter === 'minor' && entry.rule_status !== 'MINOR') return false;
    if (disciplineFilter === 'major' && entry.rule_status !== 'MAJOR') return false;

    // Date range filter
    if (dateRangeFilter !== 'all' && entry.entry_date) {
      const entryDate = new Date(entry.entry_date);
      const daysAgo = (now - entryDate) / (1000 * 60 * 60 * 24);
      if (dateRangeFilter === '7d' && daysAgo > 7) return false;
      if (dateRangeFilter === '30d' && daysAgo > 30) return false;
      if (dateRangeFilter === '90d' && daysAgo > 90) return false;
    }

    // Search filter
    if (searchQuery && entry.journal_notes && !entry.journal_notes.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <TooltipProvider>
      <div className="space-y-4 md:space-y-6 max-w-full overflow-x-hidden relative">
        {view === 'detail' && (
          <div className="fixed inset-0 bg-slate-900/50 z-40 pointer-events-none" />
        )}

        {/* Summary Mode Banner */}
        {isSummaryMode && (
          <div className="bg-primary/10 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-primary-foreground">
                Summary (All Accounts) — Read-only aggregate view
              </p>
              <p className="text-xs text-primary-foreground/80 mt-1">
                Switch to a specific account to create or edit entries.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0", view === 'detail' && "opacity-50 pointer-events-none")}>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 md:gap-3">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
              Trading Journal
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Track your performance and discipline</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {journalEntries.length > 0 && !isSummaryMode && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border"
                      disabled={view === 'detail'}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportToCSV}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToPDF}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={() => setShowDeleteAllDialog(true)}
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  disabled={view === 'detail'}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All
                </Button>
              </>
            )}
            {!isSummaryMode ? (
              <Button
                onClick={() => {
                  if (incompleteEntry) {
                    setShowIncompleteDialog(true);
                  } else {
                    resetSession();
                    setView('new');
                  }
                }}
                size="sm"
                className="bg-primary text-primary-foreground font-semibold"
                disabled={view === 'detail'}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Entry
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      size="sm"
                      disabled
                      className="bg-slate-200 text-muted-foreground cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Entry
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs">Switch to a specific account to create entries.</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Journal Summary Strip */}
        {completedEntries.length > 0 && (
          <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", view === 'detail' && "opacity-50 pointer-events-none")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="glass-card rounded-xl border border-border p-4 cursor-help">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Today</p>
                  </div>
                  <div className="space-y-1">
                    <p className={cn("text-2xl font-bold", todayStats.netPnl >= 0 ? "text-green-600" : "text-red-600")}>
                      {todayStats.netPnl >= 0 ? '+' : ''}${todayStats.netPnl.toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {todayStats.trades} trades • {todayStats.wins}W/{todayStats.losses}L
                    </p>
                    <p className={cn("text-xs font-medium", todayStats.disciplined ? "text-green-600" : "text-amber-600")}>
                      {todayStats.disciplined ? '✓ Disciplined' : '⚠️ Rule break'}
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Today's performance from completed journal entries</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="glass-card rounded-xl border border-border p-4 cursor-help">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">This Week</p>
                  </div>
                  <div className="space-y-1">
                    <p className={cn("text-2xl font-bold", weekStats.netPnl >= 0 ? "text-green-600" : "text-red-600")}>
                      {weekStats.netPnl >= 0 ? '+' : ''}${weekStats.netPnl.toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {weekStats.sessions} sessions logged
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {weekStats.minorBreaks} minor • {weekStats.majorBreaks} major breaks
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Last 7 days from completed entries</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="glass-card rounded-xl border border-border p-4 cursor-help">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">This Month</p>
                  </div>
                  <div className="space-y-1">
                    <p className={cn("text-2xl font-bold", monthStats.netPnl >= 0 ? "text-green-600" : "text-red-600")}>
                      {monthStats.netPnl >= 0 ? '+' : ''}${monthStats.netPnl.toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Win Rate: {monthStats.winRate !== null ? `${monthStats.winRate.toFixed(1)}%` : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {monthStats.wins}W / {monthStats.losses}L
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Last 30 days from completed entries</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="glass-card rounded-xl border border-border p-4 cursor-help">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Discipline</p>
                  </div>
                  <div className="space-y-1">
                    <p className={cn("text-2xl font-bold", disciplineScore >= 70 ? "text-green-600" : "text-amber-600")}>
                      {disciplineScore.toFixed(0)}/100
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Trend Score
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentStreak} session streak
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Overall discipline from all completed entries</p></TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Filter Bar */}
        {journalEntries.length > 0 && (
          <div className={cn("glass-card rounded-xl border border-border p-4", view === 'detail' && "opacity-50 pointer-events-none")}>
            <div className="flex items-center gap-3 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />

              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Discipline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="followed">Followed</SelectItem>
                  <SelectItem value="minor">Minor Break</SelectItem>
                  <SelectItem value="major">Major Break</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {(statusFilter !== 'all' || disciplineFilter !== 'all' || searchQuery || dateRangeFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setDisciplineFilter('all');
                    setSearchQuery('');
                    setDateRangeFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}

        {filteredJournalEntries.length === 0 && journalEntries.length > 0 ? (
          <div className="glass-card rounded-2xl p-12 border border-border text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No entries match your filters</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your filters to see more entries</p>
            <Button
              onClick={() => {
                setStatusFilter('all');
                setDisciplineFilter('all');
                setSearchQuery('');
                setDateRangeFilter('all');
              }}
              variant="outline"
            >
              Clear All Filters
            </Button>
          </div>
        ) : journalEntries.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 bg-card border border-border text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-blue-200">
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">
              {isSummaryMode ? 'No Completed Sessions Across Accounts' : 'No Journal Entries Yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {isSummaryMode
                ? 'Complete your first journal entry in any account to see aggregated data here.'
                : 'Start reflecting on your trading psychology'}
            </p>
            {!isSummaryMode && (
              <Button
                onClick={() => {
                  if (incompleteEntry) {
                    setShowIncompleteDialog(true);
                  } else {
                    resetSession();
                    setView('new');
                  }
                }}
                className="bg-primary text-primary-foreground font-semibold"
                disabled={view === 'detail'}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Entry
              </Button>
            )}
          </div>
        ) : (
          <div className={cn("glass-card rounded-xl border border-border overflow-hidden", view === 'detail' && "opacity-50 pointer-events-none")}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr className="text-left">
                    <th className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date/Time</th>
                    {isSummaryMode && (
                      <th className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account</th>
                    )}
                    <th className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Result</th>
                    <th className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trades</th>
                    <th className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Discipline</th>
                    <th className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Evidence</th>
                    <th className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">AI Recap</th>
                    <th className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJournalEntries.map((entry, idx) => {
                    const entryDate = entry.entry_date;
                    const dayTrades = allTrades.filter(t => t.date === entryDate && t.symbol !== 'Daily P&L');
                    const entryRecap = journalRecaps.find(r => r.journal_entry_id === entry.id);
                    const winRate = (entry.wins && entry.losses) ? ((entry.wins / (entry.wins + entry.losses)) * 100) : null;

                    const beforeCount = entry.before_screenshots?.length || 0;
                    const afterCount = entry.after_screenshots?.length || 0;
                    const pnlScreenshotCount = entry.uploaded_pnl_screenshots?.length || 0;

                    return (
                      <tr
                        key={entry.id}
                        className={cn(
                          "border-b border-slate-100 transition-colors cursor-pointer",
                          idx % 2 === 0 ? "bg-card hover:bg-muted/50" : "bg-muted/50/50 hover:bg-muted/50",
                          entry.status === 'incomplete' && "bg-yellow-50 hover:bg-yellow-100"
                        )}
                        onClick={() => {
                          setSelectedEntry(entry);
                          if (entry.status === 'incomplete') {
                            setJournalNotes(entry.journal_notes || '');
                            setBeforeScreenshots(entry.before_screenshots || []);
                            setAfterScreenshots(entry.after_screenshots || []);

                            const hasRules = entry.rule_status && entry.rule_status !== 'NONE';
                            const hasCoaching = entry.coach_conversation?.length > 0;
                            const hasScreenshots = entry.before_screenshots?.length > 0 || entry.after_screenshots?.length > 0;

                            if (!hasRules) {
                              setShowRuleDiscipline(true);
                            } else if (!hasCoaching) {
                              setCoachingStage('ASKING');
                            } else if (!hasScreenshots) {
                              setShowScreenshots(true);
                            } else {
                              setShowActionButtons(true);
                            }

                            setView('new');
                          } else {
                            setEditingNotes(entry.journal_notes || '');
                            setView('detail');
                          }
                        }}
                      >
                        {/* Date/Time */}
                        <td className="p-3">
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-foreground">
                              {entry.entry_date ? format(new Date(entry.entry_date), 'MMM d, yyyy') : 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.created_date ? format(new Date(entry.created_date), 'h:mm a') : ''}
                            </p>
                            {entry.status === 'incomplete' && (
                              <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                                Draft
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Account (Summary Mode Only) */}
                        {isSummaryMode && (
                          <td className="p-3">
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                              {allAccounts.find(a => a.id === entry.account_id)?.account_name || 'Unknown'}
                            </span>
                          </td>
                        )}

                        {/* Result */}
                        <td className="p-3">
                          <div className="space-y-0.5">
                            {entry.daily_pnl !== null && entry.daily_pnl !== undefined ? (
                              <>
                                <p className={cn(
                                  "text-lg font-bold",
                                  entry.daily_pnl >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  {entry.daily_pnl >= 0 ? '+' : ''}${Number(entry.daily_pnl).toFixed(2)}
                                </p>
                                {winRate !== null && (
                                  <p className="text-xs text-muted-foreground">
                                    {winRate.toFixed(0)}% win rate
                                  </p>
                                )}
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">No P&L</span>
                            )}
                          </div>
                        </td>

                        {/* Trades */}
                        <td className="p-3">
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-foreground">
                              {entry.trade_count || 0} total
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.wins || 0}W / {entry.losses || 0}L
                            </p>
                          </div>
                        </td>

                        {/* Discipline */}
                        <td className="p-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                {entry.rule_status === 'NONE' && (
                                  <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                                    ✓ Followed
                                  </span>
                                )}
                                {entry.rule_status === 'MINOR' && (
                                  <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-medium">
                                    ⚠️ Minor
                                  </span>
                                )}
                                {entry.rule_status === 'MAJOR' && (
                                  <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
                                    🔴 Major
                                  </span>
                                )}
                                {!entry.rule_status && (
                                  <span className="text-xs text-muted-foreground">Not recorded</span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {entry.rules_broken && entry.rules_broken.length > 0 ? (
                                <div className="space-y-1">
                                  <p className="font-semibold">Rules Broken:</p>
                                  <ul className="text-xs space-y-0.5">
                                    {entry.rules_broken.map((rule, i) => (
                                      <li key={i}>• {rule}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <p>No rule breaks recorded</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </td>

                        {/* Evidence */}
                        <td className="p-3 hidden md:table-cell">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {beforeCount > 0 && (
                              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary-foreground/80 px-2 py-1 rounded">
                                📊 {beforeCount} before
                              </span>
                            )}
                            {afterCount > 0 && (
                              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded">
                                💰 {afterCount} after
                              </span>
                            )}
                            {pnlScreenshotCount > 0 && (
                              <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground px-2 py-1 rounded">
                                📸 {pnlScreenshotCount}
                              </span>
                            )}
                            {beforeCount === 0 && afterCount === 0 && pnlScreenshotCount === 0 && (
                              <span className="text-slate-400">No evidence</span>
                            )}
                          </div>
                        </td>

                        {/* AI Recap */}
                        <td className="p-3 hidden lg:table-cell">
                          {entryRecap?.one_liner ? (
                            <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs">
                              {entryRecap.one_liner}
                            </p>
                          ) : entry.status === 'registered' ? (
                            <p className="text-xs text-slate-400 italic">Recap not generated</p>
                          ) : (
                            <p className="text-xs text-slate-400 italic">Draft entry</p>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEntry(entry);
                                if (entry.status === 'incomplete' && !isSummaryMode) {
                                  setView('new');
                                } else {
                                  setView('detail');
                                }
                              }}
                              className="border-blue-200 text-primary hover:bg-primary/10"
                            >
                              View
                            </Button>
                            {!isSummaryMode && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteEntryMutation.mutate(entry.id);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete All Journal Entries</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will permanently delete all your journal entries and trades. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteAllEntriesMutation.mutate()}
                disabled={deleteAllEntriesMutation.isLoading}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {deleteAllEntriesMutation.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete All'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <RegretReplayModal
          trade={selectedTradeForReplay}
          open={replayModalOpen}
          onClose={() => {
            setReplayModalOpen(false);
            setSelectedTradeForReplay(null);
          }}
        />

        {viewingImage && (
          <ImageViewerModal
            imageUrl={viewingImage}
            onClose={() => setViewingImage(null)}
          />
        )}

        <ManualEntryForm
          open={showManualEntry}
          onOpenChange={setShowManualEntry}
          currentUser={currentUser}
          accounts={userAccounts}
          onSuccess={() => {
            refetchJournalEntries();
          }}
        />

        <AlertDialog open={showIncompleteDialog} onOpenChange={setShowIncompleteDialog}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Incomplete Entry Found</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                You have an incomplete journal entry from today. Would you like to continue working on it or discard it and start a new entry?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowIncompleteDialog(false)}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="outline"
                onClick={async () => {
                  if (incompleteEntry?.id) {
                    await deleteEntryMutation.mutateAsync(incompleteEntry.id);
                    await queryClient.invalidateQueries({ queryKey: ['incompleteJournalEntries'] });
                  }
                  resetSession();
                  setShowIncompleteDialog(false);
                  setView('new');
                }}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                Discard & Start New
              </Button>
              <AlertDialogAction
                onClick={() => {
                  if (incompleteEntry) {
                    setSelectedEntry(incompleteEntry);
                    setJournalNotes(incompleteEntry.journal_notes || '');
                    setBeforeScreenshots(incompleteEntry.before_screenshots || []);
                    setAfterScreenshots(incompleteEntry.after_screenshots || []);

                    const hasRules = incompleteEntry.rule_status && incompleteEntry.rule_status !== 'NONE';
                    const hasCoaching = incompleteEntry.coach_conversation?.length > 0;
                    const hasScreenshots = incompleteEntry.before_screenshots?.length > 0 || incompleteEntry.after_screenshots?.length > 0;

                    if (!hasRules) {
                      setShowRuleDiscipline(true);
                    } else if (!hasCoaching) {
                      setCoachingStage('ASKING');
                    } else if (!hasScreenshots) {
                      setShowScreenshots(true);
                    } else {
                      setShowActionButtons(true);
                    }
                  }
                  setShowIncompleteDialog(false);
                  setView('new');
                }}
                className="bg-primary text-primary-foreground"
              >
                Continue Incomplete Entry
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}