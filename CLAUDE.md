# Thetanuts OpenClaw Skill

## Project Structure
- `SKILL.md` - Agent instruction set (loaded by OpenClaw, 1800 lines)
- `scripts/*.js` - Wallet management scripts (run with `node`)
- `scripts/*.ts` - Trading scripts (run with `npx tsx`)
- `scripts/onboard.sh` - Installs deps at project root AND `~/.openclaw/wdk-mcp/`
- `manifest.json` - ClawHub publishing metadata

## SDK Quirks (@thetanuts-finance/thetanuts-client)
- `client.erc20.approve()` returns a TransactionReceipt, NOT TransactionResponse. Do not call `.wait()` on it.
- `client.optionBook.fillOrder()` same — returns receipt, already waited internally.
- `client.erc20.getBalance(token, address)` returns `Promise<bigint>`.
- `client.erc20.getAllowance(token, owner, spender)` returns `Promise<bigint>`.
- Strikes use 8 decimals internally. USDC uses 6, WETH uses 18.

## Dependencies
- `@scure/bip39` must be a direct dependency — wallet scripts import it directly, not via WDK.
- Two install targets: project root (for scripts) and `~/.openclaw/wdk-mcp/` (for MCP runtime).

## Repo
- GitHub: `goheesheng/thetanuts-openclaw`
- ClawHub: `clawhub.ai/goheesheng/thetanuts`
- Published with: `clawhub skill publish /absolute/path --slug thetanuts --version X.Y.Z`

## Common Commands
- `node scripts/wallet-create.js` - Create wallet (must have no existing WDK_SEED in .env)
- `npx tsx scripts/fill-order.ts --order-index 0 --collateral 10 --seed "..." --execute --wait` - Fill order
- `npx tsx scripts/check-orderbook.ts --underlying ETH --type PUT --strike 1900 --expiry <ts> --direction sell` - Check liquidity
- `bash scripts/onboard.sh` - Full setup (installs both dep targets)
- `bash scripts/update.sh` - Check for manifest-based updates

## Gotchas
- Wallet scripts output JSON to stdout — this is intentional, the agent parses it.
- `onboard.sh` changes directory during execution — use absolute paths when extending.
- SKILL.md is 79KB — large but within OpenClaw limits.
- All trading on Base Mainnet (chain ID 8453). ETH needed for gas, USDC for PUTs, WETH for CALLs.
