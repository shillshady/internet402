import { describe, it, expect, vi } from 'vitest';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { MEMO_PROGRAM_ID, type PaymentRequirement } from '@internet402/types';
import { verifyPayment } from './index.js';
import type { ReplayStore } from './replay-store.js';

const RECIPIENT = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';
const MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

function makeReplayStore(): ReplayStore {
  return {
    has: vi.fn(async () => false),
    add: vi.fn(async () => {}),
  };
}

describe('verifyPayment', () => {
  it('routes to verifySolPayment when token is SOL', async () => {
    const solTx = {
      blockTime: Math.floor(Date.now() / 1000),
      transaction: {
        message: {
          instructions: [
            {
              parsed: { type: 'transfer', info: { destination: RECIPIENT, lamports: 1000 } },
              programId: SystemProgram.programId,
            },
            {
              parsed: 'sol-memo',
              programId: new PublicKey(MEMO_PROGRAM_ID),
            },
          ],
        },
      },
    };

    const conn = { getParsedTransaction: vi.fn().mockResolvedValue(solTx) } as any;
    const expected: PaymentRequirement = {
      address: RECIPIENT,
      amount: 1000,
      token: 'SOL',
      memo: 'sol-memo',
      network: 'solana-mainnet',
      expires: 0,
    };

    const result = await verifyPayment(conn, 'sol-sig', expected, makeReplayStore());
    expect(result.valid).toBe(true);
  });

  it('routes to verifySplPayment when token is not SOL', async () => {
    const expectedAta = getAssociatedTokenAddressSync(
      new PublicKey(MINT),
      new PublicKey(RECIPIENT),
    ).toBase58();

    const splTx = {
      blockTime: Math.floor(Date.now() / 1000),
      transaction: {
        message: {
          instructions: [
            {
              parsed: { type: 'transfer', info: { destination: expectedAta, amount: 5000 } },
              programId: TOKEN_PROGRAM_ID,
            },
            {
              parsed: 'spl-memo',
              programId: new PublicKey(MEMO_PROGRAM_ID),
            },
          ],
        },
      },
    };

    const conn = { getParsedTransaction: vi.fn().mockResolvedValue(splTx) } as any;
    const expected: PaymentRequirement = {
      address: RECIPIENT,
      amount: 5000,
      token: MINT,
      memo: 'spl-memo',
      network: 'solana-mainnet',
      expires: 0,
    };

    const result = await verifyPayment(conn, 'spl-sig', expected, makeReplayStore());
    expect(result.valid).toBe(true);
  });
});
