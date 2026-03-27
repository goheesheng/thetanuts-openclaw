---
name: thetanuts
description: Trade crypto options on Thetanuts Finance - orderbook fills, RFQ lifecycle, multi-strike structures, real-time WebSocket, wallet management
homepage: https://github.com/Thetanuts-Finance/thetanuts-sdk
user-invocable: true
metadata: {"openclaw":{"emoji":"📈","install":[{"type":"node","package":"."}]}}
---

# Thetanuts Options Trading

You help users trade crypto options on Thetanuts Finance using the `@thetanuts-finance/thetanuts-client` SDK and manage their wallets using the Tether WDK.

## SDK Overview

The Thetanuts SDK provides complete options trading functionality:

| Module | Purpose | Requires Signer |
|--------|---------|-----------------|
| `client.api` | Fetch orders, positions, market data | No |
| `client.optionBook` | Fill/cancel orders, fee queries | Write ops |
| `client.optionFactory` | RFQ lifecycle management | Write ops |
| `client.option` | Position management, payouts | Write ops |
| `client.erc20` | Token approvals, balances | Write ops |
| `client.ws` | Real-time WebSocket subscriptions | No |
| `client.pricing` | Option pricing, Greeks | No |
| `client.mmPricing` | MM pricing quotes | No |
| `client.utils` | Decimal conversions, payoff calculations | No |

## Onboarding

For first-time setup, run the onboarding script:
```bash
bash {baseDir}/scripts/onboard.sh
```

This will:
- Check prerequisites (node, npm)
- Create WDK MCP runtime at `~/.openclaw/wdk-mcp`
- Install all required dependencies

Then create or import a wallet (see Wallet Management below).

## Updates

Check for and apply skill updates:
```bash
bash {baseDir}/scripts/update.sh
```

Optional flags:
- `REFRESH_WDK_DEPS=1` - Refresh dependencies from lockfile
- `UPGRADE_WDK_DEPS=1` - Upgrade dependency versions

Note: Updates NEVER modify wallet secrets (`.env`, `WDK_SEED`).

## Wallet Management

### Discover Wallet
Check if a wallet is configured and show addresses:
```bash
node {baseDir}/scripts/wallet-discover.js
```

### Create Wallet
Generate a new dedicated wallet:
```bash
node {baseDir}/scripts/wallet-create.js
```

**SECURITY**: Use a DEDICATED wallet for this integration. Never reuse your primary wallet seed.

### Import Wallet
Import an existing seed phrase:
```bash
# From file
node {baseDir}/scripts/wallet-import.js --seed-file /path/to/seed.txt

# From stdin
printf '%s' "$WDK_SEED" | node {baseDir}/scripts/wallet-import.js --stdin
```

### Select Wallet Context
Set active wallet family, chain, and index:
```bash
node {baseDir}/scripts/wallet-select.js --family evm --chain base-mainnet --index 0
```

