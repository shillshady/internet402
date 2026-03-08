import {
  Connection,
  SystemProgram,
  PublicKey,
  type ParsedTransactionWithMeta,
} from '@solana/web3.js';
import { MEMO_PROGRAM_ID, type PaymentRequirement, type VerificationResult } from '@internet402/types';
import type { ReplayStore } from './replay-store.js';

export async function verifySolPayment(
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

  const instructions = tx.transaction.message.instructions;
  let hasValidTransfer = false;
  let hasValidMemo = false;

  for (const ix of instructions) {
    if ('parsed' in ix && ix.programId.equals(SystemProgram.programId)) {
      const parsed = ix.parsed;
      if (
        parsed.type === 'transfer' &&
        parsed.info.destination === expected.address &&
        parsed.info.lamports >= expected.amount
      ) {
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
          // skip malformed memo
        }
      }
    }
  }

  if (!hasValidTransfer) {
    return { valid: false, error: 'No valid SOL transfer found matching payment requirement' };
  }

  if (!hasValidMemo) {
    return { valid: false, error: 'Memo does not match payment request' };
  }

  const expiry = expected.expires > 0 ? expected.expires : Math.floor(Date.now() / 1000) + 3600;
  await replayStore.add(txSignature, expiry);

  return { valid: true };
}
