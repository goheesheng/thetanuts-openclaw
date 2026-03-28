---
name: thetanuts
description: Trade crypto options on Thetanuts Finance - orderbook fills, RFQ lifecycle, multi-strike structures, real-time WebSocket, wallet management
homepage: https://github.com/Thetanuts-Finance/thetanuts-sdk
user-invocable: true
metadata: {"openclaw":{"emoji":"📈","install":[{"type":"node","package":"."}]}}
---

# Thetanuts Options Trading

## What is TNUT Agent?

TNUT Agent is your AI-powered assistant for trading crypto options on Thetanuts Finance.

**What it does:**
- Manages local wallets safely (custody stays on your machine)
- Accesses market intelligence (prices, orderbook, MM quotes)
- Inspects options and positions
- Prepares and executes trades through the Thetanuts protocol

**Local-first design:**
- Wallet custody stays LOCAL - your seed phrase never leaves your machine
- Signing stays LOCAL - transactions are signed on your device
- Backend provides intelligence, data, and routing support only

**Capabilities:**
| Category | What You Can Do |
|----------|----------------|
| Wallet | Create, import, check balances |
| Market Data | Live prices, MM quotes, orderbook orders |
| Trading | Fill orderbook orders, submit RFQs, approve tokens |
| Positions | View open positions, calculate payoffs |

---

## Options 101

### What are Options?

Options are contracts that give you the right (but not obligation) to buy or sell an asset at a specific price by a specific date.

### PUT Options

A **PUT** gives the holder the right to SELL at the strike price.

| Action | You... | Profit When | Risk |
|--------|--------|-------------|------|
| **Buy PUT** | Pay premium upfront | Price drops below strike | Lose premium if price stays up |
| **Sell PUT** | Receive premium | Price stays above strike | Lose if price drops below strike |

**Example:**
- ETH is at $2000
- You BUY a $1900 PUT for $10 premium
- If ETH drops to $1800 → Your PUT is worth $100 (profit: $90)
- If ETH stays at $2000 → Your PUT expires worthless (loss: $10 premium)

### CALL Options

A **CALL** gives the holder the right to BUY at the strike price.

| Action | You... | Profit When | Risk |
|--------|--------|-------------|------|
| **Buy CALL** | Pay premium upfront | Price rises above strike | Lose premium if price stays down |
| **Sell CALL** | Receive premium | Price stays below strike | Lose if price rises above strike |

**Example:**
- ETH is at $2000
- You BUY a $2100 CALL for $15 premium
- If ETH rises to $2300 → Your CALL is worth $200 (profit: $185)
- If ETH stays at $2000 → Your CALL expires worthless (loss: $15 premium)

### Key Terms

| Term | Definition |
|------|------------|
| **Strike** | The price at which the option can be exercised |
| **Expiry** | When the option expires (settlement date, 8:00 UTC) |
| **Premium** | The price paid for the option |
| **Settlement** | Cash payment based on price difference at expiry |
| **Collateral** | Funds locked to back the option (for sellers) |

### Collateral Requirements by Option Type

**IMPORTANT:** Different option types require different collateral tokens:

| Option Type | Implementation | Collateral Required |
|-------------|----------------|---------------------|
| **PUT** | PUT | USDC (quote asset) |
| **CALL** | INVERSE_CALL | WETH (base asset) |

- **PUT options**: Collateral in USDC. Formula: `(collateral × 1e8) / strike`
- **CALL options**: Collateral in WETH. Formula: `collateral / 1e12` (1 WETH = 1 contract)

The `build-rfq.ts` script automatically selects the correct collateral based on option type.

---

## Multi-Strike Option Structures

Beyond vanilla PUT and CALL options, Thetanuts supports advanced multi-strike structures for sophisticated trading strategies.

### All Option Types