### Query Balance
Get wallet balance for a specific chain:
```bash
# Native balance
node {baseDir}/scripts/wallet-balance.js --chain base-mainnet --index 0

# With token balance
node {baseDir}/scripts/wallet-balance.js --chain base-mainnet --index 0 --tokens 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

## Orderbook Trading

### Fetch Orders
Get all available orders from the orderbook:
```bash
npx tsx {baseDir}/scripts/fetch-orders.ts [--underlying ETH|BTC] [--type PUT|CALL]
```

Example:
```bash
npx tsx {baseDir}/scripts/fetch-orders.ts --underlying ETH --type PUT
```

### Preview Fill Order
Before filling, preview the order to see max contracts and pricing:
```typescript
const preview = client.optionBook.previewFillOrder(order, collateralAmount);
// Returns: maxContracts, collateralToken, pricePerContract, numContracts
```

### Fill Order
Fill an order from the orderbook:
```bash
npx tsx {baseDir}/scripts/fill-order.ts --order-id <id> --collateral <amount> --seed "..."
```

**Important**: The `availableAmount` in orders represents maker's collateral budget, not contract count. Use `previewFillOrder()` to calculate actual contracts.

| Option Type | Contract Formula |
|-------------|------------------|
| Vanilla PUT | `(collateral × 1e8) / strike` |
| Inverse CALL | `collateral / 1e12` |
| Spread | `(collateral × 1e8) / width` |
| Butterfly | `(collateral × 1e8) / maxSpread` |
| Condor | `(collateral × 1e8) / maxSpread` |

## RFQ (Request for Quote)

### Get MM Pricing
Get market maker pricing for options:
```bash
npx tsx {baseDir}/scripts/get-mm-pricing.ts <underlying> [--type PUT|CALL] [--expiry DDMMMYY]
```

Examples:
```bash
npx tsx {baseDir}/scripts/get-mm-pricing.ts ETH
npx tsx {baseDir}/scripts/get-mm-pricing.ts ETH --type PUT
npx tsx {baseDir}/scripts/get-mm-pricing.ts BTC --expiry 28MAR26
```

### Build RFQ Request
Build an RFQ transaction for vanilla options:
```bash
npx tsx {baseDir}/scripts/build-rfq.ts --underlying <ETH|BTC> --type <PUT|CALL> --strike <price> --expiry <timestamp> --contracts <amount> --direction <buy|sell> [--collateral USDC|WETH] [--deadline <minutes>]
```

Arguments:
- `--underlying` (required): ETH or BTC
- `--type` (required): PUT or CALL
- `--strike` (required): Strike price in USD (e.g., 2500)
- `--expiry` (required): Unix timestamp of expiry (8:00 UTC)
- `--contracts` (required): Number of contracts (human-readable, e.g., 1.5)
- `--direction` (required): buy or sell
- `--collateral` (optional): USDC or WETH (default: USDC)
- `--deadline` (optional): Offer deadline in minutes (default: 60)
- `--reserve-price` (optional): Reserve price per contract

Example:
```bash
npx tsx {baseDir}/scripts/build-rfq.ts --underlying ETH --type PUT --strike 2000 --expiry 1774684800 --contracts 0.1 --direction buy
```

**CRITICAL RFQ RULE**: The `collateralAmount` parameter in RFQs must always be 0. Collateral is pulled at settlement, not during RFQ creation. The SDK enforces this automatically.

### Multi-Strike Structures (Advanced)
The SDK supports complex option structures for cash-settled options:

| Structure | Strikes | Example |
|-----------|---------|---------|
| Vanilla | 1 | PUT, INVERSE_CALL |
| Spread | 2 | PUT_SPREAD, CALL_SPREAD |
| Butterfly | 3 | PUT_FLY, CALL_FLY |
| Condor | 4 | PUT_CONDOR, CALL_CONDOR |

**Butterfly (3 strikes):**
```typescript
const butterflyRequest = client.optionFactory.buildRFQRequest({
  underlying: 'ETH',
  optionType: 'PUT',
  strikes: [1700, 1800, 1900],  // 3 strikes
  numContracts: 0.001,
  isLong: false,
  // ... other params
});
```

**Condor (4 strikes):**
```typescript
const condorRequest = client.optionFactory.buildRFQRequest({
  underlying: 'ETH',
  optionType: 'PUT',
  strikes: [1600, 1700, 1800, 1900],  // 4 strikes
  numContracts: 0.001,
  isLong: false,
  // ... other params
});
```

### RFQ Key Management
The SDK automatically manages ECDH key pairs for encrypted RFQ offers:
- **Node.js**: Keys saved to `.thetanuts-keys/` directory
- **Browser**: Keys saved to localStorage

```typescript
const keyPair = await client.rfqKeys.getOrCreateKeyPair();
```

### Settle RFQ Early
```typescript
const decrypted = await client.rfqKeys.decryptOffer(
  offer.signedOfferForRequester,
  offer.signingKey
);

const { to, data } = client.optionFactory.encodeSettleQuotationEarly(
  quotationId,
  decrypted.offerAmount,
  decrypted.nonce,
  offer.offeror
);
```

## Transaction Execution

### Approve Token Spending
Before trading, approve tokens for Thetanuts contracts:
```bash
npx tsx {baseDir}/scripts/approve-token.ts --token <address> --spender <address> (--amount <number> | --max) --seed "..." [--wait]
```

Common addresses:
| Contract | Address |
|----------|---------|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| WETH | `0x4200000000000000000000000000000000000006` |
| cbBTC | `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` |
| OptionBook | `0x...` (from chainConfig) |
| OptionFactory | `0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5` |

Examples:
```bash
# Approve max USDC for OptionBook
npx tsx {baseDir}/scripts/approve-token.ts --token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 --spender 0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5 --max --seed "..." --wait

