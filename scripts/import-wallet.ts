#!/usr/bin/env npx tsx
/**
 * Import an existing wallet using seed phrase
 * Usage: npx tsx import-wallet.ts --chain <evm|solana> --seed "<seed phrase>" [--index <number>]
 *
 * Example:
 *   npx tsx import-wallet.ts --chain evm --seed "word1 word2 ... word12"
 *   npx tsx import-wallet.ts --chain solana --seed "word1 word2 ... word12" --index 0
 */

import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';

const EVM_RPC_URL = process.env.THETANUTS_RPC_URL || 'https://mainnet.base.org';
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

interface ImportWalletParams {
  chain: 'evm' | 'solana';
  seed: string;
  index: number;
}

function parseArgs(args: string[]): ImportWalletParams {
  const params: Partial<ImportWalletParams> = {
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
      usage: 'npx tsx import-wallet.ts --chain <evm|solana> --seed "<seed phrase>" [--index <number>]',
      example: 'npx tsx import-wallet.ts --chain evm --seed "word1 word2 ... word12"',
      timestamp: new Date().toISOString(),
    }, null, 2));
    process.exit(1);
  }

  // Validate seed phrase is valid BIP-39
  const seedPhrase = params.seed!.trim();
  if (!validateMnemonic(seedPhrase, wordlist)) {
    console.error(JSON.stringify({
      error: true,
      message: 'Invalid seed phrase. Must be a valid BIP-39 mnemonic (12 or 24 words).',
      hint: 'Check that all words are spelled correctly and are valid BIP-39 words.',
      timestamp: new Date().toISOString(),
    }, null, 2));
    process.exit(1);
  }

  return {
    chain: params.chain!,
    seed: seedPhrase,
    index: params.index!,
  };
}

async function importEvmWallet(seedPhrase: string, index: number) {
  const wallet = new WalletManagerEvm(seedPhrase, {
    provider: EVM_RPC_URL,
  });

  try {
    const account = await wallet.getAccount(index);
    const address = await account.getAddress();
    const path = `m/44'/60'/0'/0/${index}`;

    return {
      address,
      derivationPath: path,
    };
  } finally {
    wallet.dispose?.();
  }
}

async function importSolanaWallet(seedPhrase: string, index: number) {
  const wallet = new WalletManagerSolana(seedPhrase, {
    rpcUrl: SOLANA_RPC_URL,
  });

  try {
    const account = await wallet.getAccount(index);
    const address = await account.getAddress();
    const path = `m/44'/501'/${index}'/0'`;

    return {
      address,
      derivationPath: path,
    };
  } finally {
    wallet.dispose?.();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const params = parseArgs(args);

  try {
    let walletInfo;

    if (params.chain === 'evm') {
      walletInfo = await importEvmWallet(params.seed, params.index);
    } else {
      walletInfo = await importSolanaWallet(params.seed, params.index);
    }

    // NOTE: We do NOT include the seed phrase in the output for import
    const result = {
      wallet: {
        chain: params.chain,
        address: walletInfo.address,
        derivationPath: walletInfo.derivationPath,
        index: params.index,
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