| Type | Strikes | Collateral | Description |
|------|---------|------------|-------------|
| **PUT** | 1 | USDC | Standard cash-settled put |
| **INVERSE_CALL** | 1 | WETH | Cash-settled call (base collateral) |
| **CALL_SPREAD** | 2 | USDC | Buy lower strike call, sell higher strike call |
| **PUT_SPREAD** | 2 | USDC | Buy higher strike put, sell lower strike put |
| **CALL_FLY** | 3 | USDC | Call butterfly - profit near middle strike |
| **PUT_FLY** | 3 | USDC | Put butterfly - profit near middle strike |
| **CALL_CONDOR** | 4 | USDC | Call condor - wider profit range |
| **PUT_CONDOR** | 4 | USDC | Put condor - wider profit range |
| **IRON_CONDOR** | 4 | USDC | Put spread + call spread (neutral) |
| **PHYSICAL_CALL** | 1 | WETH | Physically settled call |
| **PHYSICAL_PUT** | 1 | USDC | Physically settled put |

### Strike Ordering Rules

**CRITICAL:** Strikes must be ordered correctly or the RFQ will fail.

| Structure | Type | Strike Order | Example |
|-----------|------|--------------|---------|
| Vanilla | PUT/CALL | N/A (1 strike) | `--strike 1900` |
| Spread | PUT | Descending (high→low) | `--strikes 1900,1800` |
| Spread | CALL | Ascending (low→high) | `--strikes 2000,2100` |
| Butterfly | PUT | Descending | `--strikes 1900,1850,1800` |
| Butterfly | CALL | Ascending | `--strikes 2000,2050,2100` |
| Condor | ALL | Always ascending | `--strikes 1800,1900,2100,2200` |

### Collateral Formulas by Structure

| Structure | Formula | Example |
|-----------|---------|---------|
| **Vanilla PUT** | `(collateral × 1e8) / strike` | 1900 USDC at $1900 = 1 contract |
| **INVERSE_CALL** | `collateral / 1e12` | 1 WETH = 1 contract |
| **Spread** | `collateral / (strike2 - strike1)` | 100 USDC / $100 width = 1 contract |
| **Butterfly** | `collateral / (middle - lower)` | 50 USDC / $50 wing = 1 contract |
| **Condor** | `collateral / (strike2 - strike1)` | 100 USDC / $100 inner width = 1 contract |

### When to Use Each Structure

| Structure | Market View | Risk/Reward | Best For |
|-----------|-------------|-------------|----------|
| **PUT** | Bearish | Unlimited profit, lose premium | Strong downside conviction |
| **CALL** | Bullish | Unlimited profit, lose premium | Strong upside conviction |
| **PUT_SPREAD** | Moderately bearish | Capped profit/loss | Cheaper than vanilla put |
| **CALL_SPREAD** | Moderately bullish | Capped profit/loss | Cheaper than vanilla call |
| **PUT_FLY** | Neutral/range-bound | High reward if pinned | Low cost, precise target |
| **CALL_FLY** | Neutral/range-bound | High reward if pinned | Low cost, precise target |
| **CONDOR** | Neutral/range-bound | Lower reward, wider range | More forgiving than fly |
| **IRON_CONDOR** | Neutral | Collect premium both sides | Range-bound markets |

### Strategy Recommendation Decision Tree

When a user asks for a strategy recommendation, follow this decision tree:

```
User wants to trade options
        │
        ▼
┌─────────────────────────────┐
│ What is their market view?  │
└─────────────────────────────┘
        │
        ├── STRONGLY DIRECTIONAL (high conviction)
        │   │
        │   ├── Bullish ──────► CALL (vanilla)
        │   │                   "Unlimited upside, lose premium if wrong"
        │   │
        │   └── Bearish ──────► PUT (vanilla)
        │                       "Unlimited downside profit, lose premium if wrong"
        │
        ├── MODERATELY DIRECTIONAL (some conviction)
        │   │
        │   ├── Bullish ──────► CALL_SPREAD
        │   │                   "Cheaper than vanilla, capped profit/loss"
        │   │
        │   └── Bearish ──────► PUT_SPREAD
        │                       "Cheaper than vanilla, capped profit/loss"
        │
        ├── NEUTRAL / RANGE-BOUND
        │   │
        │   └── Check collateral size
        │       │
        │       ├── Small (under $50) ──► Butterfly (CALL_FLY/PUT_FLY)
        │       │                         "Cheapest, profit if pinned at middle"
        │       │
        │       └── Larger ───────────► Condor (CALL_CONDOR/PUT_CONDOR)
        │                               "Wider profit range, more forgiving"
        │
        └── SELLING PREMIUM (income strategy)
                │
                └── Neutral view ────► IRON_CONDOR
                                       "Collect premium both sides"
```

