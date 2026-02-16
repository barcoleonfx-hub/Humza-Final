/**
 * FundedHub - Smart Prop Firm Database
 * Version 1.0 - Initial Launch
 * 
 * Coverage:
 * - 15 Top Futures Prop Firms
 * - 5 Top Forex Prop Firms  
 * - AI-Powered On-Demand Research for any other firm
 * 
 * Last Updated: February 13, 2026
 */

export const DATABASE_VERSION = '1.0.0';
export const LAST_UPDATE = '2026-02-13';

/**
 * COMPLETE PROP FIRM DATABASE
 * 20 Verified Firms with Accurate Rules
 */

export const PROP_FIRMS = {

  // ==================== FUTURES FIRMS (15) ====================

  // 1. TOPSTEP
  'topstep': {
    id: 'topstep',
    name: 'TopStep',
    category: 'futures',
    logo: '🎯',
    website: 'https://topstep.com',
    
    accounts: {
      'topstep-50k': {
        id: 'topstep-50k',
        name: 'TopStep 50K',
        size: 50000,
        fee: 165,
        
        rules: {
          profitTarget: 3000,
          maxDailyLoss: 1000,
          maxDrawdown: 2500,
          minDays: 5,
          maxDays: 30,
          consistencyRule: 0.40,
          maxContracts: 5,
        },
        
        funded: {
          split: 0.80,
          scaling: true,
        },
      },

      'topstep-100k': {
        id: 'topstep-100k',
        name: 'TopStep 100K',
        size: 100000,
        fee: 325,
        
        rules: {
          profitTarget: 6000,
          maxDailyLoss: 2000,
          maxDrawdown: 3000,
          minDays: 5,
          maxDays: 30,
          consistencyRule: 0.40,
          maxContracts: 10,
        },
        
        funded: {
          split: 0.80,
        },
      },

      'topstep-150k': {
        id: 'topstep-150k',
        name: 'TopStep 150K',
        size: 150000,
        fee: 375,
        
        rules: {
          profitTarget: 9000,
          maxDailyLoss: 3000,
          maxDrawdown: 4500,
          minDays: 5,
          maxDays: 30,
          consistencyRule: 0.40,
          maxContracts: 15,
        },
        
        funded: {
          split: 0.80,
        },
      },
    },
  },

  // 2. APEX
  'apex': {
    id: 'apex',
    name: 'Apex Trader Funding',
    category: 'futures',
    logo: '⚡',
    website: 'https://apextraderfunding.com',
    
    accounts: {
      'apex-25k': {
        id: 'apex-25k',
        name: 'Apex 25K',
        size: 25000,
        fee: 167,
        
        rules: {
          profitTarget: 1500,
          maxDailyLoss: 1250,
          maxDrawdown: 1750,
          minDays: 3,
          consistencyRule: null,
        },
        
        funded: {
          split: 0.90,
        },
      },

      'apex-50k': {
        id: 'apex-50k',
        name: 'Apex 50K',
        size: 50000,
        fee: 167,
        
        rules: {
          profitTarget: 3000,
          maxDailyLoss: 2500,
          maxDrawdown: 3000,
          minDays: 3,
        },
        
        funded: {
          split: 0.90,
        },
      },

      'apex-100k': {
        id: 'apex-100k',
        name: 'Apex 100K',
        size: 100000,
        fee: 167,
        
        rules: {
          profitTarget: 6000,
          maxDailyLoss: 5000,
          maxDrawdown: 6000,
          minDays: 3,
        },
        
        funded: {
          split: 0.90,
        },
      },

      'apex-150k': {
        id: 'apex-150k',
        name: 'Apex 150K',
        size: 150000,
        fee: 247,
        
        rules: {
          profitTarget: 9000,
          maxDailyLoss: 7500,
          maxDrawdown: 9000,
          minDays: 3,
        },
        
        funded: {
          split: 0.90,
        },
      },

      'apex-250k': {
        id: 'apex-250k',
        name: 'Apex 250K',
        size: 250000,
        fee: 377,
        
        rules: {
          profitTarget: 15000,
          maxDailyLoss: 12500,
          maxDrawdown: 15000,
          minDays: 3,
        },
        
        funded: {
          split: 0.90,
        },
      },
    },
  },

  // 3. LEELOO TRADING
  'leeloo': {
    id: 'leeloo',
    name: 'Leeloo Trading',
    category: 'futures',
    logo: '🎪',
    website: 'https://leelootrading.com',
    
    accounts: {
      'leeloo-25k': {
        id: 'leeloo-25k',
        name: 'Leeloo 25K',
        size: 25000,
        fee: 99,
        
        rules: {
          profitTarget: 2000,
          maxDailyLoss: 625,
          maxDrawdown: 1500,
          minDays: 3,
          maxContracts: 10,
        },
        
        funded: {
          split: 0.80,
        },
      },

      'leeloo-50k': {
        id: 'leeloo-50k',
        name: 'Leeloo 50K',
        size: 50000,
        fee: 129,
        
        rules: {
          profitTarget: 4000,
          maxDailyLoss: 1250,
          maxDrawdown: 3000,
          minDays: 3,
          maxContracts: 20,
        },
        
        funded: {
          split: 0.80,
        },
      },

      'leeloo-100k': {
        id: 'leeloo-100k',
        name: 'Leeloo 100K',
        size: 100000,
        fee: 229,
        
        rules: {
          profitTarget: 8000,
          maxDailyLoss: 2500,
          maxDrawdown: 6000,
          minDays: 3,
          maxContracts: 40,
        },
        
        funded: {
          split: 0.80,
        },
      },
    },
  },

  // 4. TRADEIFY
  'tradeify': {
    id: 'tradeify',
    name: 'Tradeify',
    category: 'futures',
    logo: '🔥',
    website: 'https://tradeify.com',
    
    accounts: {
      'tradeify-50k': {
        id: 'tradeify-50k',
        name: 'Tradeify 50K',
        size: 50000,
        fee: 150,
        
        rules: {
          profitTarget: 3000,
          maxDailyLoss: 1250,
          maxDrawdown: 2500,
          minDays: 4,
          maxContracts: 10,
        },
        
        funded: {
          split: 0.90,
        },
      },

      'tradeify-100k': {
        id: 'tradeify-100k',
        name: 'Tradeify 100K',
        size: 100000,
        fee: 250,
        
        rules: {
          profitTarget: 6000,
          maxDailyLoss: 2500,
          maxDrawdown: 5000,
          minDays: 4,
          maxContracts: 20,
        },
        
        funded: {
          split: 0.90,
        },
      },
    },
  },

  // 5. BULENOX
  'bulenox': {
    id: 'bulenox',
    name: 'Bulenox',
    category: 'futures',
    logo: '🚀',
    website: 'https://bulenox.com',
    
    accounts: {
      'bulenox-25k': {
        id: 'bulenox-25k',
        name: 'Bulenox 25K',
        size: 25000,
        fee: 99,
        
        rules: {
          profitTarget: 2000,
          maxDailyLoss: 1250,
          maxDrawdown: 2000,
          minDays: 3,
        },
        
        funded: {
          split: 0.80,
        },
      },

      'bulenox-50k': {
        id: 'bulenox-50k',
        name: 'Bulenox 50K',
        size: 50000,
        fee: 149,
        
        rules: {
          profitTarget: 4000,
          maxDailyLoss: 2500,
          maxDrawdown: 4000,
          minDays: 3,
        },
        
        funded: {
          split: 0.80,
        },
      },
    },
  },

  // 6. TAKE PROFIT TRADER
  'takeprofittrader': {
    id: 'takeprofittrader',
    name: 'Take Profit Trader',
    category: 'futures',
    logo: '💰',
    website: 'https://takeprofittrader.com',
    
    accounts: {
      'tpt-50k': {
        id: 'tpt-50k',
        name: 'Take Profit Trader 50K',
        size: 50000,
        fee: 165,
        
        rules: {
          profitTarget: 3000,
          maxDailyLoss: 2000,
          maxDrawdown: 2500,
          minDays: 5,
          maxContracts: 10,
        },
        
        funded: {
          split: 0.80,
        },
      },

      'tpt-100k': {
        id: 'tpt-100k',
        name: 'Take Profit Trader 100K',
        size: 100000,
        fee: 325,
        
        rules: {
          profitTarget: 6000,
          maxDailyLoss: 4000,
          maxDrawdown: 5000,
          minDays: 5,
          maxContracts: 20,
        },
        
        funded: {
          split: 0.80,
        },
      },
    },
  },

  // 7. ONEUP TRADER
  'oneup': {
    id: 'oneup',
    name: 'OneUp Trader',
    category: 'futures',
    logo: '📈',
    website: 'https://oneuptrader.com',
    
    accounts: {
      'oneup-25k': {
        id: 'oneup-25k',
        name: 'OneUp 25K',
        size: 25000,
        fee: 150,
        
        rules: {
          profitTarget: 1500,
          maxDailyLoss: 1000,
          maxDrawdown: 1500,
          minDays: 5,
        },
        
        funded: {
          split: 0.90,
        },
      },

      'oneup-50k': {
        id: 'oneup-50k',
        name: 'OneUp 50K',
        size: 50000,
        fee: 250,
        
        rules: {
          profitTarget: 3000,
          maxDailyLoss: 2000,
          maxDrawdown: 2500,
          minDays: 5,
        },
        
        funded: {
          split: 0.90,
        },
      },
    },
  },

  // 8. TRADEDAY
  'tradeday': {
    id: 'tradeday',
    name: 'TradeDay',
    category: 'futures',
    logo: '☀️',
    website: 'https://tradeday.com',
    
    accounts: {
      'tradeday-50k': {
        id: 'tradeday-50k',
        name: 'TradeDay 50K',
        size: 50000,
        fee: 165,
        
        rules: {
          profitTarget: 3000,
          maxDailyLoss: 2500,
          maxDrawdown: 2500,
          minDays: 0,
        },
        
        funded: {
          split: 0.80,
        },
      },
    },
  },

  // 9. MY FUNDED FUTURES
  'myfundedfutures': {
    id: 'myfundedfutures',
    name: 'My Funded Futures',
    category: 'futures',
    logo: '🎲',
    website: 'https://myfundedfutures.com',
    
    accounts: {
      'mff-50k': {
        id: 'mff-50k',
        name: 'My Funded Futures 50K',
        size: 50000,
        fee: 155,
        
        rules: {
          profitTarget: 3000,
          maxDailyLoss: 2000,
          maxDrawdown: 2500,
          minDays: 3,
        },
        
        funded: {
          split: 0.85,
        },
      },
    },
  },

  // 10. ELITE TRADER FUNDING
  'elite': {
    id: 'elite',
    name: 'Elite Trader Funding',
    category: 'futures',
    logo: '👑',
    website: 'https://elitetraderfunding.com',
    
    accounts: {
      'elite-50k': {
        id: 'elite-50k',
        name: 'Elite 50K',
        size: 50000,
        fee: 159,
        
        rules: {
          profitTarget: 3000,
          maxDailyLoss: 2500,
          maxDrawdown: 2500,
          minDays: 3,
        },
        
        funded: {
          split: 0.80,
        },
      },
    },
  },

  // 11. EARN2TRADE
  'earn2trade': {
    id: 'earn2trade',
    name: 'Earn2Trade',
    category: 'futures',
    logo: '🎓',
    website: 'https://earn2trade.com',
    
    accounts: {
      'e2t-25k': {
        id: 'e2t-25k',
        name: 'Earn2Trade 25K',
        size: 25000,
        fee: 250,
        
        rules: {
          profitTarget: 1800,
          maxDailyLoss: 1000,
          maxDrawdown: 1500,
          minDays: 12,
        },
        
        funded: {
          split: 0.80,
        },
      },
    },
  },

  // 12. FUNDING PIPS
  'fundingpips': {
    id: 'fundingpips',
    name: 'Funding Pips',
    category: 'futures',
    logo: '💵',
    website: 'https://fundingpips.com',
    
    accounts: {
      'fp-25k': {
        id: 'fp-25k',
        name: 'Funding Pips 25K',
        size: 25000,
        fee: 99,
        
        rules: {
          profitTarget: 2000,
          maxDailyLoss: 1500,
          maxDrawdown: 2000,
          minDays: 5,
        },
        
        funded: {
          split: 0.80,
        },
      },
    },
  },

  // 13. FUNDED TRADING PLUS
  'fundedtradingplus': {
    id: 'fundedtradingplus',
    name: 'Funded Trading Plus',
    category: 'futures',
    logo: '➕',
    website: 'https://fundedtradingplus.com',
    
    accounts: {
      'ftp-50k': {
        id: 'ftp-50k',
        name: 'Funded Trading Plus 50K',
        size: 50000,
        fee: 165,
        
        rules: {
          profitTarget: 3000,
          maxDailyLoss: 2500,
          maxDrawdown: 2500,
          minDays: 4,
        },
        
        funded: {
          split: 0.80,
        },
      },
    },
  },

  // 14. CITY TRADERS IMPERIUM
  'cti': {
    id: 'cti',
    name: 'City Traders Imperium',
    category: 'futures',
    logo: '🏛️',
    website: 'https://citytraders.com',
    
    accounts: {
      'cti-25k': {
        id: 'cti-25k',
        name: 'CTI 25K',
        size: 25000,
        fee: 99,
        
        rules: {
          profitTarget: 2000,
          maxDailyLoss: 1250,
          maxDrawdown: 2000,
          minDays: 3,
        },
        
        funded: {
          split: 0.80,
        },
      },
    },
  },

  // 15. BLUE GUARDIAN
  'blueguardian': {
    id: 'blueguardian',
    name: 'Blue Guardian',
    category: 'futures',
    logo: '🛡️',
    website: 'https://blueguardian.com',
    
    accounts: {
      'bg-50k': {
        id: 'bg-50k',
        name: 'Blue Guardian 50K',
        size: 50000,
        fee: 175,
        
        rules: {
          profitTarget: 3000,
          maxDailyLoss: 2500,
          maxDrawdown: 2500,
          minDays: 3,
        },
        
        funded: {
          split: 0.80,
          payout: '24 hours',
        },
      },
    },
  },

  // ==================== FOREX FIRMS (5) ====================

  // 1. FTMO
  'ftmo': {
    id: 'ftmo',
    name: 'FTMO',
    category: 'forex',
    logo: '🏆',
    website: 'https://ftmo.com',
    
    accounts: {
      'ftmo-10k': {
        id: 'ftmo-10k',
        name: 'FTMO 10K',
        size: 10000,
        fee: 155,
        challengeType: '2-Step',
        
        phase1: {
          profitTarget: 1000,
          maxDailyLoss: 500,
          maxDrawdown: 1000,
          minDays: 4,
        },
        
        phase2: {
          profitTarget: 500,
          maxDailyLoss: 500,
          maxDrawdown: 1000,
          minDays: 4,
        },
        
        funded: {
          split: 0.80,
          scaling: true,
        },
      },

      'ftmo-25k': {
        id: 'ftmo-25k',
        name: 'FTMO 25K',
        size: 25000,
        fee: 250,
        challengeType: '2-Step',
        
        phase1: {
          profitTarget: 2500,
          maxDailyLoss: 1250,
          maxDrawdown: 2500,
          minDays: 4,
        },
        
        phase2: {
          profitTarget: 1250,
          maxDailyLoss: 1250,
          maxDrawdown: 2500,
          minDays: 4,
        },
        
        funded: {
          split: 0.80,
          scaling: true,
        },
      },

      'ftmo-50k': {
        id: 'ftmo-50k',
        name: 'FTMO 50K',
        size: 50000,
        fee: 345,
        challengeType: '2-Step',
        
        phase1: {
          profitTarget: 5000,
          maxDailyLoss: 2500,
          maxDrawdown: 5000,
          minDays: 4,
        },
        
        phase2: {
          profitTarget: 2500,
          maxDailyLoss: 2500,
          maxDrawdown: 5000,
          minDays: 4,
        },
        
        funded: {
          split: 0.80,
          scaling: true,
        },
      },

      'ftmo-100k': {
        id: 'ftmo-100k',
        name: 'FTMO 100K',
        size: 100000,
        fee: 540,
        challengeType: '2-Step',
        
        phase1: {
          profitTarget: 10000,
          maxDailyLoss: 5000,
          maxDrawdown: 10000,
          minDays: 4,
        },
        
        phase2: {
          profitTarget: 5000,
          maxDailyLoss: 5000,
          maxDrawdown: 10000,
          minDays: 4,
        },
        
        funded: {
          split: 0.80,
          scaling: true,
        },
      },

      'ftmo-200k': {
        id: 'ftmo-200k',
        name: 'FTMO 200K',
        size: 200000,
        fee: 1080,
        challengeType: '2-Step',
        
        phase1: {
          profitTarget: 20000,
          maxDailyLoss: 10000,
          maxDrawdown: 20000,
          minDays: 4,
        },
        
        phase2: {
          profitTarget: 10000,
          maxDailyLoss: 10000,
          maxDrawdown: 20000,
          minDays: 4,
        },
        
        funded: {
          split: 0.80,
          scaling: true,
        },
      },
    },
  },

  // 2. FUNDEDNEXT
  'fundednext': {
    id: 'fundednext',
    name: 'FundedNext',
    category: 'forex',
    logo: '💎',
    website: 'https://fundednext.com',
    
    accounts: {
      'fn-6k': {
        id: 'fn-6k',
        name: 'FundedNext Stellar 6K',
        size: 6000,
        fee: 49,
        challengeType: '2-Step',
        
        phase1: {
          profitTarget: 480,
          maxDailyLoss: 300,
          maxDrawdown: 600,
          minDays: 5,
        },
        
        phase2: {
          profitTarget: 300,
          maxDailyLoss: 300,
          maxDrawdown: 600,
          minDays: 5,
        },
        
        funded: {
          split: 0.95,
          scaling: true,
          payout: '24 hours',
        },
      },

      'fn-15k': {
        id: 'fn-15k',
        name: 'FundedNext Stellar 15K',
        size: 15000,
        fee: 99,
        challengeType: '2-Step',
        
        phase1: {
          profitTarget: 1200,
          maxDailyLoss: 750,
          maxDrawdown: 1500,
          minDays: 5,
        },
        
        phase2: {
          profitTarget: 750,
          maxDailyLoss: 750,
          maxDrawdown: 1500,
          minDays: 5,
        },
        
        funded: {
          split: 0.95,
          scaling: true,
        },
      },

      'fn-25k': {
        id: 'fn-25k',
        name: 'FundedNext Stellar 25K',
        size: 25000,
        fee: 149,
        challengeType: '2-Step',
        
        phase1: {
          profitTarget: 2000,
          maxDailyLoss: 1250,
          maxDrawdown: 2500,
          minDays: 5,
        },
        
        phase2: {
          profitTarget: 1250,
          maxDailyLoss: 1250,
          maxDrawdown: 2500,
          minDays: 5,
        },
        
        funded: {
          split: 0.95,
          scaling: true,
        },
      },

      'fn-50k': {
        id: 'fn-50k',
        name: 'FundedNext Stellar 50K',
        size: 50000,
        fee: 249,
        challengeType: '2-Step',
        
        phase1: {
          profitTarget: 4000,
          maxDailyLoss: 2500,
          maxDrawdown: 5000,
          minDays: 5,
        },
        
        phase2: {
          profitTarget: 2500,
          maxDailyLoss: 2500,
          maxDrawdown: 5000,
          minDays: 5,
        },
        
        funded: {
          split: 0.95,
          scaling: true,
        },
      },

      'fn-100k': {
        id: 'fn-100k',
        name: 'FundedNext Stellar 100K',
        size: 100000,
        fee: 549,
        challengeType: '2-Step',
        
        phase1: {
          profitTarget: 8000,
          maxDailyLoss: 5000,
          maxDrawdown: 10000,
          minDays: 5,
        },
        
        phase2: {
          profitTarget: 5000,
          maxDailyLoss: 5000,
          maxDrawdown: 10000,
          minDays: 5,
        },
        
        funded: {
          split: 0.95,
          scaling: true,
        },
      },
    },
  },

  // 3. THE 5%ERS
  'the5ers': {
    id: 'the5ers',
    name: 'The 5%ers',
    category: 'forex',
    logo: '💯',
    website: 'https://the5ers.com',
    
    accounts: {
      'the5ers-6k': {
        id: 'the5ers-6k',
        name: 'The 5%ers 6K',
        size: 6000,
        fee: 195,
        
        rules: {
          profitTarget: 360,
          maxDailyLoss: 240,
          maxDrawdown: 360,
          minDays: 3,
        },
        
        funded: {
          split: 0.50,
          scaling: 'Aggressive',
        },
      },

      'the5ers-20k': {
        id: 'the5ers-20k',
        name: 'The 5%ers 20K',
        size: 20000,
        fee: 300,
        
        rules: {
          profitTarget: 1200,
          maxDailyLoss: 800,
          maxDrawdown: 1200,
          minDays: 3,
        },
        
        funded: {
          split: 0.50,
          scaling: 'Aggressive',
        },
      },

      'the5ers-40k': {
        id: 'the5ers-40k',
        name: 'The 5%ers 40K',
        size: 40000,
        fee: 395,
        
        rules: {
          profitTarget: 2400,
          maxDailyLoss: 1600,
          maxDrawdown: 2400,
          minDays: 3,
        },
        
        funded: {
          split: 0.50,
          scaling: 'Aggressive',
        },
      },
    },
  },

  // 4. E8 MARKETS
  'e8markets': {
    id: 'e8markets',
    name: 'E8 Markets',
    category: 'forex',
    logo: '🎱',
    website: 'https://e8markets.com',
    
    accounts: {
      'e8-25k': {
        id: 'e8-25k',
        name: 'E8 Markets 25K',
        size: 25000,
        fee: 68,
        
        rules: {
          profitTarget: 2000,
          maxDailyLoss: 1250,
          maxDrawdown: 2000,
          minDays: 2,
        },
        
        funded: {
          split: 0.80,
        },
      },

      'e8-100k': {
        id: 'e8-100k',
        name: 'E8 Markets 100K',
        size: 100000,
        fee: 228,
        
        rules: {
          profitTarget: 8000,
          maxDailyLoss: 5000,
          maxDrawdown: 8000,
          minDays: 2,
        },
        
        funded: {
          split: 0.80,
        },
      },
    },
  },

  // 5. MYFUNDEDFX
  'myfundedfx': {
    id: 'myfundedfx',
    name: 'MyFundedFX',
    category: 'forex',
    logo: '💰',
    website: 'https://myfundedfx.com',
    
    accounts: {
      'mffx-5k': {
        id: 'mffx-5k',
        name: 'MyFundedFX Rapid 5K',
        size: 5000,
        fee: 39,
        
        rules: {
          profitTarget: 400,
          maxDailyLoss: 250,
          maxDrawdown: 500,
          minDays: 0,
        },
        
        funded: {
          split: 0.80,
        },
      },

      'mffx-10k': {
        id: 'mffx-10k',
        name: 'MyFundedFX Rapid 10K',
        size: 10000,
        fee: 59,
        
        rules: {
          profitTarget: 800,
          maxDailyLoss: 500,
          maxDrawdown: 1000,
          minDays: 0,
        },
        
        funded: {
          split: 0.80,
        },
      },

      'mffx-25k': {
        id: 'mffx-25k',
        name: 'MyFundedFX Rapid 25K',
        size: 25000,
        fee: 99,
        
        rules: {
          profitTarget: 2000,
          maxDailyLoss: 1250,
          maxDrawdown: 2500,
          minDays: 0,
        },
        
        funded: {
          split: 0.80,
        },
      },

      'mffx-100k': {
        id: 'mffx-100k',
        name: 'MyFundedFX Rapid 100K',
        size: 100000,
        fee: 249,
        
        rules: {
          profitTarget: 8000,
          maxDailyLoss: 5000,
          maxDrawdown: 10000,
          minDays: 0,
        },
        
        funded: {
          split: 0.80,
        },
      },
    },
  },
};

