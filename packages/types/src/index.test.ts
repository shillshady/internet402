import { describe, it, expect } from 'vitest';
import {
  parsePaymentHeaders,
  buildPaymentHeaders,
  PAYMENT_HEADERS,
  NETWORKS,
  type PaymentRequirement,
} from './index.js';

describe('parsePaymentHeaders', () => {
  const validHeaders: Record<string, string> = {
    [PAYMENT_HEADERS.ADDRESS]: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
    [PAYMENT_HEADERS.AMOUNT]: '1000000',
    [PAYMENT_HEADERS.TOKEN]: 'SOL',
    [PAYMENT_HEADERS.MEMO]: 'abc-123',
    [PAYMENT_HEADERS.NETWORK]: 'solana-mainnet',
    [PAYMENT_HEADERS.EXPIRES]: '1700000000',
  };

  it('parses valid headers into a PaymentRequirement', () => {
    const result = parsePaymentHeaders(validHeaders);
    expect(result).toEqual({
      address: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
      amount: 1000000,
      token: 'SOL',
      memo: 'abc-123',
      network: 'solana-mainnet',
      expires: 1700000000,
    });
  });

  it('returns null when address is missing', () => {
    const { [PAYMENT_HEADERS.ADDRESS]: _, ...headers } = validHeaders;
    expect(parsePaymentHeaders(headers)).toBeNull();
  });

  it('returns null when amount is missing', () => {
    const { [PAYMENT_HEADERS.AMOUNT]: _, ...headers } = validHeaders;
    expect(parsePaymentHeaders(headers)).toBeNull();
  });

  it('returns null when memo is missing', () => {
    const { [PAYMENT_HEADERS.MEMO]: _, ...headers } = validHeaders;
    expect(parsePaymentHeaders(headers)).toBeNull();
  });

  it('returns null for completely empty headers', () => {
    expect(parsePaymentHeaders({})).toBeNull();
  });

  it('defaults token to SOL when not provided', () => {
    const { [PAYMENT_HEADERS.TOKEN]: _, ...headers } = validHeaders;
    const result = parsePaymentHeaders(headers);
    expect(result?.token).toBe('SOL');
  });

  it('defaults network to mainnet when not provided', () => {
    const { [PAYMENT_HEADERS.NETWORK]: _, ...headers } = validHeaders;
    const result = parsePaymentHeaders(headers);
    expect(result?.network).toBe(NETWORKS.mainnet);
  });

  it('defaults expires to 0 when not provided', () => {
    const { [PAYMENT_HEADERS.EXPIRES]: _, ...headers } = validHeaders;
    const result = parsePaymentHeaders(headers);
    expect(result?.expires).toBe(0);
  });

  it('handles array values by taking the first element', () => {
    const headers: Record<string, string | string[]> = {
      ...validHeaders,
      [PAYMENT_HEADERS.AMOUNT]: ['5000', '9000'],
    };
    const result = parsePaymentHeaders(headers);
    expect(result?.amount).toBe(5000);
  });
});

describe('buildPaymentHeaders', () => {
  it('produces correct header map from a PaymentRequirement', () => {
    const req: PaymentRequirement = {
      address: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
      amount: 500000,
      token: 'SOL',
      memo: 'pay-xyz',
      network: 'solana-mainnet',
      expires: 1700000000,
    };

    const headers = buildPaymentHeaders(req);

    expect(headers).toEqual({
      [PAYMENT_HEADERS.REQUIRED]: 'true',
      [PAYMENT_HEADERS.ADDRESS]: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
      [PAYMENT_HEADERS.AMOUNT]: '500000',
      [PAYMENT_HEADERS.TOKEN]: 'SOL',
      [PAYMENT_HEADERS.MEMO]: 'pay-xyz',
      [PAYMENT_HEADERS.NETWORK]: 'solana-mainnet',
      [PAYMENT_HEADERS.EXPIRES]: '1700000000',
    });
  });

  it('stringifies numeric values', () => {
    const req: PaymentRequirement = {
      address: 'addr',
      amount: 42,
      token: 'USDC',
      memo: 'm',
      network: 'solana-devnet',
      expires: 0,
    };

    const headers = buildPaymentHeaders(req);
    expect(headers[PAYMENT_HEADERS.AMOUNT]).toBe('42');
    expect(headers[PAYMENT_HEADERS.EXPIRES]).toBe('0');
  });
});
