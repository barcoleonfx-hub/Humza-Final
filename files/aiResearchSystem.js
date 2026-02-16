/**
 * AI Prop Firm Research System
 * On-Demand Firm Discovery using Claude API
 */

/**
 * This component will be called when a user searches for a firm
 * that's not in our database
 * 
 * Backend implementation required
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
 * To be implemented on backend with Claude API
 */
export async function researchFirmWithAI(firmName) {
  // This is a placeholder for the backend implementation
  // Backend should call Claude API with the prompt above
  
  const prompt = AI_RESEARCH_PROMPT(firmName);
  
  // Example backend call (pseudo-code):
  /*
  const response = await fetch('/api/research-firm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      firmName,
      prompt 
    })
  });
  
  const data = await response.json();
  return data.firmData;
  */
  
  return {
    status: 'pending',
    message: `AI research for "${firmName}" ready to execute`,
    requiresBackend: true,
  };
}

/**
 * Verify AI-researched data before adding to database
 * Admin approval flow
 */
export function verifyAIResearch(firmData) {
  const issues = [];
  
  // Validate required fields
  if (!firmData.name) issues.push('Missing firm name');
  if (!firmData.website) issues.push('Missing website');
  if (!firmData.accounts || Object.keys(firmData.accounts).length === 0) {
    issues.push('No accounts found');
  }
  
  // Validate account data
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
 * Example usage in UI:
 * 
 * When user searches "Funded Trader" (not in database):
 * 
 * 1. Show: "Funded Trader not found. Research with AI?"
 * 2. User clicks "Research with AI"
 * 3. Show loading: "Researching Funded Trader across the web..."
 * 4. Call researchFirmWithAI('Funded Trader')
 * 5. Show results: "Found Funded Trader! Verify before adding?"
 * 6. Admin/user reviews AI findings
 * 7. Click "Add to Database" → saves to localStorage + backend
 */

/**
 * User submission format
 * Allows traders to submit firms for research
 */
export function createFirmSubmission(firmName, submittedBy) {
  return {
    firmName,
    submittedBy,
    submittedAt: new Date().toISOString(),
    status: 'pending_research',
    votes: 1, // Community voting system
  };
}

/**
 * Community voting for firm requests
 */
export function voteForFirmRequest(firmName) {
  // Increment vote count in backend
  // When votes reach threshold (e.g., 10), auto-trigger AI research
  return {
    firmName,
    newVoteCount: 1, // Placeholder
  };
}

export default {
  researchFirmWithAI,
  verifyAIResearch,
  createFirmSubmission,
  voteForFirmRequest,
};
