/**
 * AI Prop Firm Research System
 * On-Demand Firm Discovery using Claude API
 * 
 * Backend implementation required for full functionality.
 * Currently provides placeholder responses.
 */

export const AI_RESEARCH_PROMPT = (firmName) => `
You are a prop trading research assistant. Research the prop trading firm "${firmName}" and return accurate, current information.

Find:
1. Official website URL
2. Company headquarters/location
3. Founded year (if available)
4. All available account sizes (in USD)
5. For each account size, find:
   - Challenge/evaluation fee
   - Profit target ($)
   - Maximum daily loss ($)
   - Maximum total drawdown ($)
   - Minimum trading days required
   - Maximum trading days allowed (if any)
   - Consistency rule (percentage, if applicable)
   - Profit split percentage
   - Scaling plan (yes/no)
   - Payout schedule
6. Special rules:
   - News trading allowed?
   - Weekend holding allowed?
   - EA/bots allowed?
   - Maximum leverage
   - Maximum contracts/lots
7. Asset class: Futures, Forex, or both?
8. Recent rule changes (last 6 months)

IMPORTANT FORMATTING REQUIREMENTS:
- Return ONLY valid JSON
- No markdown code blocks
- No preamble or explanatory text
- Numbers without currency symbols or commas
- Percentages as decimals (e.g., 80% = 0.80)
- Null for unknown values

JSON Structure:
{
  "firmId": "lowercase-firm-name",
  "name": "Official Firm Name",
  "category": "futures" or "forex",
  "logo": "relevant emoji",
  "website": "https://...",
  "founded": 2020 or null,
  "headquarters": "City, Country" or null,
  "verified": "${new Date().toISOString().split('T')[0]}",
  "accounts": {
    "account-id-1": {
      "id": "account-id-1",
      "name": "Firm Name 50K",
      "size": 50000,
      "fee": 165,
      "challengeType": "1-Step" or "2-Step" or null,
      "rules": {
        "profitTarget": 3000,
        "maxDailyLoss": 2500,
        "maxDrawdown": 2500,
        "minDays": 5,
        "maxDays": 30 or null,
        "consistencyRule": 0.40 or null,
        "maxContracts": 10 or null
      },
      "funded": {
        "split": 0.80,
        "scaling": true or false,
        "payout": "14 days" or "24 hours" or null
      }
    }
  },
  "confidence": "high" or "medium" or "low",
  "sources": ["url1", "url2"],
  "lastUpdated": "${new Date().toISOString().split('T')[0]}"
}

Verify information from multiple sources.
If you cannot find reliable information, mark confidence as "low" and note which fields are uncertain.
`;

/**
 * AI Research Function
 * Placeholder — requires backend Claude API endpoint
 */
export async function researchFirmWithAI(firmName) {
    // This is a placeholder for the backend implementation
    // Backend should call Claude API with the prompt above
    return {
        status: 'pending',
        message: `AI research for "${firmName}" ready to execute`,
        requiresBackend: true,
    };
}

/**
 * Verify AI-researched data before adding to database
 */
export function verifyAIResearch(firmData) {
    const issues = [];

    if (!firmData.name) issues.push('Missing firm name');
    if (!firmData.website) issues.push('Missing website');
    if (!firmData.accounts || Object.keys(firmData.accounts).length === 0) {
        issues.push('No accounts found');
    }

    Object.values(firmData.accounts || {}).forEach((account, index) => {
        if (!account.size) issues.push(`Account ${index + 1}: Missing size`);
        if (!account.rules?.profitTarget) issues.push(`Account ${index + 1}: Missing profit target`);
        if (!account.rules?.maxDailyLoss) issues.push(`Account ${index + 1}: Missing daily loss limit`);
    });

    return {
        valid: issues.length === 0,
        issues,
        confidence: firmData.confidence || 'unknown',
    };
}

/**
 * Create a firm submission request
 */
export function createFirmSubmission(firmName, submittedBy) {
    return {
        firmName,
        submittedBy,
        submittedAt: new Date().toISOString(),
        status: 'pending_research',
        votes: 1,
    };
}
