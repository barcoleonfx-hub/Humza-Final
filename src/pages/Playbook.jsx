import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  TrendingUp, 
  BarChart3, 
  Activity,
  Layers,
  Target,
  LineChart,
  Zap,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from "@/lib/utils";

const PLAYBOOK_SECTIONS = [
  {
    id: 'ict',
    title: 'ICT Concepts',
    icon: Target,
    color: 'green',
    topics: [
      {
        name: 'Market Structure',
        content: `**Market Structure** is the foundation of ICT trading methodology.

**Key Concepts:**
• **Higher Highs (HH) & Higher Lows (HL)** = Bullish Market Structure
• **Lower Highs (LH) & Lower Lows (LL)** = Bearish Market Structure
• **Break of Structure (BOS):** Price breaks the most recent high/low in the direction of the trend
• **Market Structure Shift (MSS):** Price breaks counter-trend structure, signaling a potential reversal

**How to Use:**
1. Identify the current market structure on higher timeframes (4H, Daily)
2. Look for BOS in the direction of the trend for continuation entries
3. Watch for MSS as early reversal signals
4. Trade with the structure, not against it

**Pro Tip:** Wait for a clear BOS before entering continuation trades. Don't anticipate.`
      },
      {
        name: 'Fair Value Gaps (FVG)',
        content: `**Fair Value Gaps** are inefficiencies in price delivery caused by aggressive buying or selling.

**Identification:**
• A 3-candle pattern where the wick of candle 1 doesn't touch the wick of candle 3
• The gap between them is the FVG
• Bullish FVG = gap created by strong buying (price likely to return to fill)
• Bearish FVG = gap created by strong selling

**Types:**
• **Regular FVG:** Any standard gap
• **Inverse FVG (IFVG):** A FVG within a FVG, often more powerful
• **Propulsion Block:** The FVG that causes displacement

**Trading Strategy:**
1. Mark all FVGs on your chart
2. Wait for price to return to the FVG (50% fill is common)
3. Enter on lower timeframe confirmation within the FVG
4. Target the next liquidity pool or opposing FVG

**Important:** Not all FVGs get filled. Prioritize FVGs in premium/discount arrays.`
      },
      {
        name: 'Liquidity Concepts',
        content: `**Liquidity** is where stop losses and buy/sell orders are resting. Smart money hunts liquidity.

**Types of Liquidity:**
• **Buy-Side Liquidity (BSL):** Above equal highs, resistance levels
• **Sell-Side Liquidity (SSL):** Below equal lows, support levels
• **Internal Liquidity:** Liquidity within a range
• **External Liquidity:** Liquidity outside the current structure

**Liquidity Sweeps:**
• Price briefly breaks above/below a level to trigger stops
• Often followed by immediate reversal (liquidity grab)
• This is a common institutional entry technique

**How to Trade Liquidity:**
1. Identify clear liquidity pools (equal highs/lows)
2. Expect price to reach these levels before reversing
3. Enter after the sweep with confirmation (FVG, order block)
4. Target opposing liquidity

**Kill Zone Tip:** Liquidity sweeps often occur during kill zones (2-5 AM, 8:30-11 AM NY time).`
      },
      {
        name: 'Order Blocks',
        content: `**Order Blocks** are the last up-candle before a bearish move or last down-candle before a bullish move.

**Characteristics:**
• Represents institutional order flow
• Often accompanied by displacement (strong directional move)
• Can be found on all timeframes
• Higher timeframe order blocks are more significant

**Bullish Order Block:**
• Last down candle before strong bullish move
• Expect price to return and bounce from this zone

**Bearish Order Block:**
• Last up candle before strong bearish move
• Expect price to return and reject from this zone

**Trading Order Blocks:**
1. Identify displacement moves (strong momentum)
2. Mark the last opposing candle before displacement
3. Wait for price to return to the order block
4. Enter on lower timeframe confirmation (FVG, displacement)
5. Target next liquidity or order block

**Refinement:** Use the FVG within the order block for precise entries.`
      },
      {
        name: 'Kill Zones',
        content: `**Kill Zones** are specific times when institutional order flow is most active.

**Three Main Kill Zones (New York Time):**
• **Asian Kill Zone:** 20:00 - 00:00 (8 PM - 12 AM)
• **London Kill Zone:** 02:00 - 05:00 (2 AM - 5 AM)
• **New York Kill Zone:** 08:30 - 11:00 (8:30 AM - 11 AM)

**Additional Important Times:**
• **London Close:** 11:00 - 12:00 (important for FX)
• **New York Lunch:** 12:00 - 13:30 (often ranging)
• **New York Close:** 16:00 - 17:00

**How to Use:**
1. Focus your trading during these windows
2. Expect the highest volume and best moves during kill zones
3. Avoid trading outside these times (especially during lunch)
4. London and NY kill zones often show the cleanest setups

**Pro Strategy:** Wait for the first 15-30 minutes of a kill zone to establish direction, then trade with the bias.`
      },
      {
        name: 'Premium & Discount Arrays',
        content: `**Premium/Discount** helps you determine if price is expensive or cheap relative to a range.

**Concept:**
• Draw a range from a significant low to significant high
• **Discount Zone:** Lower 50% (0-50%) - price is "cheap"
• **Equilibrium:** 50% - fair value
• **Premium Zone:** Upper 50% (50-100%) - price is "expensive"

**Trading Rules:**
• **Look for longs in discount** (price is cheap)
• **Look for shorts in premium** (price is expensive)
• Avoid trading at equilibrium (50%) - no edge

**Advanced Application:**
1. Identify daily/weekly range
2. Wait for price to reach premium (for shorts) or discount (for longs)
3. Combine with FVG, order block, or liquidity sweep
4. Target equilibrium or opposing premium/discount

**Key Insight:** Institutions buy at discount and sell at premium. Follow their footsteps.`
      }
    ]
  },
  {
    id: 'orderflow',
    title: 'Order Flow',
    icon: Activity,
    color: 'blue',
    topics: [
      {
        name: 'What is Order Flow?',
        content: `**Order Flow** is the process of tracking buy and sell orders to understand market direction.

**Core Principle:**
Markets move because of buying and selling pressure, not indicators. Order flow shows you WHO is in control.

**Key Components:**
• **Bid:** Price buyers are willing to pay
• **Ask:** Price sellers are willing to accept
• **Volume at Price:** How much volume traded at each price level
• **Delta:** Difference between buy volume and sell volume

**Why It Matters:**
• Reveals institutional activity
• Shows absorption (when large orders stop price movement)
• Identifies where aggressive buyers/sellers are entering
• Helps you trade with smart money, not against it

**Getting Started:**
1. Focus on volume at key levels
2. Watch for large volume spikes (institutional activity)
3. Observe bid/ask imbalances
4. Confirm with price action and structure`
      },
      {
        name: 'Volume Profile',
        content: `**Volume Profile** shows the distribution of volume at different price levels over a period.

**Key Areas:**
• **Point of Control (POC):** Price level with the most volume - acts as a magnet
• **High Volume Nodes (HVN):** Areas with significant volume - support/resistance
• **Low Volume Nodes (LVN):** Areas with little volume - price moves quickly through

**Trading Applications:**
1. **POC as Support/Resistance:** Price often returns to POC
2. **LVN as Targets:** Price moves quickly through low volume areas
3. **Value Area:** Where 70% of volume occurred - expect mean reversion

**How to Use:**
• Use daily/weekly volume profile to identify key levels
• Enter trades at HVN edges (support/resistance)
• Target LVN areas for quick moves
• Avoid entering in the middle of HVN (no edge)

**Pro Tip:** Combine volume profile with market structure for high-probability setups.`
      },
      {
        name: 'Absorption & Exhaustion',
        content: `**Absorption** occurs when large orders prevent price from moving further, signaling potential reversal.

**How to Identify:**
• Large volume spike but price doesn't move much
• Multiple candles with high volume at the same level
• Repeated failed attempts to break a level

**Exhaustion Signals:**
• Decreasing momentum with increasing volume
• Price hitting a level multiple times without breaking
• Candle wicks getting longer (rejection)
• Lower highs on an uptrend or higher lows on a downtrend

**Trading Exhaustion:**
1. Wait for clear exhaustion signs at key levels
2. Confirm with divergence (price up, volume/momentum down)
3. Enter on lower timeframe reversal pattern
4. Target the previous swing or liquidity pool

**Warning:** Don't confuse consolidation with exhaustion. Look for clear volume and momentum divergence.`
      },
      {
        name: 'Delta & Imbalances',
        content: `**Delta** measures the difference between aggressive buying and aggressive selling.

**Understanding Delta:**
• **Positive Delta:** More buying pressure (bullish)
• **Negative Delta:** More selling pressure (bearish)
• **Cumulative Delta:** Running total of delta over time

**Delta Divergence:**
• Price makes new high but delta doesn't = weakness (potential reversal)
• Price makes new low but delta doesn't = strength (potential reversal)

**Order Flow Imbalance:**
• When one side overwhelms the other at a specific price
• Shows aggressive buying/selling
• Often leads to continued movement in that direction

**How to Trade:**
1. Watch cumulative delta for overall bias
2. Look for delta divergences at key levels
3. Trade in the direction of delta momentum
4. Use imbalances to confirm breakouts

**Key Rule:** When delta and price agree, the move is strong. When they diverge, expect a reversal.`
      }
    ]
  },
  {
    id: 'supply-demand',
    title: 'Supply & Demand',
    icon: Layers,
    color: 'purple',
    topics: [
      {
        name: 'Supply & Demand Basics',
        content: `**Supply & Demand Zones** are areas where institutional orders created significant price movement.

**Demand Zones (Support):**
• Price drops to a level, then rallies strongly
• Represents buying pressure (demand > supply)
• Expect price to bounce when returning to this zone

**Supply Zones (Resistance):**
• Price rallies to a level, then drops strongly
• Represents selling pressure (supply > demand)
• Expect price to reverse when returning to this zone

**Difference from Support/Resistance:**
• S/R are lines; S&D are zones
• S/R are touched multiple times; Fresh S&D zones are untouched
• S&D focuses on imbalance and origin of moves

**Identifying Valid Zones:**
1. Find a strong move (displacement)
2. Mark the consolidation before the move
3. The zone is the base of the move (last structure before displacement)
4. Fresh zones (untouched) are stronger`
      },
      {
        name: 'Fresh vs Tested Zones',
        content: `**Fresh Zones** have never been retested and carry the most potential energy.

**Fresh Zone Characteristics:**
• Never revisited after the initial move
• Holds unfilled institutional orders
• Higher probability of strong reaction
• Should be prioritized over tested zones

**Tested Zones:**
• Price has returned and reacted before
• Each test weakens the zone slightly
• Still tradeable but less powerful
• After 2-3 tests, consider zone exhausted

**Zone Quality Ranking:**
1. Fresh zone with strong displacement
2. Fresh zone with moderate move
3. Once-tested zone that held perfectly
4. Multiple-tested zone (use with caution)

**Trading Strategy:**
• Mark all fresh zones on higher timeframes
• Wait for price to return to a fresh zone
• Enter on lower timeframe confirmation
• First touch is usually the strongest

**Remember:** Once a zone is broken, it flips (demand becomes supply, supply becomes demand).`
      },
      {
        name: 'Zone Refinement',
        content: `**Refining Zones** helps you find precise entry points and reduce risk.

**Steps to Refine:**
1. Identify the zone on higher timeframe (4H, Daily)
2. Drop to lower timeframe (15m, 5m)
3. Find the exact origin candle (last candle before displacement)
4. Mark the candle's body or wick as your refined zone
5. Enter within this refined zone, not the entire range

**Benefits:**
• Tighter stop losses
• Better risk-reward ratios
• More precise entries
• Higher win rate

**Advanced Refinement:**
• Use the FVG within the zone
• Use the order block within the zone
• Combine with Fibonacci levels (0.618, 0.786)

**Example:**
• Daily shows a demand zone from 100-105
• Drop to 15m and find the last down candle at 102
• Your refined entry is 101.50-102.50, not 100-105
• Stop below 101, target 110+

**Pro Tip:** Always refine on lower timeframes before entering. The tighter your zone, the better your R:R.`
      },
      {
        name: 'Combining S&D with Structure',
        content: `**Market Structure + Supply/Demand** creates the most powerful trading setups.

**The Combination:**
1. Use market structure to determine bias (bullish/bearish)
2. Identify supply/demand zones in the direction of structure
3. Wait for price to return to the zone
4. Enter with confluence

**Bullish Setup:**
• Market structure is bullish (HH, HL)
• Identify a fresh demand zone
• Wait for price to retrace to the zone
• Enter long with confirmation
• Target next supply zone or liquidity

**Bearish Setup:**
• Market structure is bearish (LH, LL)
• Identify a fresh supply zone
• Wait for price to retrace to the zone
• Enter short with confirmation
• Target next demand zone or liquidity

**Confirmation Checklist:**
✓ Structure bias is clear
✓ Zone is fresh or high quality
✓ Price is in premium (shorts) or discount (longs)
✓ Lower timeframe shows reversal pattern
✓ Kill zone timing (optional but preferred)

**Remember:** Structure gives you direction, zones give you location, confirmation gives you timing.`
      }
    ]
  },
  {
    id: 'fibonacci',
    title: 'Fibonacci Levels',
    icon: TrendingUp,
    color: 'yellow',
    topics: [
      {
        name: 'Fibonacci Retracements',
        content: `**Fibonacci Retracements** help identify potential reversal levels during pullbacks.

**Key Levels:**
• **0.236 (23.6%):** Shallow retracement
• **0.382 (38.2%):** Moderate retracement
• **0.500 (50%):** Equilibrium (not a Fib level, but commonly used)
• **0.618 (61.8%):** Golden ratio - most important
• **0.786 (78.6%):** Deep retracement

**How to Draw:**
1. Identify a significant swing low to swing high (uptrend)
2. Or swing high to swing low (downtrend)
3. Tool will automatically plot retracement levels
4. Price often retraces to these levels before continuing

**Trading Strategy:**
• **0.618 is the strongest level** - prioritize this
• Combine with demand/supply zones for confluence
• Wait for price reaction at the level
• Enter with lower timeframe confirmation
• Stop loss below the next Fib level

**Common Mistake:** Don't enter blindly at Fib levels. Wait for confirmation (candlestick pattern, structure, order block).`
      },
      {
        name: 'Fibonacci Extensions',
        content: `**Fibonacci Extensions** help project potential profit targets beyond the initial move.

**Key Extension Levels:**
• **1.272 (127.2%):** First target
• **1.414 (141.4%):** Moderate extension
• **1.618 (161.8%):** Golden ratio extension - primary target
• **2.000 (200%):** Full extension
• **2.618 (261.8%):** Extreme extension

**How to Use:**
1. Draw from swing low → swing high → retracement low (for uptrend)
2. Extensions project upward targets
3. Use these levels as profit targets
4. Common to see price react at 1.618

**Trading Application:**
• Enter at Fib retracement (0.618)
• Target Fib extension (1.618)
• This gives excellent risk-reward ratios
• Partial profits at 1.272, full exit at 1.618

**Pro Strategy:**
• Combine with supply/demand zones at extension levels
• If price breaks 1.618, next target is 2.618
• Extensions work on all timeframes

**Example:**
• Stock moves from $100 → $150, retraces to $130 (0.618)
• Extension targets: $165 (1.272), $180 (1.618), $200 (2.0)
• Enter at $130, target $180 = $50 upside, $10 risk = 5:1 R:R`
      },
      {
        name: 'Optimal Trade Entry (OTE)',
        content: `**Optimal Trade Entry (OTE)** is the 0.618-0.786 Fibonacci zone, considered the best entry area.

**Why OTE Works:**
• Represents the "sweet spot" for entries
• Combines deep enough retracement with continuation potential
• Aligns with institutional order flow
• Often coincides with demand/supply zones

**OTE Zone:**
• Draw Fib from swing low to swing high
• The 0.618-0.786 zone is your OTE
• Price often finds support/resistance here
• Highest probability reversal area

**How to Trade OTE:**
1. Wait for price to enter the 0.618-0.786 zone
2. Look for lower timeframe confirmation:
   - Bullish engulfing
   - FVG fill
   - Order block reaction
   - Liquidity sweep
3. Enter within the OTE zone
4. Stop loss below 0.786 (or 1.0)
5. Target previous high/low or Fib extensions

**Confluence Booster:**
• OTE + Demand Zone = High probability long
• OTE + Supply Zone = High probability short
• OTE + Kill Zone timing = Even better

**Important:** Not all OTE levels hold. Always wait for confirmation before entering.`
      }
    ]
  },
  {
    id: 'indicators',
    title: 'Key Indicators',
    icon: LineChart,
    color: 'red',
    topics: [
      {
        name: 'VWAP (Volume Weighted Average Price)',
        content: `**VWAP** shows the average price weighted by volume, used by institutions to assess fair value.

**What VWAP Shows:**
• The "fair price" based on volume
• Institutional buying/selling benchmark
• Dynamic support/resistance level
• Market sentiment (above = bullish, below = bearish)

**How to Use:**
• **Above VWAP:** Look for long setups (bullish bias)
• **Below VWAP:** Look for short setups (bearish bias)
• **Price at VWAP:** Indecision, wait for break

**Trading Strategies:**
1. **Mean Reversion:** Price moves away from VWAP, trade back to it
2. **Trend Following:** Price above VWAP, buy dips; below VWAP, sell rallies
3. **VWAP Bounce:** Price touches VWAP and bounces, enter continuation

**Intraday Application:**
• VWAP resets daily (anchored to day open)
• Strong trend days: price stays one side of VWAP all day
• Ranging days: price crosses VWAP multiple times
• Avoid trading against VWAP direction

**Pro Tip:** Combine VWAP with market structure. If structure is bullish and price dips to VWAP, that's a high-probability long.`
      },
      {
        name: 'Divergences',
        content: `**Divergence** occurs when price and indicator move in opposite directions, signaling potential reversal.

**Types of Divergence:**
• **Regular Bullish:** Price makes lower low, indicator makes higher low → reversal up
• **Regular Bearish:** Price makes higher high, indicator makes lower high → reversal down
• **Hidden Bullish:** Price makes higher low, indicator makes lower low → continuation up
• **Hidden Bearish:** Price makes lower high, indicator makes higher high → continuation down

**Best Indicators for Divergence:**
• RSI (Relative Strength Index)
• MACD (Moving Average Convergence Divergence)
• Stochastic Oscillator
• Volume

**How to Trade Divergence:**
1. Identify clear divergence on higher timeframe
2. Wait for price to reach key level (support, resistance, Fib)
3. Look for confirmation (candlestick pattern, structure break)
4. Enter in direction of divergence signal
5. Stop loss beyond the divergence point

**Important Rules:**
• Divergence works best at key levels, not in the middle of nowhere
• Wait for price confirmation; divergence alone is not enough
• Higher timeframe divergence (4H, Daily) is more reliable
• Don't trade every divergence; be selective

**Example:** Price makes a new high at 150, but RSI makes a lower high = bearish divergence = potential short.`
      },
      {
        name: 'RSI (Relative Strength Index)',
        content: `**RSI** measures momentum and identifies overbought/oversold conditions.

**RSI Basics:**
• Scale: 0-100
• **Above 70:** Overbought (potential reversal down)
• **Below 30:** Oversold (potential reversal up)
• **50:** Neutral momentum

**How to Use RSI:**
1. **Overbought/Oversold:** Don't blindly trade these; wait for confirmation
2. **Divergence:** Most powerful RSI signal (see Divergences topic)
3. **Trend Confirmation:** In uptrend, RSI stays above 40; in downtrend, below 60
4. **Centerline Cross:** RSI crosses 50 = momentum shift

**RSI Trading Strategies:**
• **Strong Trend:** In uptrend, buy when RSI dips to 40-50
• **Range Trading:** Sell near 70, buy near 30
• **Divergence:** Watch for price/RSI disagreement at key levels

**Common Mistakes:**
• Shorting just because RSI is overbought (price can stay overbought in strong trends)
• Using RSI alone without market structure or key levels
• Wrong timeframe (use 4H or Daily for better signals)

**Pro Settings:**
• Default: 14 periods (most common)
• Aggressive: 9 periods (faster signals, more noise)
• Conservative: 21 periods (slower signals, more reliable)

**Golden Rule:** RSI is a confirmation tool, not a standalone strategy. Combine with structure and levels.`
      },
      {
        name: 'Moving Averages',
        content: `**Moving Averages** smooth price data to identify trend direction and dynamic support/resistance.

**Types:**
• **SMA (Simple Moving Average):** Average of price over X periods
• **EMA (Exponential Moving Average):** Gives more weight to recent prices (more responsive)

**Common Periods:**
• **20 EMA:** Short-term trend, dynamic support/resistance
• **50 EMA/SMA:** Medium-term trend
• **200 EMA/SMA:** Long-term trend, major support/resistance

**How to Use:**
1. **Trend Direction:** Price above MA = uptrend; below = downtrend
2. **Dynamic Support/Resistance:** Price often bounces off MA
3. **MA Crossovers:** Fast MA crosses above slow MA = bullish; below = bearish
4. **Distance from MA:** Price too far = potential mean reversion

**Trading Strategies:**
• **Pullback to MA:** In uptrend, buy when price touches 20 EMA
• **MA as Stop Loss:** Trail stop below MA in uptrend
• **Golden Cross:** 50 MA crosses above 200 MA = long-term bullish signal
• **Death Cross:** 50 MA crosses below 200 MA = long-term bearish signal

**Pro Tips:**
• EMA reacts faster than SMA (better for day trading)
• Use higher timeframe MAs for better signals (4H, Daily)
• Don't rely on MAs alone; combine with structure and levels
• In choppy markets, MAs give false signals

**Example Setup:** Price in uptrend, pulls back to 20 EMA + demand zone + 0.618 Fib = strong confluence for long entry.`
      }
    ]
  },
  {
    id: 'advanced',
    title: 'Advanced Concepts',
    icon: Zap,
    color: 'orange',
    topics: [
      {
        name: 'Imbalances (FVG Deep Dive)',
        content: `**Imbalances** are inefficiencies in price that often get revisited and filled.

**What Creates Imbalances:**
• Aggressive institutional buying/selling
• Low liquidity environments
• News events or data releases
• Market structure shifts

**Types of Imbalances:**
1. **Fair Value Gap (FVG):** 3-candle gap (most common)
2. **Liquidity Void:** Large wick with no body (instant rejection)
3. **Gap (Chart Gap):** Opening price different from previous close
4. **Inverse FVG (IFVG):** FVG within an FVG (highly sensitive)

**Why Imbalances Matter:**
• Price magnetically returns to fill them
• Represent unfilled orders
• Act as support/resistance
• High-probability reversal zones

**Trading Imbalances:**
1. Mark all imbalances on your chart
2. Anticipate price return to fill (50%, 75%, or 100%)
3. Enter on lower timeframe confirmation within the imbalance
4. Stop loss beyond the imbalance
5. Target next imbalance or liquidity

**Important Notes:**
• Not all imbalances fill immediately; some take days/weeks
• Imbalances in the direction of structure are stronger
• Multiple imbalances = institutional interest
• Once filled, imbalances often flip (support becomes resistance)

**Pro Strategy:** Combine imbalance + order block + liquidity sweep for ultra-high probability setups.`
      },
      {
        name: 'Smart Money Concepts (SMC)',
        content: `**Smart Money Concepts** focus on trading with institutional players, not against them.

**Core Principles:**
1. **Institutions move markets, retail follows**
2. **Smart money needs liquidity to enter large positions**
3. **They accumulate at discount, distribute at premium**
4. **Retail is often wrong at turning points**

**How Institutions Trade:**
• **Accumulation:** Quietly buy at discount (demand zones, sell-side liquidity sweeps)
• **Markup:** Push price higher (retail jumps in late)
• **Distribution:** Sell at premium (supply zones, buy-side liquidity sweeps)
• **Markdown:** Push price lower (retail panics)

**Retail vs Smart Money:**
• Retail buys breakouts → Smart money sells to them
• Retail sells breakdowns → Smart money buys from them
• Retail uses tight stops at obvious levels → Smart money hunts those stops
• Retail chases momentum → Smart money waits for retracements

**Trading Like Smart Money:**
1. Identify where retail stops are (equal highs/lows)
2. Expect liquidity sweeps at these levels
3. Enter after the sweep, in the direction of structure
4. Target opposing liquidity
5. Think in terms of premium/discount, not support/resistance

**Key Insight:** If a level is "obvious" to retail (clean support, round number, trendline), expect it to be swept before reversing.`
      },
      {
        name: 'Multi-Timeframe Analysis',
        content: `**Multi-Timeframe Analysis** ensures your trades align across different time horizons.

**The Framework:**
• **Higher Timeframe (HTF):** Daily, 4H - gives bias and key levels
• **Entry Timeframe (ETF):** 15m, 5m - provides precise entries
• **Lower Timeframe (LTF):** 1m, 5m - confirms entries and manages trades

**How to Execute:**
1. **Start on Daily/4H:**
   - Determine market structure (bullish/bearish)
   - Identify key supply/demand zones
   - Mark premium/discount areas
   - Note major liquidity pools

2. **Drop to 15m/5m:**
   - Wait for price to reach HTF zone
   - Look for confirmation (FVG, order block, sweep)
   - Refine entry location

3. **Use 1m (Optional):**
   - Fine-tune exact entry
   - Manage stop loss
   - Watch for early exit signals

**Example Trade Flow:**
• **Daily:** Bullish structure, fresh demand at 100-105
• **4H:** Price retracing toward demand zone
• **15m:** Price enters demand at 102, creates FVG
• **5m:** Bullish BOS, enter long at 102.5
• **1m:** Manage trade, move stop to breakeven

**Golden Rules:**
• HTF gives direction, LTF gives precision
• Never trade against HTF bias
• If timeframes conflict, stay out
• Best trades have alignment across all timeframes

**Pro Tip:** Mark your HTF levels and never remove them. They guide all your LTF decisions.`
      },
      {
        name: 'Risk Management',
        content: `**Risk Management** is the difference between profitable traders and blown accounts.

**Core Rules:**
1. **Risk per trade:** Never risk more than 1-2% of account per trade
2. **Position sizing:** Adjust lot size based on stop loss distance
3. **Risk-Reward:** Aim for minimum 1:2, ideally 1:3 or higher
4. **Daily/Weekly limits:** Stop trading after 2-3 losses in a row

**Position Sizing Formula:**
\`Risk Amount = Account Size × Risk %\`
\`Position Size = Risk Amount ÷ Stop Loss Distance\`

**Example:**
• Account: $10,000
• Risk: 1% = $100
• Stop Loss: 20 pips
• Position Size = $100 ÷ 20 pips = $5/pip = 0.5 lots

**Risk-Reward Ratios:**
• **1:1** - Break even (50% win rate needed)
• **1:2** - Profitable (33% win rate needed)
• **1:3** - Very profitable (25% win rate needed)
• **1:5** - Elite (17% win rate needed)

**Mental Stops:**
• **Daily Loss Limit:** Stop after losing 3% in a day
• **Weekly Loss Limit:** Stop after losing 6% in a week
• **Consecutive Losses:** Take a break after 3 losses in a row

**The 2% Rule:**
If you risk 2% per trade:
• 10 losses in a row = -20% drawdown (recoverable)
• If you risk 10% per trade:
• 10 losses in a row = -100% (account blown)

**Advanced Risk Management:**
• Scale in/out of positions
• Use partial profits (take 50% at 1:2, let rest run to 1:5)
• Trail stops to lock in profits
• Reduce risk during high-impact news

**Remember:** Protect your capital first, profits second. You can't trade without an account.`
      }
    ]
  }
];

