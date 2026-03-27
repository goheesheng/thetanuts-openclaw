# Thetanuts OpenClaw Skill

OpenClaw skill for trading crypto options on [Thetanuts Finance](https://thetanuts.finance).

## Features

- Get real-time option prices (MM pricing)
- Build RFQ requests for vanilla options
- Check user positions
- Fetch orderbook
- Calculate option payoffs at settlement

## Prerequisites

- [OpenClaw](https://docs.openclaw.ai/) installed and running
- Node.js >= 18.0.0

## Installation

### Step 1: Clone to OpenClaw workspace

```bash
cd ~/.openclaw/workspace/skills
git clone https://github.com/Thetanuts-Finance/thetanuts-openclaw.git thetanuts
```

### Step 2: Install dependencies

```bash
cd ~/.openclaw/workspace/skills/thetanuts
npm install
```

### Step 3: Reload OpenClaw

Start a new session to load the skill:
```
/new
```

Or restart the gateway.

## Usage

Once installed, you can ask questions like:

- "What's the current ETH price?"
- "Show me ETH put options"
- "I want to buy 0.1 ETH 2000 put expiring March 28"
- "Check positions for 0x..."
- "What's the payoff if ETH settles at 2200?"
- "Show me the orderbook for ETH puts"

## Available Scripts

The skill uses the `exec` tool to run these scripts:

| Script | Description |
|--------|-------------|
| `get-prices.ts` | Get current BTC, ETH prices and protocol stats |
| `get-mm-pricing.ts` | Get MM option pricing with filters |
| `get-positions.ts` | Get user positions by wallet address |
| `build-rfq.ts` | Build RFQ transaction data |
| `fetch-orders.ts` | Fetch orderbook with filters |
| `calculate-payout.ts` | Calculate option payout at settlement |

### Script Details

#### Get Market Prices
```bash
npx tsx scripts/get-prices.ts
```
Returns current BTC, ETH prices and protocol stats.

#### Get MM Option Pricing
```bash
npx tsx scripts/get-mm-pricing.ts <underlying> [--type PUT|CALL] [--expiry DDMMMYY]
```
Arguments:
- `underlying` (required): ETH or BTC
- `--type`: Filter by PUT or CALL (optional)
- `--expiry`: Filter by expiry date like "28MAR26" (optional)

Examples:
```bash
npx tsx scripts/get-mm-pricing.ts ETH
npx tsx scripts/get-mm-pricing.ts ETH --type PUT
npx tsx scripts/get-mm-pricing.ts BTC --expiry 28MAR26
```

#### Get User Positions
```bash
npx tsx scripts/get-positions.ts <wallet_address>
```
Arguments:
- `wallet_address` (required): User's Ethereum address (0x + 40 hex chars)

Example:
```bash
npx tsx scripts/get-positions.ts 0x1234567890abcdef1234567890abcdef12345678
```

#### Build RFQ Request
```bash
npx tsx scripts/build-rfq.ts --underlying <ETH|BTC> --type <PUT|CALL> --strike <price> --expiry <timestamp> --contracts <amount> --direction <buy|sell> [--collateral USDC|WETH] [--deadline <minutes>]
```
Arguments:
- `--underlying` (required): ETH or BTC
- `--type` (required): PUT or CALL
- `--strike` (required): Strike price in USD (e.g., 2500)
- `--expiry` (required): Unix timestamp of expiry (8:00 UTC on expiry date)
- `--contracts` (required): Number of contracts
- `--direction` (required): buy or sell
- `--collateral` (optional): USDC or WETH (default: USDC)
- `--deadline` (optional): Offer deadline in minutes (default: 60)

Example:
```bash
npx tsx scripts/build-rfq.ts --underlying ETH --type PUT --strike 2000 --expiry 1774684800 --contracts 0.1 --direction buy
```

#### Fetch Orderbook
```bash
npx tsx scripts/fetch-orders.ts [--underlying ETH|BTC] [--type PUT|CALL]
```
Arguments:
- `--underlying`: Filter by ETH or BTC (optional)
- `--type`: Filter by PUT or CALL (optional)

Example:
```bash
npx tsx scripts/fetch-orders.ts --underlying ETH --type PUT
```

#### Calculate Payout
```bash
npx tsx scripts/calculate-payout.ts --type <PUT|CALL> --strike <price> --settlement <price> --contracts <amount> [--is-buyer]
```
Arguments:
- `--type` (required): PUT or CALL
- `--strike` (required): Strike price
- `--settlement` (required): Settlement price to calculate
- `--contracts` (required): Number of contracts
- `--is-buyer`: Include if calculating buyer payout (default: seller)

Example:
```bash
npx tsx scripts/calculate-payout.ts --type PUT --strike 2500 --settlement 2200 --contracts 1 --is-buyer
```

## Configuration

Set custom RPC URL via environment variable:

```bash
export THETANUTS_RPC_URL="https://your-rpc-url.com"
```

Default: `https://mainnet.base.org` (Base Mainnet, Chain ID 8453)

## Ticker Format

Options use: `{UNDERLYING}-{EXPIRY}-{STRIKE}-{TYPE}`

Examples:
- `ETH-28MAR26-2500-P` = ETH Put, $2500 strike, March 28 2026 expiry
- `BTC-28MAR26-95000-C` = BTC Call, $95000 strike, March 28 2026 expiry

## Safety

This skill is **READ-ONLY**:
- Scripts return transaction data but don't execute transactions
- Users must sign transactions with their own wallet
- No private keys are handled

## License

MIT

## Links

- [Thetanuts Finance](https://thetanuts.finance)
- [Thetanuts SDK](https://github.com/Thetanuts-Finance/thetanuts-sdk)
- [OpenClaw Docs](https://docs.openclaw.ai/)