### Collateral Efficiency Comparison

Different structures give you different exposure per dollar of collateral:

| Structure | $100 Collateral Gets You | Relative Efficiency |
|-----------|-------------------------|---------------------|
| **Vanilla PUT** (at $2000 strike) | ~0.05 contracts | 1x (baseline) |
| **PUT_SPREAD** ($100 width) | 1 contract | **20x more** |
| **Butterfly** ($50 wing width) | 2 contracts | **40x more** |
| **Condor** ($100 inner width) | 1 contract | **20x more** |

**Key Insight:** For users with small collateral (under $100), spreads and butterflies provide significantly more market exposure than vanilla options.

### Strategy Selection Inputs

When recommending a strategy, consider:

| Input | How to Determine | Impact on Recommendation |
|-------|-----------------|-------------------------|
| **Market View** | Ask user: bullish, bearish, or neutral? | Determines direction (PUT vs CALL vs neutral structures) |
| **Conviction Level** | Ask: strong view or moderate? | High = vanilla, Moderate = spread |
| **Collateral Size** | Check wallet balance | Small = prefer spreads/butterflies for efficiency |
| **Risk Tolerance** | Ask: capped risk or unlimited potential? | Risk-averse = spreads, Risk-seeking = vanilla |
| **Expiry Timeframe** | Check expiry distance | Short-term neutral = butterfly, Longer = condor |

### Multi-Strike RFQ Examples

**2-Strike Spread (CALL_SPREAD):**
```bash
npx tsx scripts/build-rfq.ts \
  --underlying ETH \
  --type CALL \
  --strikes 2000,2100 \
  --expiry 1774684800 \
  --contracts 1 \
  --direction buy
```
*Buy $2000 call, sell $2100 call. Max profit = $100 - premium. Max loss = premium.*

**3-Strike Butterfly (PUT_FLY):**
```bash
npx tsx scripts/build-rfq.ts \
  --underlying ETH \
  --type PUT \
  --strikes 1900,1850,1800 \
  --expiry 1774684800 \
  --contracts 1 \
  --direction buy
```
*Profit maximized if ETH settles at $1850. Low cost, high reward if pinned.*

**4-Strike Condor (IRON_CONDOR):**
```bash
npx tsx scripts/build-rfq.ts \
  --underlying ETH \
  --type PUT \
  --strikes 1800,1900,2100,2200 \
  --expiry 1774684800 \
  --contracts 1 \
  --direction sell
```
*Sell iron condor. Collect premium if ETH stays between $1900-$2100.*

---

## Orderbook vs RFQ: When to Use Each

### Orderbook Trading

**What it is:** Fill existing orders posted by market makers - instant execution.

```
You → Fill existing order → Instant trade
```

**Best for:**
- Standard strikes/expiries with existing liquidity
- Quick trades when you see a good price
- Smaller to medium sizes

**How it works:**
1. Fetch orderbook: `npx tsx scripts/fetch-orders.ts --type PUT`
2. See available BIDs (buyers) and ASKs (sellers)
3. Fill the order you want: `npx tsx scripts/fill-order.ts --order-index 0 --collateral 10 --seed "..." --execute`

### RFQ (Request for Quote)

**What it is:** Request a custom quote from market makers - they respond within 45 seconds.

```
You → Submit RFQ → MM sees it → MM sends offer → You settle
```

**Best for:**
- Custom strikes/expiries not on orderbook
- No existing liquidity at your terms
- Larger sizes (MMs may offer better pricing)

**How it works:**
1. Build RFQ: `npx tsx scripts/build-rfq.ts --underlying ETH --type PUT --strike 1900 --expiry <timestamp> --contracts 0.1 --direction buy`
2. Send transaction with the returned `to` and `data`
3. Wait up to 45 seconds for MM response
4. Settle when offer received

### Decision Matrix

