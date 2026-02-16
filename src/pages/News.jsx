import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Loader2,
  BarChart3,
  AlertCircle,
  Brain
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

const AVAILABLE_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'NZD/USD', 'USD/CAD',
  'ES (S&P 500)', 'NQ (Nasdaq)', 'YM (Dow Jones)', 'GC (Gold)', 'CL (Crude Oil)', 'BTC/USD'
];

export default function News() {
  const [pair1, setPair1] = useState('EUR/USD');
  const [pair2, setPair2] = useState('GBP/USD');

  const { data: economicCalendar, isLoading: loadingCalendar } = useQuery({
    queryKey: ['economicCalendar'],
    queryFn: async () => {
      const result = await api.integrations.Core.InvokeLLM({
        prompt: `Get today's economic calendar focusing on USD-related events. Include event time (EST), country, event name, importance (Low/Medium/High), previous value, forecast, and actual (if released). Format as JSON array.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  country: { type: "string" },
                  event: { type: "string" },
                  importance: { type: "string" },
                  previous: { type: "string" },
                  forecast: { type: "string" },
                  actual: { type: "string" }
                }
              }
            }
          }
        }
      });
      return result.events || [];
    },
    staleTime: 1000 * 60 * 30 // 30 minutes
  });

  const { data: dollarNews, isLoading: loadingNews } = useQuery({
    queryKey: ['dollarNews'],
    queryFn: async () => {
      const result = await api.integrations.Core.InvokeLLM({
        prompt: `Get the latest flash news about the US Dollar from financial sources. Include headline, source, time, and brief summary. Focus on market-moving news. Return 5-8 most recent items.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            news: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  source: { type: "string" },
                  time: { type: "string" },
                  summary: { type: "string" }
                }
              }
            }
          }
        }
      });
      return result.news || [];
    },
    staleTime: 1000 * 60 * 10 // 10 minutes
  });

  const { data: marketPrices, isLoading: loadingPrices } = useQuery({
    queryKey: ['marketPrices'],
    queryFn: async () => {
      const result = await api.integrations.Core.InvokeLLM({
        prompt: `Get current prices and 24h change for: EUR/USD, GBP/USD, USD/JPY, Gold, S&P 500, Nasdaq. Include symbol, current price, and percentage change.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            markets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  symbol: { type: "string" },
                  price: { type: "string" },
                  change: { type: "number" }
                }
              }
            }
          }
        }
      });
      return result.markets || [];
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const { data: pairSentiment, isLoading: loadingSentiment } = useQuery({
    queryKey: ['pairSentiment', pair1, pair2],
    queryFn: async () => {
      const result = await api.integrations.Core.InvokeLLM({
        prompt: `Analyze current market sentiment for ${pair1} and ${pair2}. For each pair, provide:
        - Overall sentiment (Bullish/Bearish/Neutral)
        - Key drivers (2-3 bullet points)
        - Short-term outlook (1-2 sentences)
        Search latest financial news and market data.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            pair1: {
              type: "object",
              properties: {
                sentiment: { type: "string" },
                drivers: { type: "array", items: { type: "string" } },
                outlook: { type: "string" }
              }
            },
            pair2: {
              type: "object",
              properties: {
                sentiment: { type: "string" },
                drivers: { type: "array", items: { type: "string" } },
                outlook: { type: "string" }
              }
            }
          }
        }
      });
      return result;
    },
    enabled: !!pair1 && !!pair2,
    staleTime: 1000 * 60 * 15 // 15 minutes
  });

  const { data: twitterFeed, isLoading: loadingTwitter } = useQuery({
    queryKey: ['twitterFeed', pair1, pair2],
    queryFn: async () => {
      const result = await api.integrations.Core.InvokeLLM({
        prompt: `Find latest Twitter/X posts about ${pair1} and ${pair2} trading. Include username, tweet text, and approximate time. Focus on credible trading accounts. Return 8-10 tweets.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            tweets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  username: { type: "string" },
                  text: { type: "string" },
                  time: { type: "string" }
                }
              }
            }
          }
        }
      });
      return result.tweets || [];
    },
    enabled: !!pair1 && !!pair2,
    staleTime: 1000 * 60 * 10 // 10 minutes
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Market News & Analysis</h1>
        <p className="text-gray-500 mt-1">Stay informed with real-time market data</p>
      </div>

      {/* Market Ticker Bar */}
      <div className="glass-card rounded-2xl p-4 bg-[#0f0f17]/80 border border-white/5 overflow-hidden">
        {loadingPrices ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-2">
            {marketPrices?.map((market, idx) => (
              <div key={idx} className="flex items-center gap-3 flex-shrink-0">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">{market.symbol}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{market.price}</span>
                    <div className={cn(
                      "flex items-center gap-1 text-xs",
                      market.change >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {market.change >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {Math.abs(market.change).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pair Selection */}
      <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-green-400" />
          Select Your Focus Pairs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Primary Pair</label>
            <Select value={pair1} onValueChange={setPair1}>
              <SelectTrigger className="bg-card/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_PAIRS.map(pair => (
                  <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Secondary Pair</label>
            <Select value={pair2} onValueChange={setPair2}>
              <SelectTrigger className="bg-card/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_PAIRS.map(pair => (
                  <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Economic Calendar */}
          <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-400" />
              Economic Calendar - Today
            </h2>
            {loadingCalendar ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-2">
                {economicCalendar?.map((event, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-3 rounded-lg border",
                      event.importance === 'High' 
                        ? "bg-red-500/10 border-red-500/30" 
                        : "bg-card/5 border-white/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">{event.time}</span>
                          <span className="text-xs font-medium">{event.country}</span>
                          {event.importance === 'High' && (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <p className="text-sm font-medium">{event.event}</p>
                        <div className="flex gap-4 mt-1 text-xs text-gray-500">
                          {event.previous && <span>Prev: {event.previous}</span>}
                          {event.forecast && <span>Forecast: {event.forecast}</span>}
                          {event.actual && <span className="text-green-400">Actual: {event.actual}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dollar News */}
          <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              USD Flash News
            </h2>
            {loadingNews ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {dollarNews?.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-card/5 border border-white/5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium">{item.headline}</p>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{item.time}</span>
                    </div>
                    <p className="text-xs text-gray-400">{item.summary}</p>
                    <p className="text-xs text-gray-600 mt-1">Source: {item.source}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sentiment Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pair 1 Sentiment */}
            <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-green-500/20">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-green-400" />
                {pair1}
              </h3>
              {loadingSentiment ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : pairSentiment?.pair1 ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Sentiment</p>
                    <p className={cn(
                      "font-semibold",
                      pairSentiment.pair1.sentiment?.toLowerCase().includes('bullish') ? "text-green-400" :
                      pairSentiment.pair1.sentiment?.toLowerCase().includes('bearish') ? "text-red-400" :
                      "text-gray-400"
                    )}>
                      {pairSentiment.pair1.sentiment}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Key Drivers</p>
                    <ul className="text-sm space-y-1">
                      {pairSentiment.pair1.drivers?.map((driver, idx) => (
                        <li key={idx} className="text-gray-300">• {driver}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Outlook</p>
                    <p className="text-sm text-gray-400">{pairSentiment.pair1.outlook}</p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Pair 2 Sentiment */}
            <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-green-500/20">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-green-400" />
                {pair2}
              </h3>
              {loadingSentiment ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : pairSentiment?.pair2 ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Sentiment</p>
                    <p className={cn(
                      "font-semibold",
                      pairSentiment.pair2.sentiment?.toLowerCase().includes('bullish') ? "text-green-400" :
                      pairSentiment.pair2.sentiment?.toLowerCase().includes('bearish') ? "text-red-400" :
                      "text-gray-400"
                    )}>
                      {pairSentiment.pair2.sentiment}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Key Drivers</p>
                    <ul className="text-sm space-y-1">
                      {pairSentiment.pair2.drivers?.map((driver, idx) => (
                        <li key={idx} className="text-gray-300">• {driver}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Outlook</p>
                    <p className="text-sm text-gray-400">{pairSentiment.pair2.outlook}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Twitter Feed - Right Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Twitter Feed</h2>
            <p className="text-xs text-gray-500 mb-4">
              Latest tweets about {pair1} & {pair2}
            </p>
            {loadingTwitter ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-3 max-h-[800px] overflow-y-auto">
                {twitterFeed?.map((tweet, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-card/5 border border-white/5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-blue-400">@{tweet.username}</p>
                      <span className="text-xs text-gray-500">{tweet.time}</span>
                    </div>
                    <p className="text-sm text-gray-300">{tweet.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}