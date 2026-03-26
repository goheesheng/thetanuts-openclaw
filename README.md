# Thetanuts OpenClaw Skill

OpenClaw skill for trading crypto options on [Thetanuts Finance](https://thetanuts.finance).

## Features

- Get real-time option prices (MM pricing)
- Build RFQ requests for vanilla options, spreads, butterflies, condors
- Check user positions and trade history
- Calculate payoffs, collateral requirements, and contract sizes
- Validate multi-leg option structures

## Prerequisites

1. [OpenClaw](https://docs.openclaw.ai/) installed and running
2. [Thetanuts SDK](https://github.com/Thetanuts-Finance/thetanuts-sdk) MCP server built

## Installation

### Step 1: Clone this repo to your OpenClaw workspace

```bash
cd ~/.openclaw/workspace/skills
git clone https://github.com/Thetanuts-Finance/thetanuts-openclaw.git thetanuts-client
```

Or copy manually:
```bash
cp -r /path/to/thetanuts_openclaw/skills/thetanuts-client ~/.openclaw/workspace/skills/
```

### Step 2: Build the MCP server

```bash
cd /path/to/thetanuts-sdk/mcp-server
npm install
npm run build
```

### Step 3: Configure the MCP server

Add to your `~/.openclaw/openclaw.json`:

```json
{
  "mcp": {
    "thetanuts": {
      "command": "node",
      "args": ["/path/to/thetanuts-sdk/mcp-server/dist/index.js"],
      "env": {
        "THETANUTS_RPC_URL": "https://mainnet.base.org"
      }
    }
  }
}
```

### Step 4: Reload OpenClaw

Start a new session to load the skill:
```
/new
```

Or restart the gateway.

## Usage

Once installed, you can ask questions like:

- "What's the current ETH price?"
- "Show me ETH put options"
- "I want to buy 1000 USDC worth of ETH 2500 put expiring March 28"
- "Check positions for 0x..."
- "What's the payoff if ETH settles at 2200?"
- "Validate butterfly with strikes 2400, 2500, 2600"

## Available Tools

The skill provides access to 65 MCP tools:

| Category | Tools |
|----------|-------|
| Market Data | `get_market_data`, `get_mm_all_pricing`, `get_mm_ticker_pricing`, etc. |
| User Data | `get_user_positions`, `get_user_history`, `get_user_rfqs` |
| RFQ Building | `build_rfq_request`, `build_spread_rfq`, `build_butterfly_rfq`, etc. |
| Calculations | `calculate_num_contracts`, `calculate_collateral_required`, `calculate_payout` |
| Validation | `validate_butterfly`, `validate_condor`, `validate_iron_condor` |

See `SKILL.md` for the complete list.

## Safety

This skill is **READ-ONLY**:
- Tools return transaction data but don't execute transactions
- Users must sign transactions with their own wallet
- No private keys are handled

## License

MIT

## Links

- [Thetanuts Finance](https://thetanuts.finance)
- [Thetanuts SDK](https://github.com/Thetanuts-Finance/thetanuts-sdk)
- [OpenClaw Docs](https://docs.openclaw.ai/)
