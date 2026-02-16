import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator as CalcIcon, DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

const FUTURES_CONTRACTS = {
  'ES': { name: 'E-mini S&P 500', tickValue: 12.50, tickSize: 0.25 },
  'NQ': { name: 'E-mini Nasdaq 100', tickValue: 5.00, tickSize: 0.25 },
  'YM': { name: 'E-mini Dow', tickValue: 5.00, tickSize: 1.00 },
  'RTY': { name: 'E-mini Russell 2000', tickValue: 5.00, tickSize: 0.10 },
  'MES': { name: 'Micro E-mini S&P 500', tickValue: 1.25, tickSize: 0.25 },
  'MNQ': { name: 'Micro E-mini Nasdaq', tickValue: 0.50, tickSize: 0.25 },
  'MYM': { name: 'Micro E-mini Dow', tickValue: 0.50, tickSize: 1.00 },
  'GC': { name: 'Gold Futures', tickValue: 10.00, tickSize: 0.10 },
  'MGC': { name: 'Micro Gold', tickValue: 1.00, tickSize: 0.10 },
  'SI': { name: 'Silver Futures', tickValue: 25.00, tickSize: 0.005 },
  'CL': { name: 'Crude Oil', tickValue: 10.00, tickSize: 0.01 },
  'MCL': { name: 'Micro Crude Oil', tickValue: 1.00, tickSize: 0.01 },
};

