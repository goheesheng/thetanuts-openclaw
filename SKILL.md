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

## Transaction Execution

### Approve Token Spending
Before trading, you must approve the Thetanuts contract to spend your tokens (USDC, WETH, etc.):
```bash
npx tsx {baseDir}/scripts/approve-token.ts --token <address> --spender <address> (--amount <number> | --max) --seed "<seed phrase>" [--wait]
```
Arguments:
- `--token` (required): Token contract address
- `--spender` (required): Spender contract address (Thetanuts RFQ)
- `--amount` (required unless --max): Amount to approve in token units (e.g., 100 for 100 USDC)
- `--max` (optional): Approve unlimited spending (max uint256)
- `--seed` (required): Your seed phrase
- `--index` (optional): Account index, default 0
- `--wait` (optional): Wait for transaction confirmation

Common addresses:
| Contract | Address |
|----------|---------|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| WETH | `0x4200000000000000000000000000000000000006` |
| cbBTC | `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` |
| Thetanuts RFQ | `0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5` |

Examples:
```bash
# Approve max USDC for Thetanuts
npx tsx {baseDir}/scripts/approve-token.ts --token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 --spender 0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5 --max --seed "..." --wait

# Approve specific amount (100 USDC)
npx tsx {baseDir}/scripts/approve-token.ts --token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 --spender 0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5 --amount 100 --seed "..." --wait
```

### Send Transaction
Sign and broadcast a transaction using your wallet:
```bash
npx tsx {baseDir}/scripts/send-transaction.ts --to <address> --data <hex> --seed "<seed phrase>" [--value <wei>] [--gas-limit <number>] [--gas-price <gwei>] [--wait] [--timeout <ms>]
```
Arguments:
- `--to` (required): Target contract address
- `--data` (required): Transaction calldata (hex string from build-rfq.ts)
- `--seed` (required): Your seed phrase
- `--value` (optional): ETH to send in wei, default "0"
- `--index` (optional): Account index, default 0
- `--gas-limit` (optional): Override gas limit
- `--gas-price` (optional): Gas price in gwei
- `--wait` (optional): Wait for confirmation
- `--timeout` (optional): Confirmation timeout in ms, default 60000

Example:
```bash
# Send transaction from build-rfq output
npx tsx {baseDir}/scripts/send-transaction.ts --to 0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5 --data 0xb5da63e3... --seed "..." --wait
```

**WARNING**: Transactions are IRREVERSIBLE once broadcast. Always verify the destination and amount.

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
3. Approve token spending for Thetanuts (one-time per token)
4. Get MM pricing to find available options
5. Build RFQ with desired parameters
6. Send transaction to execute the trade

Example:
```
User: "I want to buy an ETH put option"

Agent:
1. First, do you have a wallet? If not:
   npx tsx {baseDir}/scripts/create-wallet.ts --chain evm

2. Check your balance:
   npx tsx {baseDir}/scripts/get-balance.ts --chain evm --seed "..."

3. Approve USDC spending (one-time):
   npx tsx {baseDir}/scripts/approve-token.ts --token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 --spender 0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5 --max --seed "..." --wait

4. Show available ETH puts:
   npx tsx {baseDir}/scripts/get-mm-pricing.ts ETH --type PUT

5. Build the RFQ (user chooses strike $2000, expiry March 28):
   npx tsx {baseDir}/scripts/build-rfq.ts --underlying ETH --type PUT --strike 2000 --expiry 1774684800 --contracts 0.1 --direction buy

6. Send the transaction using the `to` and `data` from step 5:
   npx tsx {baseDir}/scripts/send-transaction.ts --to 0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5 --data 0xb5da63e3... --seed "..." --wait
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
- **TRANSACTIONS**: Transactions are IRREVERSIBLE once broadcast. Always verify destination and amount before sending.
- **APPROVALS**: Token approvals allow contracts to spend your tokens. Only approve trusted contracts. Use `--max` carefully.
- **SIGNING**: Always warn users before signing messages or transactions
- **DISPOSAL**: Wallet scripts automatically clear keys from memory after use
- **GAS**: Ensure wallet has ETH for gas fees on Base network

## Network Configuration

- **EVM Chain**: Base Mainnet (Chain ID 8453)
- **EVM RPC**: Set `THETANUTS_RPC_URL` env var (default: https://mainnet.base.org)
- **Solana RPC**: Set `SOLANA_RPC_URL` env var (default: https://api.mainnet-beta.solana.com)
- **Collateral**: USDC (6 decimals), WETH (18 decimals), cbBTC (8 decimals)
- **Strikes**: Displayed in USD, converted to 8 decimals internally
- **Expiry**: Use 8:00 UTC on expiry date for MM acceptance
