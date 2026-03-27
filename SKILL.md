---
name: thetanuts
description: Trade crypto options on Thetanuts Finance - get MM pricing, build RFQs, analyze positions
homepage: https://github.com/Thetanuts-Finance/thetanuts-sdk
user-invocable: true
metadata: {"openclaw":{"emoji":"📈","install":[{"type":"node","package":"."}]}}
---

# Thetanuts Options Trading

You help users trade crypto options on Thetanuts Finance using the Thetanuts SDK.

## Setup

Before first use, install dependencies:
```bash
cd {baseDir} && npm install
```

## Available Commands

Use the `exec` tool to run these scripts from `{baseDir}/scripts/`:

### Get Market Prices
```bash
npx tsx {baseDir}/scripts/get-prices.ts
```
Returns current BTC, ETH prices and protocol stats.

### Get MM Option Pricing
```bash
npx tsx {baseDir}/scripts/get-mm-pricing.ts <underlying> [--type PUT|CALL] [--expiry DDMMMYY]
```
Arguments:
- `underlying` (required): ETH or BTC
- `--type`: Filter by PUT or CALL (optional)
- `--expiry`: Filter by expiry date like "28MAR26" (optional)

Examples:
```bash
npx tsx {baseDir}/scripts/get-mm-pricing.ts ETH
npx tsx {baseDir}/scripts/get-mm-pricing.ts ETH --type PUT
npx tsx {baseDir}/scripts/get-mm-pricing.ts BTC --expiry 28MAR26
```

### Get User Positions
```bash
npx tsx {baseDir}/scripts/get-positions.ts <wallet_address>
```
Arguments:
- `wallet_address` (required): User's Ethereum address (0x...)

Example:
```bash
npx tsx {baseDir}/scripts/get-positions.ts 0x1234567890abcdef1234567890abcdef12345678
```

### Build RFQ Request
```bash
npx tsx {baseDir}/scripts/build-rfq.ts --underlying <ETH|BTC> --type <PUT|CALL> --strike <price> --expiry <timestamp> --contracts <amount> --direction <buy|sell> [--collateral USDC|WETH] [--deadline <minutes>]
```
Arguments:
- `--underlying` (required): ETH or BTC
- `--type` (required): PUT or CALL
- `--strike` (required): Strike price in USD (e.g., 2500)
- `--expiry` (required): Unix timestamp of expiry (8:00 UTC)
- `--contracts` (required): Number of contracts
- `--direction` (required): buy or sell
- `--collateral` (optional): USDC or WETH (default: USDC)
- `--deadline` (optional): Offer deadline in minutes (default: 60)

Example:
```bash
npx tsx {baseDir}/scripts/build-rfq.ts --underlying ETH --type PUT --strike 2000 --expiry 1774684800 --contracts 0.1 --direction buy
```

### Fetch Orderbook
```bash
npx tsx {baseDir}/scripts/fetch-orders.ts [--underlying ETH|BTC] [--type PUT|CALL]
```
Arguments:
- `--underlying`: Filter by ETH or BTC (optional)
- `--type`: Filter by PUT or CALL (optional)

Example:
```bash
npx tsx {baseDir}/scripts/fetch-orders.ts --underlying ETH --type PUT
```

### Calculate Payout
```bash
npx tsx {baseDir}/scripts/calculate-payout.ts --type <PUT|CALL> --strike <price> --settlement <price> --contracts <amount> [--is-buyer]
```
Arguments:
- `--type` (required): PUT or CALL
- `--strike` (required): Strike price
- `--settlement` (required): Settlement price to calculate
- `--contracts` (required): Number of contracts
- `--is-buyer`: Include if calculating buyer payout (default: seller)

Example:
```bash
npx tsx {baseDir}/scripts/calculate-payout.ts --type PUT --strike 2500 --settlement 2200 --contracts 1 --is-buyer
```

## Common Workflows

### Check Option Prices
1. Ask user for underlying (ETH or BTC)
2. Run `get-mm-pricing.ts ETH` to show all available options
3. Filter with `--type PUT` or `--expiry 28MAR26` as needed
4. Explain pricing: bid/ask, IV, greeks

Example conversation:
```
User: "What are the current ETH put options?"
Agent: Run get-mm-pricing.ts ETH --type PUT, then summarize available strikes and expiries
```

### Build an RFQ
1. Gather from user: underlying, strike, expiry, direction (buy/sell), size
2. Convert expiry date to Unix timestamp (8:00 UTC on expiry date)
3. Run `build-rfq.ts` with the parameters
4. Return the `to` and `data` fields for user to sign with their wallet

Example conversation:
```
User: "I want to buy 0.1 ETH 2000 put expiring March 28"
Agent:
1. Convert March 28 2026 8:00 UTC to timestamp: 1774684800
2. Run: npx tsx {baseDir}/scripts/build-rfq.ts --underlying ETH --type PUT --strike 2000 --expiry 1774684800 --contracts 0.1 --direction buy
3. Return transaction data for signing
```

### Check User Positions
1. Get wallet address from user
2. Run `get-positions.ts 0xWalletAddress`
3. Show positions with current P&L if available

### Calculate Payoff Scenarios
1. Get option details (type, strike)
2. Run `calculate-payout.ts` with different settlement prices
3. Show potential profit/loss table

## Ticker Format

Options use: `{UNDERLYING}-{EXPIRY}-{STRIKE}-{TYPE}`

Examples:
- `ETH-28MAR26-2500-P` = ETH Put, $2500 strike, March 28 2026 expiry
- `BTC-28MAR26-95000-C` = BTC Call, $95000 strike, March 28 2026 expiry

## Important Notes

- **READ-ONLY**: Scripts return data but DON'T execute transactions
- **User must sign**: Return transaction data for user to sign with their wallet
- **No private keys**: Never handle or request private keys
- **Expiry**: Use 8:00 UTC on expiry date for MM acceptance
- **Chain**: Base Mainnet (Chain ID 8453)
- **Collateral**: USDC (6 decimals), WETH (18 decimals), cbBTC (8 decimals)
- **Strikes**: Displayed in USD, converted to 8 decimals internally