| Scenario | Use | Why |
|----------|-----|-----|
| "I see a good price on orderbook" | **Orderbook** | Instant execution |
| "Standard strike, liquidity exists" | **Orderbook** | Faster, simpler |
| "Custom strike not on orderbook" | **RFQ** | Only way to get it |
| "Large size trade" | **RFQ** | May get better pricing |
| "Need it filled NOW" | **Orderbook** | RFQ takes up to 6 min |
| "No orders at my strike" | **RFQ** | Request custom quote |

**Agent Decision Logic:**
1. First, check orderbook for liquidity at your strike
2. If liquidity exists → recommend Orderbook
3. If no liquidity → recommend RFQ and explain why

---

## Agent Decision Logic (Orderbook-First)

When a user wants to trade, the agent ALWAYS checks the orderbook first before recommending a trading method.

### Decision Flowchart

```
User wants to trade
        │
        ▼
┌─────────────────────────┐
│  check-orderbook.ts     │
│  Check for liquidity    │
└─────────────────────────┘
        │
        ▼
┌─────────────────────────┐
│ Exact strike match?     │
└─────────────────────────┘
    │           │
   Yes          No
    │           │
    ▼           ▼
┌─────────┐  ┌─────────────────┐
│Orderbook│  │Nearby strikes?  │
│  Fill   │  │(within ±5%)     │
└─────────┘  └─────────────────┘
                 │         │
                Yes        No
                 │         │
                 ▼         ▼
           ┌─────────┐  ┌─────┐
           │Show     │  │ RFQ │
           │options  │  │     │
           └─────────┘  └─────┘
```

### How to Use check-orderbook.ts

Before recommending orderbook or RFQ, run:
```bash
npx tsx scripts/check-orderbook.ts --underlying ETH --type PUT --strike 1900 --expiry 1774684800 --direction sell
```

The script returns:
- `recommendation`: "orderbook" or "rfq"
- `reason`: Explanation of why
- `orderbookOrders`: Matching orders with prices
- `nearbyStrikes`: Alternative strikes if exact not found
- `nextStep`: Command to run next

### Example Scenarios

**Scenario 1: Liquidity Found**
```
User: "Sell a PUT at $1900"
Agent: Runs check-orderbook.ts
Result: {
  "recommendation": "orderbook",
  "reason": "Found orderbook liquidity at strike $1900. Best bid: $8.08. Available: 75 contracts."
}
Agent: "Found a buyer at $8.08/contract. Use orderbook for instant execution."
```

**Scenario 2: No Exact Match, Nearby Available**
```
User: "Sell a PUT at $1850"
Agent: Runs check-orderbook.ts
Result: {
  "recommendation": "rfq",
  "reason": "No orderbook liquidity at $1850. Nearby strikes: $1900 (+2.7%), $1925 (+4.1%)"
}
Agent: "No orders at $1850, but $1900 is available (+2.7%). Would you like that, or submit RFQ for $1850?"
```

**Scenario 3: Partial Fill**
```
User: "Sell 100 contracts at $1900"
Agent: Runs check-orderbook.ts --size 100
Result: {
  "recommendation": "orderbook",
  "partialFillAvailable": true,
  "partialSize": 75,
  "reason": "Found 75 contracts (you requested 100). Partial fill available."
}
Agent: "Only 75 contracts available on orderbook. Fill partial now, or use RFQ for full 100?"
```

---

## Trading Workflows

### Workflow 1: Fill an Orderbook Order (Instant)

```
Step 1: Check wallet
   └─> node scripts/wallet-discover.js

Step 2: Check balance
   └─> node scripts/wallet-balance.js --chain base-mainnet --tokens 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

Step 3: Fetch orderbook
   └─> npx tsx scripts/fetch-orders.ts --type PUT

Step 4: Preview fill (see what you'll get)
   └─> npx tsx scripts/fill-order.ts --order-index 0 --collateral 10 --seed "..."

Step 5: Execute fill
   └─> npx tsx scripts/fill-order.ts --order-index 0 --collateral 10 --seed "..." --execute --wait
```

### Workflow 2: Submit an RFQ (Custom Terms)

