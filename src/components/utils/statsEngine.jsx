import { api, safeDate } from '@/api/apiClient';
import { startOfDay, endOfDay, subDays, startOfWeek, startOfMonth } from 'date-fns';

export async function computeAccountStats(userId, accountId, period = 'ALL_TIME') {
  // Get date range for period
  const now = new Date();
  let fromDate = null;

  switch (period) {
    case 'TODAY':
      fromDate = startOfDay(now);
      break;
    case 'WEEK':
      fromDate = startOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'MONTH':
      fromDate = startOfMonth(now);
      break;
    case 'ALL_TIME':
    default:
      fromDate = null;
  }

  // CRITICAL: Fetch journal entries (SINGLE SOURCE OF TRUTH)
  const allJournalEntries = await api.entities.JournalEntry.filter({
    created_by: userId,
    account_id: accountId,
    status: 'complete'
  }, '-entry_date');

  // Filter by period if needed
  const journalEntries = fromDate
    ? allJournalEntries.filter(e => safeDate(e.entry_date) >= fromDate)
    : allJournalEntries;

  // Compute stats from journal entries
  const totalPnl = journalEntries.reduce((sum, e) => sum + (e.daily_pnl || 0), 0);
  const totalTrades = journalEntries.reduce((sum, e) => sum + (e.trade_count || 0), 0);
  const winCount = journalEntries.reduce((sum, e) => sum + (e.wins || 0), 0);
  const lossCount = journalEntries.reduce((sum, e) => sum + (e.losses || 0), 0);
  const winRate = winCount + lossCount > 0 ? (winCount / (winCount + lossCount)) * 100 : 0;

  // Fetch trade entries for detailed metrics
  const allTrades = await api.entities.TradeEntries.filter({
    user_id: userId,
    account_id: accountId
  }, 'date_key');

  const trades = fromDate
    ? allTrades.filter(t => safeDate(t.date_key) >= fromDate)
    : allTrades;

  const wins = trades.filter(t => t.pnl_currency > 0);
  const losses = trades.filter(t => t.pnl_currency < 0);

  const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl_currency, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnl_currency, 0) / losses.length) : 0;

  const grossWins = wins.reduce((sum, t) => sum + t.pnl_currency, 0);
  const grossLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl_currency, 0));
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : null;

  const expectancy = totalTrades > 0 ? totalPnl / totalTrades : null;

  const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.pnl_currency)) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.pnl_currency)) : 0;

  // Compute equity curve from journal entries
  const sortedEntries = [...allJournalEntries].sort((a, b) =>
    safeDate(a.entry_date) - safeDate(b.entry_date)
  );

  const equityCurve = [];
  let cumulativeEquity = 0;

  sortedEntries.forEach(entry => {
    cumulativeEquity += (entry.daily_pnl || 0);
    equityCurve.push({
      timestamp: safeDate(entry.entry_date).toISOString(),
      equity: cumulativeEquity,
      pnl: entry.daily_pnl || 0
    });
  });

  return {
    totalPnl,
    totalTrades,
    wins: winCount,
    losses: lossCount,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
    expectancy,
    largestWin,
    largestLoss,
    equityCurve
  };
}

export async function invalidateStatsCache(userId, accountId) {
  // Recompute all periods
  const periods = ['TODAY', 'WEEK', 'MONTH', 'ALL_TIME'];

  for (const period of periods) {
    const stats = await computeAccountStats(userId, accountId, period);

    // Check if cache exists
    const existing = await api.entities.AccountStatsCache.filter({
      user_id: userId,
      account_id: accountId,
      period
    });

    if (existing.length > 0) {
      await api.entities.AccountStatsCache.update(existing[0].id, {
        computed_json: stats,
        equity_curve_data: stats.equityCurve,
        updated_at: new Date().toISOString()
      });
    } else {
      await api.entities.AccountStatsCache.create({
        user_id: userId,
        account_id: accountId,
        period,
        computed_json: stats,
        equity_curve_data: stats.equityCurve,
        updated_at: new Date().toISOString()
      });
    }
  }
}

export async function getAccountStats(userId, accountId, period = 'ALL_TIME') {
  // Try to get from cache
  const cached = await api.entities.AccountStatsCache.filter({
    user_id: userId,
    account_id: accountId,
    period
  });

  if (cached.length > 0) {
    const cache = cached[0];
    // Check if cache is fresh (less than 5 minutes old)
    const cacheAge = Date.now() - new Date(cache.updated_at).getTime();
    if (cacheAge < 5 * 60 * 1000) {
      return cache.computed_json;
    }
  }

  // Recompute and cache
  const stats = await computeAccountStats(userId, accountId, period);

  if (cached.length > 0) {
    await api.entities.AccountStatsCache.update(cached[0].id, {
      computed_json: stats,
      equity_curve_data: stats.equityCurve,
      updated_at: new Date().toISOString()
    });
  } else {
    await api.entities.AccountStatsCache.create({
      user_id: userId,
      account_id: accountId,
      period,
      computed_json: stats,
      equity_curve_data: stats.equityCurve,
      updated_at: new Date().toISOString()
    });
  }

  return stats;
}