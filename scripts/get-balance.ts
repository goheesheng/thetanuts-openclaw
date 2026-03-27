#!/usr/bin/env npx tsx
/**
 * Get wallet balance (native and tokens)
 * Usage: npx tsx get-balance.ts --chain <evm|solana> --seed "<seed phrase>" [--index <number>] [--token <address>]
 *
 * Example:
 *   npx tsx get-balance.ts --chain evm --seed "word1 word2 ... word12"
 *   npx tsx get-balance.ts --chain evm --seed "..." --token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 */

import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';

const EVM_RPC_URL = process.env.THETANUTS_RPC_URL || 'https://mainnet.base.org';
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

// Common token addresses on Base
const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  // Base Mainnet
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': { symbol: 'USDC', decimals: 6 },
  '0x4200000000000000000000000000000000000006': { symbol: 'WETH', decimals: 18 },
  '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf': { symbol: 'cbBTC', decimals: 8 },
};

interface GetBalanceParams {
  chain: 'evm' | 'solana';
  seed: string;
  index: number;
  token?: string;
}

function parseArgs(args: string[]): GetBalanceParams {
  const params: Partial<GetBalanceParams> = {
    index: 0,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--chain':
        const chain = args[++i]?.toLowerCase();
        if (chain === 'evm' || chain === 'solana') {
          params.chain = chain;
        }
        break;
      case '--seed':
        params.seed = args[++i];
        break;
      case '--index':
        params.index = parseInt(args[++i]) || 0;
        break;
      case '--token':
        params.token = args[++i];
        break;
    }
  }

  // Validate required params
  const missing: string[] = [];
  if (!params.chain) missing.push('--chain (evm|solana)');
  if (!params.seed) missing.push('--seed "<seed phrase>"');

  if (missing.length > 0) {
    console.error(JSON.stringify({
      error: true,
      message: 'Missing required parameters',
      missing,
      usage: 'npx tsx get-balance.ts --chain <evm|solana> --seed "<seed phrase>" [--index <number>] [--token <address>]',
      example: 'npx tsx get-balance.ts --chain evm --seed "word1 word2 ... word12"',
      commonTokens: {
        USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        WETH: '0x4200000000000000000000000000000000000006',
        cbBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
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

  // Validate token address format for EVM
  if (params.token && params.chain === 'evm') {
    if (!params.token.match(/^0x[a-fA-F0-9]{40}$/)) {
      console.error(JSON.stringify({
        error: true,
        message: 'Invalid token address format. Must be 0x followed by 40 hex characters.',
        timestamp: new Date().toISOString(),
      }, null, 2));
      process.exit(1);
    }
  }

  return {
    chain: params.chain!,
    seed: seedPhrase,
    index: params.index!,
    token: params.token,
  };
}

function formatBalance(balanceWei: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = balanceWei / divisor;
  const fractionalPart = balanceWei % divisor;

  // Pad fractional part with leading zeros
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');

  // Trim trailing zeros but keep at least 2 decimal places
  let trimmed = fractionalStr.replace(/0+$/, '');
  if (trimmed.length < 2) trimmed = fractionalStr.slice(0, 2);

  return `${integerPart}.${trimmed}`;
}

async function getEvmBalance(seedPhrase: string, index: number, tokenAddress?: string) {
  const wallet = new WalletManagerEvm(seedPhrase, {
    provider: EVM_RPC_URL,
  });

  try {
    const account = await wallet.getAccount(index);
    const address = await account.getAddress();

    // Get native balance
    const nativeBalanceWei = await account.getBalance();
    const nativeBalance = formatBalance(nativeBalanceWei, 18);

    const result: any = {
      address,
      native: {
        symbol: 'ETH',
        balance: nativeBalance,
        balanceWei: nativeBalanceWei.toString(),
        decimals: 18,
      },
    };

    // Get token balance if requested
    if (tokenAddress) {
      const tokenBalanceRaw = await account.getTokenBalance(tokenAddress);
      const tokenInfo = KNOWN_TOKENS[tokenAddress] || { symbol: 'UNKNOWN', decimals: 18 };
      const tokenBalance = formatBalance(tokenBalanceRaw, tokenInfo.decimals);

      result.token = {
        address: tokenAddress,
        symbol: tokenInfo.symbol,
        balance: tokenBalance,
        balanceRaw: tokenBalanceRaw.toString(),
        decimals: tokenInfo.decimals,
      };
    }

    return result;
  } finally {
    wallet.dispose?.();
  }
}

async function getSolanaBalance(seedPhrase: string, index: number, tokenAddress?: string) {
  const wallet = new WalletManagerSolana(seedPhrase, {
    rpcUrl: SOLANA_RPC_URL,
  });

  try {
    const account = await wallet.getAccount(index);
    const address = await account.getAddress();

    // Get native balance (in lamports, 1 SOL = 10^9 lamports)
    const nativeBalanceLamports = await account.getBalance();
    const nativeBalance = formatBalance(nativeBalanceLamports, 9);

    const result: any = {
      address,
      native: {
        symbol: 'SOL',
        balance: nativeBalance,
        balanceLamports: nativeBalanceLamports.toString(),
        decimals: 9,
      },
    };

    // Get SPL token balance if requested
    if (tokenAddress) {
      try {
        const tokenBalanceRaw = await account.getTokenBalance(tokenAddress);
        result.token = {
          address: tokenAddress,
          balance: formatBalance(tokenBalanceRaw, 9), // Default to 9 decimals for SPL
          balanceRaw: tokenBalanceRaw.toString(),
          decimals: 9,
        };
      } catch (err) {
        result.token = {
          address: tokenAddress,
          error: 'Token account not found or token not supported',
        };
      }
    }

    return result;
  } finally {
    wallet.dispose?.();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const params = parseArgs(args);

  try {
    let balanceInfo;

    if (params.chain === 'evm') {
      balanceInfo = await getEvmBalance(params.seed, params.index, params.token);
    } else {
      balanceInfo = await getSolanaBalance(params.seed, params.index, params.token);
    }

    const result = {
      balance: {
        chain: params.chain,
        ...balanceInfo,
      },
      network: params.chain === 'evm' ? {
        name: 'Base Mainnet',
        chainId: 8453,
        rpcUrl: EVM_RPC_URL,
      } : {
        name: 'Solana Mainnet',
        rpcUrl: SOLANA_RPC_URL,
      },
      timestamp: new Date().toISOString(),
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      error: true,
      message: error instanceof Error ? error.message : 'Unknown error',
      chain: params.chain,
      timestamp: new Date().toISOString(),
    }, null, 2));
    process.exit(1);
  }
}

main();
