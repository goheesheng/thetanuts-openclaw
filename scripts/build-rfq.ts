#!/usr/bin/env npx tsx
/**
 * Build RFQ request for Thetanuts Finance
 * Usage: npx tsx build-rfq.ts --underlying <ETH|BTC> --type <PUT|CALL> --strike <price> --expiry <timestamp> --contracts <amount> --direction <buy|sell>
 *
 * Example:
 *   npx tsx build-rfq.ts --underlying ETH --type PUT --strike 2500 --expiry 1711612800 --contracts 1 --direction buy
 */

import { ThetanutsClient } from '@thetanuts-finance/thetanuts-client';
import { JsonRpcProvider } from 'ethers';

const RPC_URL = process.env.THETANUTS_RPC_URL || 'https://mainnet.base.org';
const CHAIN_ID = 8453;

interface RFQParams {
  underlying: 'ETH' | 'BTC';
  type: 'PUT' | 'CALL';
  strike: number;
  expiry: number;
  contracts: number;
  direction: 'buy' | 'sell';
  requester?: string;
  collateral?: 'USDC' | 'WETH';
  deadlineMinutes?: number;
}

function parseArgs(args: string[]): RFQParams {
  const params: Partial<RFQParams> = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--underlying':
        params.underlying = args[++i]?.toUpperCase() as 'ETH' | 'BTC';
        break;
      case '--type':
        params.type = args[++i]?.toUpperCase() as 'PUT' | 'CALL';
        break;
      case '--strike':
        params.strike = parseFloat(args[++i]);
        break;
      case '--expiry':
        params.expiry = parseInt(args[++i]);
        break;
      case '--contracts':
        params.contracts = parseFloat(args[++i]);
        break;
      case '--direction':
        params.direction = args[++i]?.toLowerCase() as 'buy' | 'sell';
        break;
      case '--requester':
        params.requester = args[++i];
        break;
      case '--collateral':
        params.collateral = args[++i]?.toUpperCase() as 'USDC' | 'WETH';
        break;
      case '--deadline':
        params.deadlineMinutes = parseInt(args[++i]);
        break;
    }
  }

  // Validate required params
  const missing: string[] = [];
  if (!params.underlying || !['ETH', 'BTC'].includes(params.underlying)) missing.push('--underlying (ETH|BTC)');
  if (!params.type || !['PUT', 'CALL'].includes(params.type)) missing.push('--type (PUT|CALL)');
  if (!params.strike || isNaN(params.strike)) missing.push('--strike (price)');
  if (!params.expiry || isNaN(params.expiry)) missing.push('--expiry (unix timestamp)');
  if (!params.contracts || isNaN(params.contracts)) missing.push('--contracts (amount)');
  if (!params.direction || !['buy', 'sell'].includes(params.direction)) missing.push('--direction (buy|sell)');

  if (missing.length > 0) {
    console.error(JSON.stringify({
      error: true,
      message: 'Missing or invalid required parameters',
      missing,
      usage: 'npx tsx build-rfq.ts --underlying <ETH|BTC> --type <PUT|CALL> --strike <price> --expiry <timestamp> --contracts <amount> --direction <buy|sell>',
      example: 'npx tsx build-rfq.ts --underlying ETH --type PUT --strike 2500 --expiry 1711612800 --contracts 1 --direction buy',
      help: {
        expiry: 'Unix timestamp for 8:00 UTC on expiry date. Example: March 28 2026 8:00 UTC = 1711612800',
        strike: 'Strike price in USD (e.g., 2500 for $2,500)',
        contracts: 'Number of option contracts (e.g., 1 = 1 contract)',
      },
    }, null, 2));
    process.exit(1);
  }

  return params as RFQParams;
}

async function main() {
  const args = process.argv.slice(2);
  const params = parseArgs(args);

  const provider = new JsonRpcProvider(RPC_URL);
  const client = new ThetanutsClient({
    chainId: CHAIN_ID,
    provider,
  });

  try {
    // Use a placeholder address if requester not provided
    // User will need to replace this or provide --requester
    const requesterAddress = params.requester || '0x0000000000000000000000000000000000000001';

    // Determine correct collateral based on option type:
    // - PUT options use USDC (quote asset)
    // - CALL options (INVERSE_CALL) use WETH (base asset)
    const defaultCollateral = params.type === 'CALL' ? 'WETH' : 'USDC';
    const collateralToken = params.collateral || defaultCollateral;

    // Build RFQ request (synchronous)
    const rfqRequest = client.optionFactory.buildRFQRequest({
      requester: requesterAddress,
      underlying: params.underlying,
      optionType: params.type,
      strike: params.strike,
      expiry: params.expiry,
      numContracts: params.contracts,
      isLong: params.direction === 'buy',
      collateralToken,
      offerDeadlineMinutes: params.deadlineMinutes || 6,  // 6 min default for faster MM response
    });

    // Encode the transaction (synchronous)
    const encoded = client.optionFactory.encodeRequestForQuotation(rfqRequest);

    // Format ticker
    const expiryDate = new Date(params.expiry * 1000);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = expiryDate.getUTCDate();
    const month = months[expiryDate.getUTCMonth()];
    const year = expiryDate.getUTCFullYear().toString().slice(-2);
    const ticker = `${params.underlying}-${day}${month}${year}-${params.strike}-${params.type === 'PUT' ? 'P' : 'C'}`;

    const result = {
      rfq: {
        ticker,
        underlying: params.underlying,
        type: params.type,
        strike: params.strike,
        expiry: params.expiry,
        expiryDate: expiryDate.toISOString(),
        contracts: params.contracts,
        direction: params.direction,
        isBuy: params.direction === 'buy',
        collateral: collateralToken,
        collateralNote: params.type === 'CALL'
          ? 'CALL options (INVERSE_CALL) require WETH collateral'
          : 'PUT options require USDC collateral',
      },
      transaction: {
        to: encoded.to,
        data: encoded.data,
        value: encoded.value?.toString() || '0',
      },
      instructions: [
        'This transaction data is ready to be signed and sent.',
        'Use your wallet (MetaMask, etc.) to sign and broadcast.',
        'The transaction will submit an RFQ to Thetanuts market makers.',
        'After submission, market makers will provide quotes.',
      ],
      timestamp: new Date().toISOString(),
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      error: true,
      message: error instanceof Error ? error.message : 'Unknown error',
      params,
      timestamp: new Date().toISOString(),
    }, null, 2));
    process.exit(1);
  }
}

main();
