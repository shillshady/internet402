export const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

export const PAYMENT_HEADERS = {
  REQUIRED: 'x-payment-required',
  ADDRESS: 'x-payment-address',
  AMOUNT: 'x-payment-amount',
  TOKEN: 'x-payment-token',
  MEMO: 'x-payment-memo',
  NETWORK: 'x-payment-network',
  EXPIRES: 'x-payment-expires',
  TX: 'x-payment-tx',
} as const;

export const NETWORKS = {
  mainnet: 'solana-mainnet',
  devnet: 'solana-devnet',
} as const;

export interface PaymentRequirement {
  address: string;
  amount: number;
  token: string;
  memo: string;
  network: string;
  expires: number;
}

export interface PaymentProof {
  txSignature: string;
}

export interface VerificationResult {
  valid: boolean;
  error?: string;
}

export interface PricingOption {
  token: string;
  amount: number;
}

export function parsePaymentHeaders(
  headers: Record<string, string | string[] | undefined>,
): PaymentRequirement | null {
  const get = (key: string): string | undefined => {
    const val = headers[key];
    return Array.isArray(val) ? val[0] : val;
  };

  const address = get(PAYMENT_HEADERS.ADDRESS);
  const amount = get(PAYMENT_HEADERS.AMOUNT);
  const token = get(PAYMENT_HEADERS.TOKEN);
  const memo = get(PAYMENT_HEADERS.MEMO);
  const network = get(PAYMENT_HEADERS.NETWORK);
  const expires = get(PAYMENT_HEADERS.EXPIRES);

  if (!address || !amount || !memo) return null;

  return {
    address,
    amount: Number(amount),
    token: token ?? 'SOL',
    memo,
    network: network ?? NETWORKS.mainnet,
    expires: expires ? Number(expires) : 0,
  };
}

export function buildPaymentHeaders(req: PaymentRequirement): Record<string, string> {
  return {
    [PAYMENT_HEADERS.REQUIRED]: 'true',
    [PAYMENT_HEADERS.ADDRESS]: req.address,
    [PAYMENT_HEADERS.AMOUNT]: String(req.amount),
    [PAYMENT_HEADERS.TOKEN]: req.token,
    [PAYMENT_HEADERS.MEMO]: req.memo,
    [PAYMENT_HEADERS.NETWORK]: req.network,
    [PAYMENT_HEADERS.EXPIRES]: String(req.expires),
  };
}
