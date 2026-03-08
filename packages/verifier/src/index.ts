import { Connection } from '@solana/web3.js';
import type { PaymentRequirement, VerificationResult } from '@internet402/types';
import { verifySolPayment } from './verify-sol.js';
import { verifySplPayment } from './verify-spl.js';
import type { ReplayStore } from './replay-store.js';

export { verifySolPayment } from './verify-sol.js';
export { verifySplPayment } from './verify-spl.js';
export { MemoryReplayStore } from './replay-store.js';
export type { ReplayStore } from './replay-store.js';

export async function verifyPayment(
  connection: Connection,
  txSignature: string,
  expected: PaymentRequirement,
  replayStore: ReplayStore,
): Promise<VerificationResult> {
  if (expected.token === 'SOL') {
    return verifySolPayment(connection, txSignature, expected, replayStore);
  }
  return verifySplPayment(connection, txSignature, expected, replayStore);
}