/**
 * Helper Functions
 */

export function getAllFirms() {
  return Object.values(PROP_FIRMS).map(firm => ({
    id: firm.id,
    name: firm.name,
    logo: firm.logo,
    category: firm.category,
    accountCount: Object.keys(firm.accounts).length,
  }));
}

export function getFirmsByCategory(category) {
  return Object.values(PROP_FIRMS)
    .filter(firm => firm.category === category)
    .map(firm => ({
      id: firm.id,
      name: firm.name,
      logo: firm.logo,
      accountCount: Object.keys(firm.accounts).length,
    }));
}

export function getFirmAccounts(firmId) {
  const firm = PROP_FIRMS[firmId];
  if (!firm) return [];
  
  return Object.values(firm.accounts).map(account => ({
    ...account,
    firmName: firm.name,
    firmLogo: firm.logo,
    firmId: firm.id,
  }));
}

export function getAccountById(accountId) {
  for (const firm of Object.values(PROP_FIRMS)) {
    if (firm.accounts[accountId]) {
      return {
        ...firm.accounts[accountId],
        firmName: firm.name,
        firmLogo: firm.logo,
        firmId: firm.id,
        category: firm.category,
      };
    }
  }
  return null;
}

/**
 * Smart Search with Natural Language
 */
export function searchAccounts(query) {
  const results = [];
  const q = query.toLowerCase().replace(/[,$]/g, '');
  
  Object.values(PROP_FIRMS).forEach(firm => {
    Object.values(firm.accounts).forEach(account => {
      let score = 0;
      
      // Firm name match
      if (firm.name.toLowerCase().includes(q)) score += 50;
      
      // Account size match
      const sizeMatch = q.match(/(\d+)k?/);
      if (sizeMatch) {
        const querySize = parseInt(sizeMatch[1]) * (q.includes('k') ? 1000 : 1);
        if (account.size === querySize) score += 100;
        else if (Math.abs(account.size - querySize) < 10000) score += 50;
      }
      
      // Category match
      if (q.includes('forex') && firm.category === 'forex') score += 30;
      if (q.includes('futures') && firm.category === 'futures') score += 30;
      
      // Challenge type match
      if (account.challengeType) {
        if (q.includes('1-step') && account.challengeType.includes('1-Step')) score += 40;
        if (q.includes('2-step') && account.challengeType.includes('2-Step')) score += 40;
      }
      
      if (score > 0) {
        results.push({
          ...account,
          firmName: firm.name,
          firmLogo: firm.logo,
          firmId: firm.id,
          category: firm.category,
          matchScore: score,
        });
      }
    });
  });
  
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

export default PROP_FIRMS;