```
Step 1: Check wallet & balance (same as above)

Step 2: Get MM pricing to see market levels
   └─> npx tsx scripts/get-mm-pricing.ts ETH --type PUT

Step 3: Build RFQ with your terms
   └─> npx tsx scripts/build-rfq.ts --underlying ETH --type PUT --strike 1900 --expiry 1774684800 --contracts 0.1 --direction buy

Step 4: Approve tokens (if selling/first time)
   └─> npx tsx scripts/approve-token.ts --token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 --spender 0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5 --max --seed "..." --wait

Step 5: Send RFQ transaction
   └─> npx tsx scripts/send-transaction.ts --to <from step 3> --data <from step 3> --seed "..." --wait

Step 6: Wait for MM offer (up to 45 seconds)

Step 7: Verify RFQ fill
   └─> npx tsx scripts/check-rfq-fill.ts --address <wallet> --ticker <expected> --since <submission_timestamp>
   └─> If filled: Shows position details
   └─> If not filled: Shows suggestions for next steps
```

### Workflow 3: Check Positions

```
npx tsx scripts/get-positions.ts 0xYourWalletAddress
```

---

## Example Conversations

### "Show me ETH puts"

**User:** Show me ETH puts

**Agent:**
1. Fetches MM pricing: `npx tsx scripts/get-mm-pricing.ts ETH --type PUT`
2. Shows available strikes, expiries, bid/ask prices
3. Asks which one interests you

### "I want to sell a put at $1900 with 10 USDC"

**Agent's Decision Process:**
1. Check orderbook for $1900 PUT bids
2. Found liquidity? → "Use Orderbook - there's a BID at $1900"
3. No liquidity? → "Use RFQ - I'll request a quote for you"

**If Orderbook:**
```
Agent: There's a BID at $1900. Let me fill it for you.
1. Previews: "You'll sell ~0.005 contracts, receive ~$X premium"
2. Asks: "Proceed?"
3. Executes fill
```

**If RFQ:**
```
Agent: No orderbook liquidity at $1900. I'll submit an RFQ.
1. Builds RFQ for ETH-1900-PUT sell
2. Approves USDC if needed
3. Submits RFQ
4. "RFQ submitted. MMs have 45 seconds to respond."
```

### "Check my positions"

**Agent:**
1. Gets wallet address from discover
2. Runs: `npx tsx scripts/get-positions.ts 0xYourAddress`
3. Shows open positions with current P&L

### "I have $50 and I'm bearish on ETH, recommend a strategy"

