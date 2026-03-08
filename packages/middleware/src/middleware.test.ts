import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PAYMENT_HEADERS } from '@internet402/types';

const { mockVerifyPayment } = vi.hoisted(() => ({
  mockVerifyPayment: vi.fn(),
}));

vi.mock('@internet402/verifier', () => ({
  verifyPayment: mockVerifyPayment,
  MemoryReplayStore: class MockReplayStore {
    async has() { return false; }
    async add() {}
  },
}));

vi.mock('@solana/web3.js', async () => {
  const actual = await vi.importActual('@solana/web3.js');
  return {
    ...actual,
    Connection: class MockConnection {
      constructor() {}
    },
  };
});

import { createInternet402Handler } from './middleware.js';

const BASE_OPTIONS = {
  address: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
  amount: 1_000_000,
  token: 'SOL',
  rpcUrl: 'https://fake-rpc.test',
  expirySeconds: 300,
};

describe('createInternet402Handler', () => {
  beforeEach(() => {
    mockVerifyPayment.mockReset();
  });

  it('returns 402 with payment headers when no tx header is present', async () => {
    const handler = createInternet402Handler(BASE_OPTIONS);
    const result = await handler(() => undefined);

    expect(result.action).toBe('reject');
    expect(result.status).toBe(402);
    expect(result.headers).toBeDefined();
    expect(result.headers![PAYMENT_HEADERS.REQUIRED]).toBe('true');
    expect(result.headers![PAYMENT_HEADERS.ADDRESS]).toBe(BASE_OPTIONS.address);
    expect(result.headers![PAYMENT_HEADERS.AMOUNT]).toBe(String(BASE_OPTIONS.amount));
    expect(result.headers![PAYMENT_HEADERS.TOKEN]).toBe('SOL');
    expect(result.body).toHaveProperty('error', 'Payment Required');
    expect(result.body).toHaveProperty('memo');
  });

  it('returns pass when payment verification succeeds', async () => {
    mockVerifyPayment.mockResolvedValue({ valid: true });

    const handler = createInternet402Handler(BASE_OPTIONS);
    const result = await handler((name) => {
      if (name === PAYMENT_HEADERS.TX) return 'valid-tx-sig';
      return undefined;
    });

    expect(result.action).toBe('pass');
    expect(mockVerifyPayment).toHaveBeenCalledOnce();
  });

  it('returns 402 with error when payment verification fails', async () => {
    mockVerifyPayment.mockResolvedValue({
      valid: false,
      error: 'No valid SOL transfer found',
    });

    const handler = createInternet402Handler(BASE_OPTIONS);
    const result = await handler((name) => {
      if (name === PAYMENT_HEADERS.TX) return 'bad-tx-sig';
      return undefined;
    });

    expect(result.action).toBe('reject');
    expect(result.status).toBe(402);
    expect(result.body).toHaveProperty('error', 'No valid SOL transfer found');
    expect(result.body).toHaveProperty('message', 'Payment verification failed');
  });

  it('generates unique memo for each request', async () => {
    const handler = createInternet402Handler(BASE_OPTIONS);
    const result1 = await handler(() => undefined);
    const result2 = await handler(() => undefined);

    expect(result1.body!.memo).not.toBe(result2.body!.memo);
  });
});
