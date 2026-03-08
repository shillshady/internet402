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

import { expressInternet402 } from './express.js';

const BASE_OPTIONS = {
  address: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
  amount: 1_000_000,
  token: 'SOL',
  rpcUrl: 'https://fake-rpc.test',
};

function makeMockReq(headers: Record<string, string> = {}) {
  return { headers } as any;
}

function makeMockRes() {
  const res: any = {
    _status: 200,
    _headers: {} as Record<string, string>,
    _json: null,
    status(code: number) { res._status = code; return res; },
    setHeader(key: string, value: string) { res._headers[key] = value; },
    json(body: any) { res._json = body; },
  };
  return res;
}

describe('expressInternet402', () => {
  beforeEach(() => {
    mockVerifyPayment.mockReset();
  });

  it('sends 402 when no payment header is present', async () => {
    const middleware = expressInternet402(BASE_OPTIONS);
    const req = makeMockReq();
    const res = makeMockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(402);
    expect(res._headers[PAYMENT_HEADERS.REQUIRED]).toBe('true');
    expect(res._json).toHaveProperty('error', 'Payment Required');
  });

  it('calls next() when payment is valid', async () => {
    mockVerifyPayment.mockResolvedValue({ valid: true });

    const middleware = expressInternet402(BASE_OPTIONS);
    const req = makeMockReq({ [PAYMENT_HEADERS.TX]: 'valid-sig' });
    const res = makeMockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('sends 402 with error when payment verification fails', async () => {
    mockVerifyPayment.mockResolvedValue({ valid: false, error: 'bad tx' });

    const middleware = expressInternet402(BASE_OPTIONS);
    const req = makeMockReq({ [PAYMENT_HEADERS.TX]: 'bad-sig' });
    const res = makeMockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(402);
    expect(res._json).toHaveProperty('error', 'bad tx');
  });

  it('calls next(err) when handler throws', async () => {
    mockVerifyPayment.mockRejectedValue(new Error('unexpected'));

    const middleware = expressInternet402(BASE_OPTIONS);
    const req = makeMockReq({ [PAYMENT_HEADERS.TX]: 'err-sig' });
    const res = makeMockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
