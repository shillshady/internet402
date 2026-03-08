import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { MEMO_PROGRAM_ID, type PaymentRequirement } from '@internet402/types';
import { verifySolPayment } from './verify-sol.js';
import type { ReplayStore } from './replay-store.js';

const RECIPIENT = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';

function makeExpected(overrides: Partial<PaymentRequirement> = {}): PaymentRequirement {
  return {
    address: RECIPIENT,
    amount: 1_000_000,
    token: 'SOL',
    memo: 'test-memo',
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
  destination = RECIPIENT,
  lamports = 1_000_000,
  memo = 'test-memo',
  blockTime = Math.floor(Date.now() / 1000),
}: {
  destination?: string;
  lamports?: number;
  memo?: string;
  blockTime?: number;
} = {}) {
  return {
    blockTime,
    transaction: {
      message: {
        instructions: [
          {
            parsed: {
              type: 'transfer',
              info: { destination, lamports },
            },
            programId: SystemProgram.programId,
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

describe('verifySolPayment', () => {
  let replayStore: ReplayStore;

  beforeEach(() => {
    replayStore = makeReplayStore();
  });

  it('returns valid for a correct payment', async () => {
    const tx = makeParsedTx();
    const conn = makeConnection(tx);
    const result = await verifySolPayment(conn, 'sig-1', makeExpected(), replayStore);
    expect(result).toEqual({ valid: true });
    expect(replayStore.add).toHaveBeenCalledWith('sig-1', expect.any(Number));
  });

  it('fails when recipient address does not match', async () => {
    const tx = makeParsedTx({ destination: 'WrongAddress11111111111111111111111111111111' });
    const conn = makeConnection(tx);
    const result = await verifySolPayment(conn, 'sig-2', makeExpected(), replayStore);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('No valid SOL transfer');
  });

  it('fails when amount is insufficient', async () => {
    const tx = makeParsedTx({ lamports: 500_000 });
    const conn = makeConnection(tx);
    const result = await verifySolPayment(conn, 'sig-3', makeExpected(), replayStore);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('No valid SOL transfer');
  });

  it('fails when memo does not match', async () => {
    const tx = makeParsedTx({ memo: 'wrong-memo' });
    const conn = makeConnection(tx);
    const result = await verifySolPayment(conn, 'sig-4', makeExpected(), replayStore);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Memo does not match');
  });

  it('fails when transaction is expired', async () => {
    const pastExpires = Math.floor(Date.now() / 1000) - 600;
    const tx = makeParsedTx({ blockTime: pastExpires + 100 });
    const conn = makeConnection(tx);
    const result = await verifySolPayment(
      conn,
      'sig-5',
      makeExpected({ expires: pastExpires }),
      replayStore,
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('expired');
  });

  it('detects replay (duplicate signature)', async () => {
    const tx = makeParsedTx();
    const conn = makeConnection(tx);
    // First call succeeds
    await verifySolPayment(conn, 'sig-replay', makeExpected(), replayStore);
    // Second call should detect replay
    const result = await verifySolPayment(conn, 'sig-replay', makeExpected(), replayStore);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('already used');
  });

  it('handles transaction not found', async () => {
    const conn = makeConnection(null);
    const result = await verifySolPayment(conn, 'sig-null', makeExpected(), replayStore);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('handles RPC fetch failure', async () => {
    const conn = {
      getParsedTransaction: vi.fn().mockRejectedValue(new Error('RPC error')),
    } as any;
    const result = await verifySolPayment(conn, 'sig-err', makeExpected(), replayStore);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Failed to fetch');
  });
});