**Agent's Decision Process:**
1. User has small collateral ($50) → Consider spreads for efficiency
2. User is bearish → PUT direction
3. Check conviction: "Moderately bearish" (didn't say "very bearish")
4. Recommendation: **PUT_SPREAD**

**Agent:**
```
With $50 and a bearish view, I recommend a PUT SPREAD instead of vanilla PUT.

Why PUT_SPREAD over vanilla PUT?
┌─────────────────────────────────────────────────────┐
│ Vanilla PUT ($1900)     │ PUT_SPREAD ($1900/$1800)  │
├─────────────────────────┼───────────────────────────┤
│ $50 → ~0.026 contracts  │ $50 → 0.5 contracts       │
│ Unlimited profit        │ Max profit: $50           │
│ Lose $50 if wrong       │ Lose $50 if wrong         │
│ Need big move to profit │ Profit if drops below $1900│
└─────────────────────────┴───────────────────────────┘

The spread gives you 20x more exposure for the same collateral!

Available strikes for tomorrow's expiry:
• PUT_SPREAD $1950/$1850 - Bid: $12/contract
• PUT_SPREAD $1900/$1800 - Bid: $8/contract

Which spread would you like? Or prefer vanilla for unlimited upside?
```

### "I think ETH will stay around $2000 this week"

**Agent's Decision Process:**
1. User expects range-bound/neutral market
2. Check collateral and ask for size
3. Recommendation: **Butterfly or Condor**

**Agent:**
```
For a range-bound view around $2000, I recommend a BUTTERFLY or CONDOR.

How much collateral do you want to use?
```

**User:** "About $30"

**Agent:**
```
With $30 and a neutral view around $2000, I recommend a CALL BUTTERFLY:

ETH-2050-CALL_FLY (strikes: 2000/2050/2100)
• Cost: ~$5 per contract
• Max profit: ~$45 per contract (at exactly $2050)
• $30 gets you: ~6 contracts
• Break-even range: $2005 - $2095

Why butterfly over condor?
• Butterfly is cheaper (more contracts per dollar)
• Condor has wider profit range but costs more
• For $30, butterfly gives better risk/reward

If you want a wider safety margin, consider a CONDOR with larger collateral.

Build this RFQ? (y/n)
```

### "I want to sell premium and collect income"

**Agent's Decision Process:**
1. User wants to sell premium → Income strategy
2. Ask about market view
3. If neutral → **IRON_CONDOR**

**Agent:**
```
For selling premium, I recommend an IRON CONDOR if you're neutral on ETH.

IRON_CONDOR: Sell both a PUT_SPREAD and CALL_SPREAD
• Collect premium from both sides
• Profit if ETH stays in range
• Defined risk on both tails

Current opportunity for ETH-29MAR26:
IRON_CONDOR strikes: 1800/1900/2100/2200
• Current ETH: $2000 (right in the middle!)
• Premium collected: ~$15 per contract
• Max loss: $85 per contract (if ETH moves beyond wings)
• Win zone: ETH stays between $1900-$2100

This is a neutral strategy - do you expect ETH to stay range-bound?
```

---

## Commands Reference

### Wallet Commands

| Command | Description |
|---------|-------------|
| `node scripts/wallet-discover.js` | Check if wallet configured, show addresses |
| `node scripts/wallet-create.js` | Generate new wallet |
| `node scripts/wallet-import.js --seed-file /path` | Import existing seed |
| `node scripts/wallet-balance.js --chain base-mainnet` | Check balance |
| `node scripts/wallet-select.js --family evm --chain base-mainnet` | Set active chain |

### Market Data Commands

| Command | Description |
|---------|-------------|
| `npx tsx scripts/get-prices.ts` | Get BTC/ETH prices |
| `npx tsx scripts/get-mm-pricing.ts ETH --type PUT` | Get MM option quotes |
| `npx tsx scripts/fetch-orders.ts --type PUT` | Fetch orderbook |
| `npx tsx scripts/check-orderbook.ts --underlying ETH --type PUT --strike 1900 --expiry <ts> --direction sell` | Check orderbook liquidity (run FIRST before trading) |

### Trading Commands

| Command | Description |
|---------|-------------|
| `npx tsx scripts/fill-order.ts --order-index 0 --collateral 10 --seed "..." --execute` | Fill orderbook order |
| `npx tsx scripts/build-rfq.ts --underlying ETH --type PUT --strike 1900 --expiry <ts> --contracts 0.1 --direction buy` | Build vanilla RFQ (45s deadline) |
| `npx tsx scripts/build-rfq.ts --underlying ETH --type CALL --strikes 2000,2100 --expiry <ts> --contracts 1 --direction buy` | Build multi-strike RFQ (spread/fly/condor) |
| `npx tsx scripts/approve-token.ts --token <addr> --spender <addr> --max --seed "..."` | Approve tokens |
| `npx tsx scripts/send-transaction.ts --to <addr> --data <hex> --seed "..."` | Send transaction |
| `npx tsx scripts/check-rfq-fill.ts --address <wallet> --ticker <expected> --since <ts>` | Verify RFQ fill status |

### Position Commands

| Command | Description |
|---------|-------------|
| `npx tsx scripts/get-positions.ts <address>` | Get open positions |
| `npx tsx scripts/calculate-payout.ts --type PUT --strike 1900 --settlement 1800 --contracts 1` | Calculate payoff |

---

## Contract Addresses (Base Mainnet)

### Core Contracts

| Contract | Address |
|----------|---------|
| **OptionBook** | `0xd58b814C7Ce700f251722b5555e25aE0fa8169A1` |
| **OptionFactory** | `0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5` |

### Tokens

| Token | Address | Decimals |
|-------|---------|----------|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6 |
| WETH | `0x4200000000000000000000000000000000000006` | 18 |
| cbBTC | `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` | 8 |
| cbDOGE | `0x73c7A9C372F31c1b1C7f8E5A7D12B8735c817C79` | 8 |
| cbXRP | `0x7B2Cd9EA5566c345C9cdbcF58f5E211a0dB47444` | 6 |
| aBasWETH | `0xD4a0e0b9149BCee3C920d2E00b5dE09138fd8bb7` | 18 |
| aBascbBTC | `0xBdb9300b7CDE636d9cD4AFF00f6F009fFBBc8EE6` | 8 |
| aBasUSDC | `0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB` | 6 |

### Option Implementations

| Type | Address |
|------|---------|
| PUT | `0xF480F636301d50Ed570D026254dC5728b746A90F` |
| INVERSE_CALL | `0x3CeB524cBA83D2D4579F5a9F8C0D1f5701dd16FE` |
| CALL_SPREAD | `0x4D75654bC616F64F6010d512C3B277891FB52540` |
| PUT_SPREAD | `0xC9767F9a2f1eADC7Fdcb7f0057E829D9d760E086` |
| CALL_FLY | `0xD8EA785ab2A63a8a94C38f42932a54A3E45501c3` |
| PUT_FLY | `0x1fE24872Ab7c83BbA26Dc761ce2EA735c9b96175` |
| CALL_CONDOR | `0xbb5d2EB2D354D930899DaBad01e032C76CC3c28f` |
| PUT_CONDOR | `0xbdAcC00Dc3F6e1928D9380c17684344e947aa3Ec` |
| IRON_CONDOR | `0x494Cd61b866D076c45564e236D6Cb9e011a72978` |
| PHYSICAL_CALL | `0x07032ffb1df85eC006Be7c76249B9e6f39b60F32` |
| PHYSICAL_PUT | `0xAC5eCA7129909dE8c12e1a41102414B5a5f340AA` |

### Price Feeds (Chainlink)

| Asset | Address |
|-------|---------|
| ETH/USD | `0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70` |
| BTC/USD | `0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F` |
| SOL | `0x975043adBb80fc32276CbF9Bbcfd4A601a12462D` |
| DOGE | `0x8422f3d3CAFf15Ca682939310d6A5e619AE08e57` |
| XRP | `0x9f0C1dD78C4CBdF5b9cf923a549A201EdC676D34` |

---

## Onboarding

For first-time setup:
```bash
bash {baseDir}/scripts/onboard.sh
```

Then create or import a wallet:
```bash
node {baseDir}/scripts/wallet-create.js
# or
node {baseDir}/scripts/wallet-import.js --seed-file /path/to/seed.txt
```

## Updates

```bash
bash {baseDir}/scripts/update.sh
```

Optional flags:
- `REFRESH_WDK_DEPS=1` - Refresh dependencies
- `UPGRADE_WDK_DEPS=1` - Upgrade versions

---

## Security Notes

- **DEDICATED WALLET**: Use a dedicated wallet seed for this integration. Never reuse your primary wallet.
- **LOCAL CUSTODY**: Your seed phrase stays on your machine. The agent never sends it anywhere.
- **TRANSACTIONS**: Irreversible once broadcast. Always verify before sending.
- **APPROVALS**: Token approvals allow contracts to spend your tokens. Only approve trusted contracts.
- **RFQ DEADLINE**: MMs have 45 seconds to respond to RFQs.
- **GAS**: Ensure wallet has ETH on Base for gas fees.

---

## Ticker Format

Options use: `{UNDERLYING}-{EXPIRY}-{STRIKE}-{TYPE}`

Examples:
- `ETH-28MAR26-2500-P` = ETH Put, $2500 strike, March 28 2026 expiry
- `BTC-28MAR26-95000-C` = BTC Call, $95000 strike, March 28 2026 expiry

---

## Network

- **Chain**: Base Mainnet (Chain ID 8453)
- **Collateral**: USDC (6 decimals), WETH (18 decimals), cbBTC (8 decimals)
- **Strikes**: 8 decimals internally
- **Expiry**: 8:00 UTC on expiry date
