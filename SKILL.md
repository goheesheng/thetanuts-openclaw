---
name: thetanuts
description: Trade crypto options on Thetanuts Finance - get MM pricing, build RFQs, analyze positions, manage wallets
homepage: https://github.com/Thetanuts-Finance/thetanuts-sdk
user-invocable: true
metadata: {"openclaw":{"emoji":"📈","install":[{"type":"node","package":"."}]}}
---

# Thetanuts Options Trading

You help users trade crypto options on Thetanuts Finance using the Thetanuts SDK and manage their wallets using the Tether WDK.

## Setup

Before first use, install dependencies:
```bash
cd {baseDir} && npm install
```

## Wallet Management

### Create New Wallet
```bash
npx tsx {baseDir}/scripts/create-wallet.ts --chain <evm|solana> [--index <number>]
```
Arguments:
- `--chain` (required): `evm` for Base/Ethereum or `solana` for Solana
- `--index` (optional): Account index, default 0

Examples:
```bash
npx tsx {baseDir}/scripts/create-wallet.ts --chain evm
npx tsx {baseDir}/scripts/create-wallet.ts --chain solana
```

**SECURITY**: The output includes your seed phrase. Save it securely and never share it.

### Import Existing Wallet
```bash
npx tsx {baseDir}/scripts/import-wallet.ts --chain <evm|solana> --seed "<seed phrase>" [--index <number>]
```
Arguments:
- `--chain` (required): `evm` or `solana`
- `--seed` (required): Your 12 or 24 word BIP-39 seed phrase
- `--index` (optional): Account index, default 0

Example:
```bash
npx tsx {baseDir}/scripts/import-wallet.ts --chain evm --seed "word1 word2 word3 ... word12"
```

### Get Wallet Balance
```bash
npx tsx {baseDir}/scripts/get-balance.ts --chain <evm|solana> --seed "<seed phrase>" [--index <number>] [--token <address>]
```
Arguments:
- `--chain` (required): `evm` or `solana`
- `--seed` (required): Your seed phrase
- `--index` (optional): Account index, default 0
- `--token` (optional): Token contract address for ERC20/SPL balance

Common Base tokens:
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- WETH: `0x4200000000000000000000000000000000000006`
- cbBTC: `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf`

Examples:
```bash
npx tsx {baseDir}/scripts/get-balance.ts --chain evm --seed "..."
npx tsx {baseDir}/scripts/get-balance.ts --chain evm --seed "..." --token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Sign Message
```bash
npx tsx {baseDir}/scripts/sign-message.ts --chain <evm|solana> --seed "<seed phrase>" --message "<message>" [--index <number>]
```
Arguments:
- `--chain` (required): `evm` or `solana`
- `--seed` (required): Your seed phrase
- `--message` (required): Message to sign
- `--index` (optional): Account index, default 0

Example:
```bash
npx tsx {baseDir}/scripts/sign-message.ts --chain evm --seed "..." --message "Authenticate to Thetanuts"
```

## Trading Commands

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

### Complete Trading Workflow (with Wallet)
1. Create or import a wallet
2. Check wallet balance to ensure sufficient funds
3. Get MM pricing to find available options
4. Build RFQ with desired parameters
5. User signs transaction with their wallet

Example:
```
User: "I want to buy an ETH put option"

Agent:
1. First, do you have a wallet? If not:
   npx tsx {baseDir}/scripts/create-wallet.ts --chain evm

2. Check your balance:
   npx tsx {baseDir}/scripts/get-balance.ts --chain evm --seed "your seed phrase"

3. Show available ETH puts:
   npx tsx {baseDir}/scripts/get-mm-pricing.ts ETH --type PUT

4. Build the RFQ (user chooses strike $2000, expiry March 28):
   npx tsx {baseDir}/scripts/build-rfq.ts --underlying ETH --type PUT --strike 2000 --expiry 1774684800 --contracts 0.1 --direction buy

5. Return transaction data for user to sign
```

### Check Option Prices
1. Ask user for underlying (ETH or BTC)
2. Run `get-mm-pricing.ts ETH` to show all available options
3. Filter with `--type PUT` or `--expiry 28MAR26` as needed
4. Explain pricing: bid/ask, IV, greeks

### Build an RFQ
1. Gather from user: underlying, strike, expiry, direction (buy/sell), size
2. Convert expiry date to Unix timestamp (8:00 UTC on expiry date)
3. Run `build-rfq.ts` with the parameters
4. Return the `to` and `data` fields for user to sign with their wallet

### Check User Positions
1. Get wallet address from user (or derive from seed with import-wallet)
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

## Security Notes

- **SEED PHRASES**: Never log, store, or transmit seed phrases except when displaying to user during wallet creation
- **SIGNING**: Always warn users before signing messages or transactions
- **READ-ONLY TRADING**: Trading scripts return data but DON'T execute transactions
- **USER SIGNS**: Return transaction data for user to sign with their wallet
- **DISPOSAL**: Wallet scripts automatically clear keys from memory after use

## Network Configuration

- **EVM Chain**: Base Mainnet (Chain ID 8453)
- **EVM RPC**: Set `THETANUTS_RPC_URL` env var (default: https://mainnet.base.org)
- **Solana RPC**: Set `SOLANA_RPC_URL` env var (default: https://api.mainnet-beta.solana.com)
- **Collateral**: USDC (6 decimals), WETH (18 decimals), cbBTC (8 decimals)
- **Strikes**: Displayed in USD, converted to 8 decimals internally
- **Expiry**: Use 8:00 UTC on expiry date for MM acceptance
