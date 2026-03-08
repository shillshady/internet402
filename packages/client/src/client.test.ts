import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Keypair } from '@solana/web3.js';
import { PAYMENT_HEADERS } from '@internet402/types';

// Mock pay-sol and pay-spl before importing client
vi.mock('./pay-sol.js', () => ({
  paySol: vi.fn().mockResolvedValue('mock-sol-tx-sig'),
}));

vi.mock('./pay-spl.js', () => ({
  paySpl: vi.fn().mockResolvedValue('mock-spl-tx-sig'),
}));

import { Agent402Client } from './client.js';
import { paySol } from './pay-sol.js';
import { paySpl } from './pay-spl.js';

const keypair = Keypair.generate();

function make402Response(token = 'SOL') {
  const headers = new Headers({
    [PAYMENT_HEADERS.ADDRESS]: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
    [PAYMENT_HEADERS.AMOUNT]: '1000000',
    [PAYMENT_HEADERS.TOKEN]: token,
    [PAYMENT_HEADERS.MEMO]: 'pay-123',
    [PAYMENT_HEADERS.NETWORK]: 'solana-mainnet',
    [PAYMENT_HEADERS.EXPIRES]: '1700000000',
  });
  return new Response('Payment Required', { status: 402, headers });
}

function make200Response(body = 'OK') {
  return new Response(body, { status: 200 });
}

describe('Agent402Client', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    vi.mocked(paySol).mockClear();
    vi.mocked(paySpl).mockClear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('passes through non-402 responses unchanged', async () => {
    const mockFetch = vi.fn().mockResolvedValue(make200Response('hello'));
    globalThis.fetch = mockFetch;

    const client = new Agent402Client({ keypair, rpcUrl: 'https://fake-rpc.test' });
    const response = await client.fetch('https://example.com/api');

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('hello');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(paySol).not.toHaveBeenCalled();
  });

  it('handles 402 by paying SOL and retrying', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(make402Response('SOL'))
      .mockResolvedValueOnce(make200Response('paid-content'));
    globalThis.fetch = mockFetch;

    const client = new Agent402Client({ keypair, rpcUrl: 'https://fake-rpc.test' });
    const response = await client.fetch('https://example.com/api');

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('paid-content');
    expect(paySol).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Verify the retry includes the tx header
    const retryCall = mockFetch.mock.calls[1];
    const retryHeaders = new Headers(retryCall[1]?.headers);
    expect(retryHeaders.get(PAYMENT_HEADERS.TX)).toBe('mock-sol-tx-sig');
  });

  it('handles 402 by paying SPL when token is not SOL', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(make402Response('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'))
      .mockResolvedValueOnce(make200Response('spl-content'));
    globalThis.fetch = mockFetch;

    const client = new Agent402Client({ keypair, rpcUrl: 'https://fake-rpc.test' });
    const response = await client.fetch('https://example.com/api');

    expect(response.status).toBe(200);
    expect(paySpl).toHaveBeenCalledOnce();
  });

  it('throws when 402 headers are malformed (missing required fields)', async () => {
    const badHeaders = new Headers({ 'x-payment-address': 'addr' });
    const badResponse = new Response('Payment Required', { status: 402, headers: badHeaders });
    globalThis.fetch = vi.fn().mockResolvedValue(badResponse);

    const client = new Agent402Client({ keypair, rpcUrl: 'https://fake-rpc.test' });
    await expect(client.fetch('https://example.com/api')).rejects.toThrow(
      'payment headers are missing or malformed',
    );
  });

  it('throws after maxRetries when payment keeps failing', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(make402Response('SOL'));
    vi.mocked(paySol).mockRejectedValue(new Error('insufficient funds'));

    const client = new Agent402Client({ keypair, rpcUrl: 'https://fake-rpc.test', maxRetries: 2 });
    await expect(client.fetch('https://example.com/api')).rejects.toThrow(
      'Payment failed after 2 attempts',
    );
    expect(paySol).toHaveBeenCalledTimes(2);
  });
});
