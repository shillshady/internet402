import {
  Connection,
  PublicKey,
  type ParsedTransactionWithMeta,
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { MEMO_PROGRAM_ID, type PaymentRequirement, type VerificationResult } from '@internet402/types';
import type { ReplayStore } from './replay-store.js';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

export async function verifySplPayment(
  connection: Connection,
  txSignature: string,
  expected: PaymentRequirement,
  replayStore: ReplayStore,
): Promise<VerificationResult> {
  if (await replayStore.has(txSignature)) {
    return { valid: false, error: 'Transaction already used' };
  }

  let tx: ParsedTransactionWithMeta | null;
  try {
    tx = await connection.getParsedTransaction(txSignature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
  } catch {
    return { valid: false, error: 'Failed to fetch transaction' };
  }

  if (!tx) {
    return { valid: false, error: 'Transaction not found or not confirmed' };
  }

  if (expected.expires > 0 && tx.blockTime) {
    if (tx.blockTime > expected.expires) {
      return { valid: false, error: 'Transaction expired' };
    }
  }

  const mint = new PublicKey(expected.token);
  const recipientPubkey = new PublicKey(expected.address);
  const expectedAta = getAssociatedTokenAddressSync(mint, recipientPubkey);

  const instructions = tx.transaction.message.instructions;
  let hasValidTransfer = false;
  let hasValidMemo = false;

  for (const ix of instructions) {
    if ('parsed' in ix && ix.programId.equals(TOKEN_PROGRAM_ID)) {
      const parsed = ix.parsed;
      if (
        (parsed.type === 'transfer' || parsed.type === 'transferChecked') &&
        (parsed.info.destination === expectedAta.toBase58() ||
         parsed.info.destination === expected.address) &&
        Number(parsed.info.amount ?? parsed.info.tokenAmount?.amount ?? 0) >= expected.amount
      ) {
        if (parsed.type === 'transferChecked' && parsed.info.mint !== expected.token) {
          continue;
        }
        hasValidTransfer = true;
      }
    }

    if ('parsed' in ix && ix.programId.equals(new PublicKey(MEMO_PROGRAM_ID))) {
      if (typeof ix.parsed === 'string' && ix.parsed === expected.memo) {
        hasValidMemo = true;
      }
    }

    if (!('parsed' in ix) && ix.programId.equals(new PublicKey(MEMO_PROGRAM_ID))) {
      if ('data' in ix) {
        try {
          const decoded = Buffer.from(ix.data as string, 'base64').toString('utf-8');
          if (decoded === expected.memo) hasValidMemo = true;
        } catch {
          // skip
        }
      }
    }
  }

  if (!hasValidTransfer) {
    return { valid: false, error: 'No valid SPL transfer found matching payment requirement' };
  }

  if (!hasValidMemo) {
    return { valid: false, error: 'Memo does not match payment request' };
  }

  const expiry = expected.expires > 0 ? expected.expires : Math.floor(Date.now() / 1000) + 3600;
  await replayStore.add(txSignature, expiry);

  return { valid: true };
}
