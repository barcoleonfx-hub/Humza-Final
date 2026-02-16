/**
 * FundedHub - Smart Prop Firm Database v3.0 (Verified Schema)
 * 
 * SCHEMA CHANGE:
 * - Firms now span multiple 'Plan Families' (e.g. Rapid vs Legacy).
 * - Plans have verification metadata.
 * - Rules are explicit.
 */

export const DATABASE_VERSION = '3.0.0';
export const LAST_UPDATE = '2026-02-14';

const getLogo = (domain) => `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;

// Helper to create a plan object with verification meta
const plan = (id, size, price, rules, meta = {}) => ({
    id,
    size,
    price,
    ...rules,
    ...meta,
    lastVerified: '2026-02-14T12:00:00Z',
    verificationStatus: 'Verified',
    source: meta.source || 'Manual Web Verification'
});

export const PROP_FIRMS = [
    {
        id: 'topstep',
        name: 'Topstep',
        website: 'https://topstep.com',
        logo: getLogo('topstep.com'),
        type: 'Futures',
        lastVerified: '2026-02-14',
        notes: 'Industry leader. End-of-day trailing drawdown calculated from peak equity. Payouts processed daily.',
        planFamilies: [
            {
                id: 'combine',
                name: 'Trading Combine',
                description: 'The standard 1-step evaluation.',
                plans: [
                    plan('ts-50k', 50000, 49, { billing: 'Monthly', profitTarget: 3000, dailyLoss: 1000, maxDrawdown: 2000, ddType: 'Trailing (EOD)', minDays: 5, consistency: '50%' }),
                    plan('ts-100k', 100000, 99, { billing: 'Monthly', profitTarget: 6000, dailyLoss: 2000, maxDrawdown: 3000, ddType: 'Trailing (EOD)', minDays: 5, consistency: '50%' }),
                    plan('ts-150k', 150000, 149, { billing: 'Monthly', profitTarget: 9000, dailyLoss: 3000, maxDrawdown: 4500, ddType: 'Trailing (EOD)', minDays: 5, consistency: '50%' })
                ]
            },
            {
                id: 'xpress',
                name: 'Xpress',
                description: 'No daily loss limit. Higher scaling potential.',
                plans: [
                    plan('tsx-50k', 50000, 59, { billing: 'Monthly', profitTarget: 3000, dailyLoss: null, maxDrawdown: 2000, ddType: 'Trailing (EOD)', minDays: 5, consistency: '50%' }),
                    plan('tsx-100k', 100000, 109, { billing: 'Monthly', profitTarget: 6000, dailyLoss: null, maxDrawdown: 3000, ddType: 'Trailing (EOD)', minDays: 5, consistency: '50%' })
                ]
            }
        ]
    },
    {
        id: 'apex',
        name: 'Apex Trader Funding',
        website: 'https://apextraderfunding.com',
        logo: getLogo('apextraderfunding.com'),
        type: 'Futures',
        lastVerified: '2026-02-14',
        notes: 'Trailing threshold is REAL-TIME (intraday), not EOD. This is harder. Very frequent sales (up to 90% off).',
        planFamilies: [
            {
                id: 'evaluation',
                name: 'Evaluation (1-Step)',
                description: 'Standard 7-day pass. Intraday trailing drawdown.',
                plans: [
                    plan('apex-25k', 25000, 147, { billing: 'Monthly', profitTarget: 1500, dailyLoss: null, maxDrawdown: 1500, ddType: 'Trailing (Intraday)', minDays: 7 }),
                    plan('apex-50k', 50000, 167, { billing: 'Monthly', profitTarget: 3000, dailyLoss: null, maxDrawdown: 2500, ddType: 'Trailing (Intraday)', minDays: 7 }),
                    plan('apex-75k', 75000, 187, { billing: 'Monthly', profitTarget: 4250, dailyLoss: null, maxDrawdown: 2750, ddType: 'Trailing (Intraday)', minDays: 7 }),
                    plan('apex-100k', 100000, 207, { billing: 'Monthly', profitTarget: 6000, dailyLoss: null, maxDrawdown: 3000, ddType: 'Trailing (Intraday)', minDays: 7 }),
                    plan('apex-150k', 150000, 297, { billing: 'Monthly', profitTarget: 9000, dailyLoss: null, maxDrawdown: 5000, ddType: 'Trailing (Intraday)', minDays: 7 }),
                    plan('apex-250k', 250000, 517, { billing: 'Monthly', profitTarget: 15000, dailyLoss: null, maxDrawdown: 6500, ddType: 'Trailing (Intraday)', minDays: 7 }),
                    plan('apex-300k', 300000, 657, { billing: 'Monthly', profitTarget: 20000, dailyLoss: null, maxDrawdown: 7500, ddType: 'Trailing (Intraday)', minDays: 7 })
                ]
            }
        ]
    },
    {
        id: 'myfundedfutures',
        name: 'MyFundedFutures',
        website: 'https://myfundedfutures.com',
        logo: getLogo('myfundedfutures.com'),
        type: 'Futures',
        lastVerified: '2026-02-14',
        notes: 'Offers "Expert" (EOD Drawdown) vs "Starter" (Intraday). Choose carefully.',
        planFamilies: [
            {
                id: 'expert',
                name: 'Expert (EOD DD)',
                description: 'End-of-Day Trailing. Safer. No scaling plan.',
                plans: [
                    plan('mff-exp-50k', 50000, 165, { billing: 'Monthly', profitTarget: 3000, dailyLoss: null, maxDrawdown: 2000, ddType: 'Trailing (EOD)', minDays: 1 }),
                    plan('mff-exp-100k', 100000, 295, { billing: 'Monthly', profitTarget: 6000, dailyLoss: null, maxDrawdown: 3500, ddType: 'Trailing (EOD)', minDays: 1 }),
                    plan('mff-exp-150k', 150000, 395, { billing: 'Monthly', profitTarget: 9000, dailyLoss: null, maxDrawdown: 4500, ddType: 'Trailing (EOD)', minDays: 1 })
                ]
            },
            {
                id: 'starter',
                name: 'Starter (Intraday DD)',
                description: 'Real-time Trailing. Cheaper. Simpler rules.',
                plans: [
                    plan('mff-start-50k', 50000, 100, { billing: 'Monthly', profitTarget: 3000, dailyLoss: null, maxDrawdown: 2000, ddType: 'Trailing (Intraday)', minDays: 1 }),
                    plan('mff-start-100k', 100000, 200, { billing: 'Monthly', profitTarget: 6000, dailyLoss: null, maxDrawdown: 3500, ddType: 'Trailing (Intraday)', minDays: 1 })
                ]
            }
        ]
    },
    {
        id: 'lucid',
        name: 'Lucid Trading',
        website: 'https://lucidtrading.com',
        logo: getLogo('lucidtrading.com'),
        type: 'Futures',
        lastVerified: '2026-02-14',
        notes: 'LucidFlex allows no consistency rule in funded stage.',
        planFamilies: [
            {
                id: 'lucid-flex',
                name: 'LucidFlex',
                description: 'No consistency rule. 1-Step.',
                plans: [
                    plan('lucid-flex-50k', 50000, 91, { billing: 'One-time', profitTarget: 3000, dailyLoss: null, maxDrawdown: 2500, ddType: 'Trailing (EOD)', minDays: 5 }),
                ]
            },
            {
                id: 'lucid-pro',
                name: 'LucidPro',
                description: 'Standard account. Daily loss limits apply.',
                plans: [
                    plan('lucid-pro-50k', 50000, 108, { billing: 'One-time', profitTarget: 3000, dailyLoss: 1000, maxDrawdown: 2500, ddType: 'Trailing (EOD)', minDays: 5, consistency: '40%' }),
                ]
            }
        ]
    },
    {
        id: 'fundednext_futures',
        name: 'FundedNext Futures',
        website: 'https://fundednext.com',
        logo: getLogo('fundednext.com'),
        type: 'Futures',
        lastVerified: '2026-02-14',
        notes: 'Dedicated futures division. EOD Trailing.',
        planFamilies: [
            {
                id: 'fn-rapid',
                name: 'Rapid Futures',
                description: '1-Step. Fast scaling.',
                plans: [
                    plan('fn-rap-50k', 50000, 169, { billing: 'One-time', profitTarget: 3000, dailyLoss: null, maxDrawdown: 2000, ddType: 'Trailing (EOD)', minDays: 0, consistency: '40%' }),
                ]
            },
            {
                id: 'fn-legacy',
                name: 'Legacy Futures',
                description: '1-Step. No consistency rule.',
                plans: [
                    plan('fn-leg-50k', 50000, 169, { billing: 'One-time', profitTarget: 3000, dailyLoss: null, maxDrawdown: 2500, ddType: 'Trailing (EOD)', minDays: 5 }),
                ]
            }
        ]
    },
    {
        id: 'ftmo',
        name: 'FTMO',
        website: 'https://ftmo.com',
        logo: getLogo('ftmo.com'),
        type: 'Forex',
        lastVerified: '2026-02-14',
        notes: 'The gold standard in Forex. 2-Step evaluation. Strict but reliable.',
        planFamilies: [
            {
                id: 'ftmo-normal',
                name: 'Normal (Refundable)',
                description: '2-Step Challenge. 10% Target.',
                plans: [
                    plan('ftmo-10k', 10000, 155, { billing: 'One-time', profitTarget: 1000, dailyLoss: 500, maxDrawdown: 1000, ddType: 'Static/Equity', minDays: 4 }),
                    plan('ftmo-25k', 25000, 250, { billing: 'One-time', profitTarget: 2500, dailyLoss: 1250, maxDrawdown: 2500, ddType: 'Static/Equity', minDays: 4 }),
                    plan('ftmo-50k', 50000, 345, { billing: 'One-time', profitTarget: 5000, dailyLoss: 2500, maxDrawdown: 5000, ddType: 'Static/Equity', minDays: 4 }),
                    plan('ftmo-100k', 100000, 540, { billing: 'One-time', profitTarget: 10000, dailyLoss: 5000, maxDrawdown: 10000, ddType: 'Static/Equity', minDays: 4 }),
                ]
            }
        ]
    }
];

// --- Helpers ---

export function getFirmById(id) {
    return PROP_FIRMS.find(f => f.id === id);
}

export function getAllPlans() {
    return PROP_FIRMS.flatMap(f =>
        f.planFamilies.flatMap(fam =>
            fam.plans.map(p => ({ ...p, firmName: f.name, firmId: f.id, familyName: fam.name, type: f.type }))
        )
    );
}
