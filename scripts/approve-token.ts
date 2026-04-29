#!/usr/bin/env npx tsx
/**
 * Approve ERC20 token spending for a spender contract
 * Usage: npx tsx approve-token.ts --token <address> --spender <address> --amount <number> --seed "<seed phrase>" [--wait]
 *
 * Example:
 *   npx tsx approve-token.ts --token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 --spender 0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5 --max --seed "word1 word2 ... word12" --wait
 */

import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';

const EVM_RPC_URL = process.env.THETANUTS_RPC_URL || 'https://mainnet.base.org';

// Common token addresses on Base
const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': { symbol: 'USDC', decimals: 6 },
  '0x4200000000000000000000000000000000000006': { symbol: 'WETH', decimals: 18 },
  '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf': { symbol: 'cbBTC', decimals: 8 },
};

// Common spender addresses
const KNOWN_SPENDERS: Record<string, string> = {
  '0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5': 'Thetanuts RFQ Contract',
};

// Max uint256 for unlimited approval
const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

interface ApproveTokenParams {
  token: string;
  spender: string;
  amount?: string;
  max: boolean;
  seed: string;
  index: number;
  wait: boolean;
}

function parseArgs(args: string[]): ApproveTokenParams {
  const params: Partial<ApproveTokenParams> = {
    index: 0,
    max: false,
    wait: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--token':
        params.token = args[++i];
        break;
      case '--spender':
        params.spender = args[++i];
        break;
      case '--amount':
        params.amount = args[++i];
        break;
      case '--max':
        params.max = true;
        break;
      case '--seed':
        params.seed = args[++i];
        break;
      case '--index':
        params.index = parseInt(args[++i]) || 0;
        break;
      case '--wait':
        params.wait = true;
        break;
    }
  }

  // Validate required params
  const missing: string[] = [];
  if (!params.token) missing.push('--token <address>');
  if (!params.spender) missing.push('--spender <address>');
  if (!params.seed) missing.push('--seed "<seed phrase>"');
  if (!params.max && !params.amount) missing.push('--amount <number> or --max');

  if (missing.length > 0) {
    console.error(JSON.stringify({
      error: true,
      message: 'Missing required parameters',
      missing,
      usage: 'npx tsx approve-token.ts --token <address> --spender <address> (--amount <number> | --max) --seed "<seed phrase>" [--wait]',
      example: 'npx tsx approve-token.ts --token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 --spender 0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5 --max --seed "word1 word2 ... word12" --wait',
      commonTokens: {
        USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        WETH: '0x4200000000000000000000000000000000000006',
        cbBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
      },
      commonSpenders: {
        'Thetanuts RFQ': '0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5',
      },
      timestamp: new Date().toISOString(),
    }, null, 2));
    process.exit(1);
  }

  // Validate seed phrase
  const seedPhrase = params.seed!.trim();
  if (!validateMnemonic(seedPhrase, wordlist)) {
    console.error(JSON.stringify({
      error: true,
      message: 'Invalid seed phrase. Must be a valid BIP-39 mnemonic (12 or 24 words).',
      timestamp: new Date().toISOString(),
    }, null, 2));
    process.exit(1);
  }

  // Validate token address format
  if (!params.token!.match(/^0x[a-fA-F0-9]{40}$/)) {
    console.error(JSON.stringify({
      error: true,
      message: 'Invalid token address format. Must be 0x followed by 40 hex characters.',
      timestamp: new Date().toISOString(),
    }, null, 2));
    process.exit(1);
  }

  // Validate spender address format
  if (!params.spender!.match(/^0x[a-fA-F0-9]{40}$/)) {
    console.error(JSON.stringify({
      error: true,
      message: 'Invalid spender address format. Must be 0x followed by 40 hex characters.',
      timestamp: new Date().toISOString(),
    }, null, 2));
    process.exit(1);
  }

  return {
    token: params.token!,
    spender: params.spender!,
    amount: params.amount,
    max: params.max!,
    seed: seedPhrase,
    index: params.index!,
    wait: params.wait!,
  };
}

function formatAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;

  if (amount === MAX_UINT256) {
    return 'UNLIMITED';
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  let trimmed = fractionalStr.replace(/0+$/, '');
  if (trimmed.length < 2) trimmed = fractionalStr.slice(0, 2);

  return `${integerPart}.${trimmed}`;
}

async function main() {
  const args = process.argv.slice(2);
  const params = parseArgs(args);

  const wallet = new WalletManagerEvm(params.seed, {
    provider: EVM_RPC_URL,
  });

  try {
    const account = await wallet.getAccount(params.index);
    const address = await account.getAddress();

    // Determine approval amount
    let approvalAmount: bigint;
    if (params.max) {
      approvalAmount = MAX_UINT256;
    } else {
      // Parse amount - assume it's in token units (e.g., "100" for 100 USDC)
      const tokenInfo = KNOWN_TOKENS[params.token] || { decimals: 18 };
      const amountFloat = parseFloat(params.amount!);
      approvalAmount = BigInt(Math.floor(amountFloat * (10 ** tokenInfo.decimals)));
    }

    const tokenInfo = KNOWN_TOKENS[params.token] || { symbol: 'UNKNOWN', decimals: 18 };
    const spenderName = KNOWN_SPENDERS[params.spender] || params.spender;

    // Pre-check: ensure wallet has ETH for gas
    const ethBalance = await account.getBalance();
    if (ethBalance === 0n) {
      console.log(JSON.stringify({
        error: true,
        message: 'Wallet has 0 ETH on Base. You need ETH for gas fees. Bridge ETH to Base via bridge.base.org.',
        address,
        timestamp: new Date().toISOString(),
      }, null, 2));
      wallet.dispose?.();
      process.exit(1);
    }

    console.error(`Approving ${tokenInfo.symbol} spending for ${spenderName}...`);

    // Call WDK approve method
    const txResult = await account.approve({
      token: params.token,
      spender: params.spender,
      amount: approvalAmount,
    });

    const result: any = {
      approval: {
        hash: txResult.hash,
        token: params.token,
        tokenSymbol: tokenInfo.symbol,
        spender: params.spender,
        spenderName: spenderName,
        amount: approvalAmount.toString(),
        amountFormatted: formatAmount(approvalAmount, tokenInfo.decimals),
        from: address,
      },
      warning: `You are approving ${spenderName} to spend your ${tokenInfo.symbol}. Only approve contracts you trust. This approval can be revoked by approving 0.`,
      network: {
        name: 'Base Mainnet',
        chainId: 8453,
        rpcUrl: EVM_RPC_URL,
      },
      timestamp: new Date().toISOString(),
    };

    // Wait for confirmation if requested
    if (params.wait) {
      console.error('Waiting for confirmation...');

      let receipt = null;
      const startTime = Date.now();
      const timeout = 60000;

      while (!receipt && (Date.now() - startTime) < timeout) {
        receipt = await account.getTransactionReceipt(txResult.hash);
        if (!receipt) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (receipt) {
        result.receipt = {
          status: receipt.status,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed?.toString(),
          transactionIndex: receipt.index,
        };

        if (receipt.status === 1) {
          result.success = true;
          console.error('Approval confirmed!');
        } else {
          result.success = false;
          result.warning = 'Approval transaction REVERTED. Check BaseScan for details.';
        }
      } else {
        result.pending = true;
        result.warning = `Approval broadcast but not confirmed within 60s. Check BaseScan: https://basescan.org/tx/${txResult.hash}`;
      }
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    let errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('insufficient funds')) {
      errorMessage = 'Insufficient ETH for gas. Fund your wallet with ETH on Base network.';
    }

    console.error(JSON.stringify({
      error: true,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    }, null, 2));
    process.exit(1);
  } finally {
    wallet.dispose?.();
  }
}

main();
