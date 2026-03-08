import { Connection } from '@solana/web3.js';
import { randomUUID } from 'node:crypto';
import {
  type PaymentRequirement,
  type PricingOption,
  buildPaymentHeaders,
  PAYMENT_HEADERS,
  NETWORKS,
} from '@internet402/types';
import { verifyPayment, MemoryReplayStore, type ReplayStore } from '@internet402/verifier';

export interface Internet402Options {
  address: string;
  amount?: number;
  token?: string;
  network?: 'mainnet' | 'devnet';
  expirySeconds?: number;
  rpcUrl: string;
  replayStore?: ReplayStore;
  pricing?: PricingOption[];
}

export interface Internet402Result {
  action: 'pass' | 'reject';
  status?: number;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

export function createInternet402Handler(options: Internet402Options) {
  const connection = new Connection(options.rpcUrl, 'confirmed');
  const replayStore = options.replayStore ?? new MemoryReplayStore();
  const network = NETWORKS[options.network ?? 'mainnet'];
  const expirySeconds = options.expirySeconds ?? 300;

  const defaultPricing: PricingOption[] = options.pricing ?? [
    { token: options.token ?? 'SOL', amount: options.amount ?? 0 },
  ];

  return async function handleRequest(
    getHeader: (name: string) => string | undefined,
  ): Promise<Internet402Result> {
    const txSignature = getHeader(PAYMENT_HEADERS.TX);

    if (txSignature) {
      const primaryPrice = defaultPricing[0];
      const expected: PaymentRequirement = {
        address: options.address,
        amount: primaryPrice.amount,
        token: primaryPrice.token,
        memo: getHeader(PAYMENT_HEADERS.MEMO) ?? '',
        network,
        expires: Math.floor(Date.now() / 1000) + expirySeconds,
      };

      const result = await verifyPayment(connection, txSignature, expected, replayStore);

      if (result.valid) {
        return { action: 'pass' };
      }

      return {
        action: 'reject',
        status: 402,
        body: { error: result.error, message: 'Payment verification failed' },
      };
    }

    const memo = randomUUID();
    const expires = Math.floor(Date.now() / 1000) + expirySeconds;
    const primaryPrice = defaultPricing[0];

    const requirement: PaymentRequirement = {
      address: options.address,
      amount: primaryPrice.amount,
      token: primaryPrice.token,
      memo,
      network,
      expires,
    };

    return {
      action: 'reject',
      status: 402,
      headers: buildPaymentHeaders(requirement),
      body: {
        error: 'Payment Required',
        ...requirement,
        pricing: defaultPricing.length > 1 ? defaultPricing : undefined,
      },
    };
  };
}
