---
name: thetanuts
description: Trade crypto options on Thetanuts Finance - get MM pricing, build RFQs, analyze positions
homepage: https://github.com/Thetanuts-Finance/thetanuts-sdk
user-invocable: true
metadata: {"openclaw":{"emoji":"📈","requires":{"config":["mcp.thetanuts"]}}}
---

# Thetanuts Options Trading

You help users trade crypto options on Thetanuts Finance using MCP tools from the `thetanuts` server.

## Available Tools (65 total)

### Market Data
- `get_market_data` - Current BTC, ETH, SOL prices
- `get_market_prices` - All supported asset prices
- `get_mm_all_pricing` - All option prices for an asset (ETH/BTC)
- `get_mm_ticker_pricing` - Price for specific ticker (e.g., "ETH-28MAR26-2500-P")
- `get_mm_position_pricing` - Position-aware pricing with collateral cost
- `get_mm_spread_pricing` - Two-leg spread pricing
- `get_mm_condor_pricing` - Four-leg condor pricing
- `get_mm_butterfly_pricing` - Three-leg butterfly pricing

### Orders & Orderbook
- `fetch_orders` - All orders from orderbook
- `filter_orders` - Filter by call/put, expiry
- `preview_fill_order` - Dry-run order fill
- `encode_fill_order` - Encode fill transaction

### User Data
- `get_user_positions` - User's open positions
- `get_user_history` - Trade history
- `get_user_rfqs` - User's RFQ history
- `get_user_offers` - User's RFQ offers
- `get_user_options` - User's option holdings
- `get_stats` - Protocol statistics
- `get_referrer_stats` - Referrer statistics

### RFQ Building
- `build_rfq_request` - Build vanilla PUT/CALL RFQ
- `build_spread_rfq` - Build spread RFQ
- `build_butterfly_rfq` - Build butterfly RFQ
- `build_condor_rfq` - Build condor RFQ
- `build_iron_condor_rfq` - Build iron condor RFQ
- `build_physical_option_rfq` - Build physical-settled option
- `encode_request_for_quotation` - Encode RFQ transaction

### Calculations
- `calculate_num_contracts` - Contracts from USD amount
- `calculate_collateral_required` - Collateral needed
- `calculate_premium_per_contract` - Premium calculation
- `calculate_reserve_price` - Minimum acceptable premium
- `calculate_delivery_amount` - Physical option delivery
- `calculate_payout` - Option payoff at settlement
- `calculate_option_payout` - Option payout at settlement price
- `calculate_protocol_fee` - Protocol fee calculation

### Validation
- `validate_butterfly` - Check butterfly strikes (3 strikes, equal wings)
- `validate_condor` - Check condor strikes (4 strikes, equal spreads)
- `validate_iron_condor` - Check iron condor strikes
- `validate_ranger` - Check ranger strikes (2 strikes)

### Option & Token Info
- `get_option_info` - Option contract details
- `get_full_option_info` - Comprehensive option info
- `get_position_info` - Buyer/seller position info
- `get_token_balance` - Token balance
- `get_token_allowance` - Token allowance
- `get_token_info` - Token decimals/symbol
- `parse_ticker` - Parse ticker string
- `build_ticker` - Build ticker from components

### RFQ Management
- `get_rfq` - Get RFQ by ID
- `get_quotation` - Get quotation details
- `get_quotation_count` - Total quotations
- `encode_settle_quotation` - Settle after reveal
- `encode_settle_quotation_early` - Early settlement
- `encode_cancel_quotation` - Cancel RFQ
- `encode_cancel_offer` - Cancel offer

### Chain Configuration
- `get_chain_config` - Chain contracts/tokens
- `get_chain_config_by_id` - Config by chain ID
- `get_token_config_by_id` - Token config
- `get_option_implementation_info` - Deployment info

### Event Queries
- `get_order_fill_events` - Historical fill events
- `get_option_created_events` - Option creation events
- `get_quotation_requested_events` - RFQ request events
- `get_quotation_settled_events` - RFQ settlement events
- `get_position_closed_events` - Position close events

### Utilities
- `convert_decimals` - To/from chain decimals
- `generate_example_keypair` - Demo ECDH keypair
- `encode_approve` - Token approval transaction

## Common Workflows

### Check Option Prices
1. Ask user for underlying (ETH or BTC)
2. Use `get_mm_all_pricing` to show all available options
3. For specific option: `get_mm_ticker_pricing` with ticker like "ETH-28MAR26-2500-P"

Example:
```
User: "What are the current ETH put options?"
Agent: Use get_mm_all_pricing with underlying="ETH", then filter for puts
```

### Build an RFQ
1. Gather: underlying, strike, expiry, direction (buy/sell), size in USD
2. Use `calculate_num_contracts` to get contract count
3. Use `build_rfq_request` to create RFQ parameters
4. Use `encode_request_for_quotation` to get transaction data
5. Return the `to` and `data` for user to sign with their wallet

Example:
```
User: "I want to buy 1000 USDC worth of ETH 2500 put expiring March 28"
Agent:
1. calculate_num_contracts(tradeAmount=1000, product="PUT", strikes=[2500], isBuy=true)
2. build_rfq_request(underlying="ETH", optionType="PUT", strike=2500, ...)
3. encode_request_for_quotation(rfqParams)
4. Return transaction data for signing
```

### Check User Positions
1. Get wallet address from user
2. Use `get_user_positions` to show open positions
3. Use `get_mm_ticker_pricing` to get current prices for P&L

### Calculate Payoff
1. Get option details (type, strikes)
2. Use `calculate_payout` with settlement price scenarios
3. Show potential profit/loss at different prices

### Validate Multi-Leg Structures
1. For butterfly: use `validate_butterfly` with 3 strikes (must have equal wing widths)
2. For condor: use `validate_condor` with 4 strikes (must have equal spread widths)
3. For iron condor: use `validate_iron_condor` with 4 strikes

## Ticker Format

Options use the format: `{UNDERLYING}-{EXPIRY}-{STRIKE}-{TYPE}`

Examples:
- `ETH-28MAR26-2500-P` = ETH Put, $2500 strike, March 28 2026 expiry
- `BTC-28MAR26-95000-C` = BTC Call, $95000 strike, March 28 2026 expiry

Use `parse_ticker` to break down a ticker, `build_ticker` to construct one.

## Important Notes

- **READ-ONLY**: Tools return transaction data but DON'T execute transactions
- **User must sign**: All transactions need wallet signature
- **No private keys**: Never handle or request private keys
- **Expiry format**: Use 8:00 UTC expiries for MM acceptance
- **numContracts precision**: Use BigInt for exact position closing
- **Collateral**: USDC (6 decimals), WETH (18 decimals), cbBTC (8 decimals)
- **Strikes**: Always in 8 decimals (e.g., 2500e8 = 250000000000)