# Approve specific amount (100 USDC)
npx tsx {baseDir}/scripts/approve-token.ts --token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 --spender 0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5 --amount 100 --seed "..." --wait
```

### Send Transaction
Sign and broadcast a transaction:
```bash
npx tsx {baseDir}/scripts/send-transaction.ts --to <address> --data <hex> --seed "..." [--value <wei>] [--wait]
```

Example:
```bash
npx tsx {baseDir}/scripts/send-transaction.ts --to 0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5 --data 0xb5da63e3... --seed "..." --wait
```

## Position Management

### Get User Positions
```bash
npx tsx {baseDir}/scripts/get-positions.ts <wallet_address>
```

Example:
```bash
npx tsx {baseDir}/scripts/get-positions.ts 0x1234567890abcdef1234567890abcdef12345678
```

### Calculate Payout
```bash
npx tsx {baseDir}/scripts/calculate-payout.ts --type <PUT|CALL> --strike <price> --settlement <price> --contracts <amount> [--is-buyer]
```

Example:
```bash
npx tsx {baseDir}/scripts/calculate-payout.ts --type PUT --strike 2500 --settlement 2200 --contracts 1 --is-buyer
```

### Payoff Calculation (SDK)
```typescript
const payoff = client.utils.calculatePayout({
  structure: 'call_spread',
  strikes: [100000n, 105000n],
  size: 1000000n,
  price: 102000n,
  isLong: true,
});
```

## Real-time WebSocket

Subscribe to real-time updates:

```typescript
await client.ws.connect();

// Subscribe to orders
client.ws.subscribe({ type: 'orders' }, (update) => {
  console.log('Order update:', update);
});

// Subscribe to prices
client.ws.subscribe({ type: 'prices' }, (update) => {
  console.log('Price update:', update);
}, 'ETH');

// Monitor connection state
client.ws.onStateChange((state) => {
  console.log('WebSocket state:', state);
});
```

## Market Data

### Get Market Prices
```bash
npx tsx {baseDir}/scripts/get-prices.ts
```

Returns current BTC, ETH prices and protocol stats.

### Get Market Data (SDK)
```typescript
const marketData = await client.api.getMarketData();
const pricing = await client.mmPricing.getAllPricing('ETH');
```

## Decimal Handling

The SDK provides utilities for converting between human-readable and on-chain values:

| Asset Type | Decimals | Example |
|-----------|----------|---------|
| USDC | 6 | `1000000` = 1 USDC |
| WETH | 18 | `1e18` = 1 WETH |
| cbBTC | 8 | `1e8` = 1 cbBTC |
| Strike Price | 8 | `185000000000` = $1850 |

```typescript
// To on-chain values
const usdc = client.utils.toBigInt('100.5', 6);      // 100500000n
const strike = client.utils.strikeToChain(1850);     // 185000000000n

// From on-chain values
const display = client.utils.fromBigInt(100500000n, 6);  // '100.5'
const price = client.utils.strikeFromChain(185000000000n); // 1850
```

## Referrer & Fee Sharing

Set a referrer address to earn fee-sharing revenue:

```typescript
const client = new ThetanutsClient({
  chainId: 8453,
  provider,
  signer,
  referrer: '0x92b8ac05b63472d1D84b32bDFBBf3e1887331567',
});

// All fills automatically use this referrer
await client.optionBook.fillOrder(order);

// Or override per-fill
await client.optionBook.fillOrder(order, undefined, '0xYourReferrerAddress');
```

## Error Handling

The SDK throws typed errors:

| Error Code | Description |
|------------|-------------|
| `ORDER_EXPIRED` | Order has expired |
| `SLIPPAGE_EXCEEDED` | Price moved beyond tolerance |
| `INSUFFICIENT_ALLOWANCE` | Token approval needed |
| `INSUFFICIENT_BALANCE` | Insufficient token balance |
| `SIGNER_REQUIRED` | Signer needed for operation |
| `CONTRACT_REVERT` | Smart contract call reverted |
| `SIZE_EXCEEDED` | Fill size exceeds available |

```typescript
import { isThetanutsError } from '@thetanuts-finance/thetanuts-client';

