# Thetanuts OpenClaw Skill

OpenClaw skill for trading crypto options on [Thetanuts Finance](https://thetanuts.finance) with integrated wallet management.

## Features

- **Wallet Management**: Create and import EVM/Solana wallets using Tether WDK
- **Balance Queries**: Check native (ETH/SOL) and token balances (USDC, WETH, cbBTC)
- **Options Trading**: Get MM pricing, build RFQs, fetch orderbook
- **Position Tracking**: Check user positions and calculate payoffs

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

- "Create a new EVM wallet for me"
- "Check my wallet balance" (provide seed phrase)
- "Show me ETH put options"
- "I want to buy 0.1 ETH 2000 put expiring March 28"
- "Check positions for 0x..."

## Wallet Management Scripts

| Script | Description |
|--------|-------------|
| `create-wallet.ts` | Create new EVM or Solana wallet |
| `import-wallet.ts` | Import existing wallet from seed phrase |
| `get-balance.ts` | Get native and token balances |
| `sign-message.ts` | Sign messages for authentication |

### Create New Wallet

```bash
npx tsx scripts/create-wallet.ts --chain evm
npx tsx scripts/create-wallet.ts --chain solana
```

### Import Existing Wallet

```bash
npx tsx scripts/import-wallet.ts --chain evm --seed "word1 word2 ... word12"
```

### Check Balance

```bash
# Native balance
npx tsx scripts/get-balance.ts --chain evm --seed "..."

# With USDC token balance
npx tsx scripts/get-balance.ts --chain evm --seed "..." --token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Sign Message

```bash
npx tsx scripts/sign-message.ts --chain evm --seed "..." --message "Hello"
```

## Trading Scripts

| Script | Description |
|--------|-------------|
| `get-prices.ts` | Get current BTC, ETH prices and protocol stats |
| `get-mm-pricing.ts` | Get MM option pricing with filters |
| `get-positions.ts` | Get user positions by wallet address |
| `build-rfq.ts` | Build RFQ transaction data |
| `fetch-orders.ts` | Fetch orderbook with filters |
| `calculate-payout.ts` | Calculate option payout at settlement |

### Get Option Pricing

```bash
npx tsx scripts/get-mm-pricing.ts ETH --type PUT
```

### Build RFQ

```bash
npx tsx scripts/build-rfq.ts --underlying ETH --type PUT --strike 2000 --expiry 1774684800 --contracts 0.1 --direction buy
```

## Complete Trading Workflow

1. **Create wallet** (or import existing):
   ```bash
   npx tsx scripts/create-wallet.ts --chain evm
   ```

2. **Check balance**:
   ```bash
   npx tsx scripts/get-balance.ts --chain evm --seed "your seed phrase"
   ```

3. **View available options**:
   ```bash
   npx tsx scripts/get-mm-pricing.ts ETH --type PUT
   ```

4. **Build RFQ transaction**:
   ```bash
   npx tsx scripts/build-rfq.ts --underlying ETH --type PUT --strike 2000 --expiry 1774684800 --contracts 0.1 --direction buy
   ```

5. **Sign and submit** transaction with your wallet

## Configuration

```bash
# EVM RPC (default: Base Mainnet)
export THETANUTS_RPC_URL="https://mainnet.base.org"

# Solana RPC (default: Mainnet)
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
```

## Common Token Addresses (Base)

| Token | Address |
|-------|---------|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| WETH | `0x4200000000000000000000000000000000000006` |
| cbBTC | `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` |

## Security Considerations

- **SEED PHRASES**: Save securely, never share. Scripts display seed only during creation.
- **KEY DISPOSAL**: Wallet scripts automatically clear keys from memory after use.
- **READ-ONLY TRADING**: Trading scripts return transaction data but don't execute.
- **USER SIGNS**: You must sign transactions with your own wallet.

## License

MIT

## Links

- [Thetanuts Finance](https://thetanuts.finance)
- [Thetanuts SDK](https://github.com/Thetanuts-Finance/thetanuts-sdk)
- [Tether WDK](https://docs.wdk.tether.io)
- [OpenClaw Docs](https://docs.openclaw.ai/)
