import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { MEMO_PROGRAM_ID, type PaymentRequirement } from '@internet402/types';
import { verifySplPayment } from './verify-spl.js';
import type { ReplayStore } from './replay-store.js';

const RECIPIENT = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';
const MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

const expectedAta = getAssociatedTokenAddressSync(
  new PublicKey(MINT),
  new PublicKey(RECIPIENT),
).toBase58();

function makeExpected(overrides: Partial<PaymentRequirement> = {}): PaymentRequirement {
  return {
    address: RECIPIENT,
    amount: 1_000_000,
    token: MINT,
    memo: 'spl-memo',
    network: 'solana-mainnet',
    expires: 0,
    ...overrides,
  };
}

function makeReplayStore(): ReplayStore {
  const store = new Map<string, number>();
  return {
    has: vi.fn(async (sig: string) => store.has(sig)),
    add: vi.fn(async (sig: string, exp: number) => { store.set(sig, exp); }),
  };
}

function makeParsedTx({
  destination = expectedAta,
  amount = 1_000_000,
  memo = 'spl-memo',
  blockTime = Math.floor(Date.now() / 1000),
  transferType = 'transfer' as 'transfer' | 'transferChecked',
  mint = MINT,
}: {
  destination?: string;
  amount?: number;
  memo?: string;
  blockTime?: number;
  transferType?: 'transfer' | 'transferChecked';
  mint?: string;
} = {}) {
  const transferInfo: any = { destination, amount };
  if (transferType === 'transferChecked') {
    transferInfo.mint = mint;
    transferInfo.tokenAmount = { amount };
    delete transferInfo.amount;
  }

  return {
    blockTime,
    transaction: {
      message: {
        instructions: [
          {
            parsed: { type: transferType, info: transferInfo },
            programId: TOKEN_PROGRAM_ID,
          },
          {
            parsed: memo,
            programId: new PublicKey(MEMO_PROGRAM_ID),
          },
        ],
      },
    },
  };
}

function makeConnection(tx: unknown) {
  return {
    getParsedTransaction: vi.fn().mockResolvedValue(tx),
  } as any;
}

describe('verifySplPayment', () => {
  let replayStore: ReplayStore;

  beforeEach(() => {
    replayStore = makeReplayStore();
  });

  it('returns valid for a correct SPL transfer', async () => {
    const tx = makeParsedTx();
    const conn = makeConnection(tx);
    const result = await verifySplPayment(conn, 'spl-1', makeExpected(), replayStore);
    expect(result).toEqual({ valid: true });
  });

  it('returns valid for transferChecked with correct mint', async () => {
    const tx = makeParsedTx({ transferType: 'transferChecked' });
    const conn = makeConnection(tx);
    const result = await verifySplPayment(conn, 'spl-tc', makeExpected(), replayStore);
    expect(result).toEqual({ valid: true });
  });

  it('fails for transferChecked with wrong mint', async () => {
    const tx = makeParsedTx({
      transferType: 'transferChecked',
      mint: 'WrongMint1111111111111111111111111111111111',
    });
    const conn = makeConnection(tx);
    const result = await verifySplPayment(conn, 'spl-wm', makeExpected(), replayStore);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('No valid SPL transfer');
  });

  it('fails when destination does not match', async () => {
    const tx = makeParsedTx({ destination: 'WrongDest111111111111111111111111111111111111' });
    const conn = makeConnection(tx);
    const result = await verifySplPayment(conn, 'spl-2', makeExpected(), replayStore);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('No valid SPL transfer');
  });

  it('fails when amount is insufficient', async () => {
    const tx = makeParsedTx({ amount: 500 });
    const conn = makeConnection(tx);
    const result = await verifySplPayment(conn, 'spl-3', makeExpected(), replayStore);
    expect(result.valid).toBe(false);
  });

  it('fails when memo does not match', async () => {
    const tx = makeParsedTx({ memo: 'wrong' });
    const conn = makeConnection(tx);
    const result = await verifySplPayment(conn, 'spl-4', makeExpected(), replayStore);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Memo does not match');
  });

  it('fails for expired transaction', async () => {
    const pastExpires = Math.floor(Date.now() / 1000) - 600;
    const tx = makeParsedTx({ blockTime: pastExpires + 100 });
    const conn = makeConnection(tx);
    const result = await verifySplPayment(
      conn,
      'spl-5',
      makeExpected({ expires: pastExpires }),
      replayStore,
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('expired');
  });

  it('detects replay', async () => {
    const tx = makeParsedTx();
    const conn = makeConnection(tx);
    await verifySplPayment(conn, 'spl-replay', makeExpected(), replayStore);
    const result = await verifySplPayment(conn, 'spl-replay', makeExpected(), replayStore);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('already used');
  });

  it('handles transaction not found', async () => {
    const conn = makeConnection(null);
    const result = await verifySplPayment(conn, 'spl-null', makeExpected(), replayStore);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not found');
  });
});