export default function Playbook() {
  const [selectedSection, setSelectedSection] = useState(PLAYBOOK_SECTIONS[0].id);
  const [expandedTopics, setExpandedTopics] = useState({});

  const activeSection = PLAYBOOK_SECTIONS.find(s => s.id === selectedSection);

  const toggleTopic = (topicName) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicName]: !prev[topicName]
    }));
  };

  const colorClasses = {
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    blue: 'bg-primary/10 border-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-green-400" />
          Trading Playbook
        </h1>
        <p className="text-gray-500 mt-1">Master the concepts that professional traders use</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Section Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {PLAYBOOK_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = selectedSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all text-left",
                  isActive
                    ? `border-${section.color}-500 bg-${section.color}-500/10`
                    : "border-white/10 bg-card/5 hover:border-white/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center border",
                    isActive ? colorClasses[section.color] : "bg-card/5 border-white/10"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{section.title}</p>
                    <p className="text-xs text-gray-500">{section.topics.length} topics</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Content - Topics */}
        <div className="lg:col-span-3 space-y-4">
          {activeSection && (
            <>
              <div className={cn(
                "p-6 rounded-2xl border glass-card",
                colorClasses[activeSection.color]
              )}>
                <div className="flex items-center gap-3">
                  <activeSection.icon className="w-6 h-6" />
                  <div>
                    <h2 className="text-2xl font-bold">{activeSection.title}</h2>
                    <p className="text-sm opacity-80">{activeSection.topics.length} educational topics</p>
                  </div>
                </div>
              </div>

              {activeSection.topics.map((topic, idx) => {
                const isExpanded = expandedTopics[topic.name];
                
                return (
                  <div
                    key={idx}
                    className="glass-card rounded-2xl bg-[#0f0f17]/80 border border-white/5 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleTopic(topic.name)}
                      className="w-full p-6 flex items-center justify-between hover:bg-card/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border",
                          colorClasses[activeSection.color]
                        )}>
                          {idx + 1}
                        </div>
                        <h3 className="text-lg font-semibold">{topic.name}</h3>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-white/5 pt-6">
                        <div className="prose prose-invert prose-sm max-w-none">
                          {topic.content.split('\n').map((paragraph, pIdx) => {
                            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                              return (
                                <h4 key={pIdx} className="text-base font-bold text-green-400 mt-4 mb-2">
                                  {paragraph.replace(/\*\*/g, '')}
                                </h4>
                              );
                            } else if (paragraph.startsWith('•')) {
                              return (
                                <li key={pIdx} className="text-gray-300 ml-4">
                                  {paragraph.substring(1).trim()}
                                </li>
                              );
                            } else if (paragraph.trim() === '') {
                              return <br key={pIdx} />;
                            } else {
                              return (
                                <p key={pIdx} className="text-gray-300 leading-relaxed mb-2">
                                  {paragraph}
                                </p>
                              );
                            }
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}