export default function Calculator() {
  const [marketType, setMarketType] = useState('futures');
  
  // Forex state
  const [forexPair, setForexPair] = useState('EUR/USD');
  const [accountEquity, setAccountEquity] = useState('');
  const [riskPercent, setRiskPercent] = useState('');
  const [stopLossPips, setStopLossPips] = useState('');
  const [forexResult, setForexResult] = useState(null);
  
  // Futures state
  const [futuresContract, setFuturesContract] = useState('ES');
  const [futuresEquity, setFuturesEquity] = useState('');
  const [riskType, setRiskType] = useState('percentage');
  const [riskAmount, setRiskAmount] = useState('');
  const [stopLossTicks, setStopLossTicks] = useState('');
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [futuresResult, setFuturesResult] = useState(null);

  const calculateForex = () => {
    const equity = parseFloat(accountEquity);
    const risk = parseFloat(riskPercent);
    const pips = parseFloat(stopLossPips);
    
    if (!equity || !risk || !pips) return;
    
    const riskAmount = (equity * risk) / 100;
    
    // Pip value varies by pair
    const pipValue = forexPair.includes('JPY') ? 0.01 : 0.0001;
    const standardLotSize = 100000;
    
    // For most pairs, 1 pip = $10 per standard lot
    const pipValuePerLot = forexPair.includes('JPY') ? 10 : 10;
    
    const lotSize = riskAmount / (pips * pipValuePerLot);
    const positionSize = lotSize * standardLotSize;
    
    setForexResult({
      riskAmount: riskAmount.toFixed(2),
      lotSize: lotSize.toFixed(2),
      miniLots: (lotSize * 10).toFixed(2),
      microLots: (lotSize * 100).toFixed(0),
      positionSize: positionSize.toFixed(0)
    });
  };

  const fetchCurrentPrice = async () => {
    setFetchingPrice(true);
    try {
      const contract = FUTURES_CONTRACTS[futuresContract];
      const result = await api.integrations.Core.InvokeLLM({
        prompt: `What is the current live price of ${contract.name} (${futuresContract})? Just return the numeric price value.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            price: { type: "number" }
          }
        }
      });
      setCurrentPrice(result.price);
    } catch (error) {
      setCurrentPrice(null);
    }
    setFetchingPrice(false);
  };

  const calculateFutures = () => {
    const equity = parseFloat(futuresEquity);
    const ticks = parseFloat(stopLossTicks);
    const contract = FUTURES_CONTRACTS[futuresContract];
    
    if (!equity || !ticks || !contract) return;
    
    let dollarRisk;
    
    if (riskType === 'percentage') {
      const percent = parseFloat(riskAmount);
      if (!percent) return;
      dollarRisk = (equity * percent) / 100;
    } else if (riskType === 'dollars') {
      dollarRisk = parseFloat(riskAmount);
      if (!dollarRisk) return;
    } else {
      // ticks
      const riskTicks = parseFloat(riskAmount);
      if (!riskTicks) return;
      dollarRisk = riskTicks * contract.tickValue;
    }
    
    const riskPerContract = ticks * contract.tickValue;
    const contracts = dollarRisk / riskPerContract;
    
    const isMicro = futuresContract.startsWith('M');
    
    setFuturesResult({
      dollarRisk: dollarRisk.toFixed(2),
      contracts: contracts.toFixed(2),
      roundedContracts: Math.floor(contracts),
      contractType: isMicro ? 'Micro' : 'Mini/Standard',
      riskPerContract: riskPerContract.toFixed(2),
      totalRisk: (Math.floor(contracts) * riskPerContract).toFixed(2)
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <CalcIcon className="w-8 h-8 text-green-400" />
          Risk Calculator
        </h1>
        <p className="text-gray-500 mt-1">Calculate position size based on your risk parameters</p>
      </div>

      {/* Market Type Selection */}
      <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5">
        <Label className="text-base font-semibold mb-3 block">Market Type</Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setMarketType('forex')}
            className={cn(
              "p-4 rounded-xl border-2 transition-all",
              marketType === 'forex'
                ? "border-green-500 bg-green-500/10"
                : "border-white/10 bg-card/5 hover:border-white/20"
            )}
          >
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <p className="font-semibold">Forex</p>
            <p className="text-xs text-gray-500">Lot size calculator</p>
          </button>
          <button
            onClick={() => setMarketType('futures')}
            className={cn(
              "p-4 rounded-xl border-2 transition-all",
              marketType === 'futures'
                ? "border-green-500 bg-green-500/10"
                : "border-white/10 bg-card/5 hover:border-white/20"
            )}
          >
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <p className="font-semibold">Futures</p>
            <p className="text-xs text-gray-500">Contract calculator</p>
          </button>
        </div>
      </div>

      {/* Forex Calculator */}
      {marketType === 'forex' && (
        <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5 space-y-4">
          <h2 className="font-semibold text-lg">Forex Position Calculator</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Currency Pair</Label>
              <Input
                value={forexPair}
                onChange={(e) => setForexPair(e.target.value.toUpperCase())}
                placeholder="EUR/USD"
                className="bg-card/5 border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Account Equity ($)</Label>
              <Input
                type="number"
                value={accountEquity}
                onChange={(e) => setAccountEquity(e.target.value)}
                placeholder="10000"
                className="bg-card/5 border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Risk Percentage (%)</Label>
              <Input
                type="number"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                placeholder="1"
                step="0.1"
                className="bg-card/5 border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Stop Loss (Pips)</Label>
              <Input
                type="number"
                value={stopLossPips}
                onChange={(e) => setStopLossPips(e.target.value)}
                placeholder="20"
                className="bg-card/5 border-white/10"
              />
            </div>
          </div>

          <Button
            onClick={calculateForex}
            className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold"
            disabled={!accountEquity || !riskPercent || !stopLossPips}
          >
            <CalcIcon className="w-4 h-4 mr-2" />
            Calculate
          </Button>

          {forexResult && (
            <div className="mt-6 p-6 rounded-xl bg-green-500/10 border border-green-500/20 space-y-3">
              <h3 className="font-semibold text-green-400 text-lg">Results</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Risk Amount</p>
                  <p className="text-2xl font-bold">${forexResult.riskAmount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Standard Lots</p>
                  <p className="text-2xl font-bold">{forexResult.lotSize}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mini Lots (0.1)</p>
                  <p className="text-xl font-bold text-green-400">{forexResult.miniLots}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Micro Lots (0.01)</p>
                  <p className="text-xl font-bold text-green-400">{forexResult.microLots}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-white/10">
                <p className="text-xs text-gray-500">Position Size</p>
                <p className="text-lg font-semibold">{forexResult.positionSize} units</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Futures Calculator */}
      {marketType === 'futures' && (
        <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5 space-y-4">
          <h2 className="font-semibold text-lg">Futures Contract Calculator</h2>
          
          <div className="space-y-2">
            <Label>Futures Contract</Label>
            <Select value={futuresContract} onValueChange={setFuturesContract}>
              <SelectTrigger className="bg-card/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a24] border-white/10">
                {Object.entries(FUTURES_CONTRACTS).map(([symbol, data]) => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol} - {data.name} (${data.tickValue}/tick)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {futuresContract && (
            <div className="p-4 rounded-xl bg-primary/10 border border-blue-500/20">
              <p className="text-sm text-gray-400 mb-2">
                <strong>{FUTURES_CONTRACTS[futuresContract].name}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Tick Value: ${FUTURES_CONTRACTS[futuresContract].tickValue} | 
                Tick Size: {FUTURES_CONTRACTS[futuresContract].tickSize}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  onClick={fetchCurrentPrice}
                  size="sm"
                  variant="outline"
                  className="border-white/10"
                  disabled={fetchingPrice}
                >
                  {fetchingPrice ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-2" />
                  ) : null}
                  Get Current Price
                </Button>
                {currentPrice && (
                  <span className="text-sm">
                    Current: <strong className="text-green-400">${currentPrice}</strong>
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account Equity ($)</Label>
              <Input
                type="number"
                value={futuresEquity}
                onChange={(e) => setFuturesEquity(e.target.value)}
                placeholder="25000"
                className="bg-card/5 border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Risk Type</Label>
              <Select value={riskType} onValueChange={setRiskType}>
                <SelectTrigger className="bg-card/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a24] border-white/10">
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="dollars">Dollars ($)</SelectItem>
                  <SelectItem value="ticks">Ticks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>
                Risk Amount {riskType === 'percentage' ? '(%)' : riskType === 'dollars' ? '($)' : '(Ticks)'}
              </Label>
              <Input
                type="number"
                value={riskAmount}
                onChange={(e) => setRiskAmount(e.target.value)}
                placeholder={riskType === 'percentage' ? '0.5' : riskType === 'dollars' ? '100' : '10'}
                step={riskType === 'percentage' ? '0.1' : '1'}
                className="bg-card/5 border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Stop Loss (Ticks)</Label>
              <Input
                type="number"
                value={stopLossTicks}
                onChange={(e) => setStopLossTicks(e.target.value)}
                placeholder="10"
                className="bg-card/5 border-white/10"
              />
            </div>
          </div>

          <Button
            onClick={calculateFutures}
            className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold"
            disabled={!futuresEquity || !riskAmount || !stopLossTicks}
          >
            <CalcIcon className="w-4 h-4 mr-2" />
            Calculate
          </Button>

          {futuresResult && (
            <div className="mt-6 p-6 rounded-xl bg-green-500/10 border border-green-500/20 space-y-4">
              <h3 className="font-semibold text-green-400 text-lg">Results</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Risk Amount</p>
                  <p className="text-2xl font-bold">${futuresResult.dollarRisk}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Risk Per Contract</p>
                  <p className="text-2xl font-bold">${futuresResult.riskPerContract}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-card/5 border border-white/10">
                <p className="text-sm text-gray-500 mb-2">Contracts to Trade</p>
                <p className="text-4xl font-bold text-green-400">
                  {futuresResult.roundedContracts} {futuresResult.contractType}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Exact: {futuresResult.contracts} contracts
                </p>
              </div>
              <div className="pt-3 border-t border-white/10">
                <p className="text-xs text-gray-500">Total Risk</p>
                <p className="text-lg font-semibold">${futuresResult.totalRisk}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}