try {
  await client.optionBook.fillOrder(order);
} catch (error) {
  if (isThetanutsError(error)) {
    switch (error.code) {
      case 'ORDER_EXPIRED':
        // Refresh orders
        break;
      case 'INSUFFICIENT_ALLOWANCE':
        // Approve tokens
        break;
    }
  }
}
```

## Common Workflows

### Workflow 1: Browse and Fill Orderbook

1. **Discover wallet**:
   ```bash
   node {baseDir}/scripts/wallet-discover.js
   ```

2. **Check balance**:
   ```bash
   node {baseDir}/scripts/wallet-balance.js --chain base-mainnet --tokens 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
   ```

3. **Fetch available orders**:
   ```bash
   npx tsx {baseDir}/scripts/fetch-orders.ts --underlying ETH --type PUT
   ```

4. **Approve collateral** (one-time):
   ```bash
   npx tsx {baseDir}/scripts/approve-token.ts --token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 --spender <optionBook> --max --seed "..." --wait
   ```

5. **Fill the order**:
   ```bash
   npx tsx {baseDir}/scripts/fill-order.ts --order-id <id> --collateral 10000000 --seed "..." --wait
   ```

### Workflow 2: Create RFQ for Custom Terms

1. **Get MM pricing** to see available quotes:
   ```bash
   npx tsx {baseDir}/scripts/get-mm-pricing.ts ETH --type PUT
   ```

2. **Build RFQ** with your terms:
   ```bash
   npx tsx {baseDir}/scripts/build-rfq.ts --underlying ETH --type PUT --strike 2000 --expiry 1774684800 --contracts 0.1 --direction buy
   ```

3. **Send transaction** using the `to` and `data` from step 2:
   ```bash
   npx tsx {baseDir}/scripts/send-transaction.ts --to 0x... --data 0x... --seed "..." --wait
   ```

4. **Wait for MM offer** and settle

### Workflow 3: Check and Manage Positions

1. **Get positions**:
   ```bash
   npx tsx {baseDir}/scripts/get-positions.ts 0xYourAddress
   ```

2. **Calculate potential payouts**:
   ```bash
   npx tsx {baseDir}/scripts/calculate-payout.ts --type PUT --strike 2500 --settlement 2200 --contracts 1 --is-buyer
   ```

## Ticker Format

Options use: `{UNDERLYING}-{EXPIRY}-{STRIKE}-{TYPE}`

Examples:
- `ETH-28MAR26-2500-P` = ETH Put, $2500 strike, March 28 2026 expiry
- `BTC-28MAR26-95000-C` = BTC Call, $95000 strike, March 28 2026 expiry

## Supported Chains

| Chain | Chain ID | Family |
|-------|----------|--------|
| Base Mainnet | 8453 | evm |
| Ethereum Mainnet | 1 | evm (wallet only) |
| BNB Smart Chain | 56 | evm (wallet only) |
| Solana Mainnet | - | solana (wallet only) |

**Note**: Thetanuts V4 trading is only available on Base Mainnet.

## Contract Addresses (Base)

| Contract | Address |
|----------|---------|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| WETH | `0x4200000000000000000000000000000000000006` |
| cbBTC | `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` |
| OptionFactory | `0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5` |

Access via SDK:
```typescript
const config = client.chainConfig;
config.tokens.USDC.address;
config.contracts.optionBook;
config.implementations.PUT;
config.priceFeeds.ETH;
```

## Security Notes

- **DEDICATED WALLET**: Use a dedicated wallet seed for this integration. Never reuse your primary/personal wallet.
- **SEED PHRASES**: Never log, store, or transmit seed phrases except when displaying to user during wallet creation
- **TRANSACTIONS**: Transactions are IRREVERSIBLE once broadcast. Always verify destination and amount.
- **APPROVALS**: Token approvals allow contracts to spend your tokens. Only approve trusted contracts.
- **ORDER EXPIRY**: Always verify `order.expiry` before filling to avoid wasted gas.
- **PREVIEW FIRST**: Use `previewFillOrder()` before filling to verify expected outcome.
- **GAS**: Ensure wallet has ETH for gas fees on Base network
- **UPDATES**: Skill updates never modify wallet secrets (`.env`, `WDK_SEED`)

## Network Configuration

- **Chain**: Base Mainnet (Chain ID 8453)
- **RPC**: Use dedicated RPC providers (Alchemy, Infura) for production
- **Collateral**: USDC (6 decimals), WETH (18 decimals), cbBTC (8 decimals)
- **Strikes**: 8 decimals internally
- **Expiry**: Use 8:00 UTC on expiry date for MM acceptance

## Compatibility

- Node.js >= 18
- ethers.js v6
- TypeScript >= 5.0
