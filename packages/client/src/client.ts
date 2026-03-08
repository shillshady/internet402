import { Connection, Keypair } from '@solana/web3.js';
import { PAYMENT_HEADERS, parsePaymentHeaders } from '@internet402/types';
import { paySol } from './pay-sol.js';
import { paySpl } from './pay-spl.js';

export interface Agent402ClientOptions {
  keypair: Keypair;
  rpcUrl: string;
  maxRetries?: number;
}

export class Agent402Client {
  private connection: Connection;
  private keypair: Keypair;
  private maxRetries: number;

  constructor(options: Agent402ClientOptions) {
    this.connection = new Connection(options.rpcUrl, 'confirmed');
    this.keypair = options.keypair;
    this.maxRetries = options.maxRetries ?? 1;
  }

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const response = await globalThis.fetch(url, init);

    if (response.status !== 402) return response;

    const headerObj: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headerObj[key.toLowerCase()] = value;
    });

    const requirement = parsePaymentHeaders(headerObj);
    if (!requirement) {
      throw new Error('Received 402 but payment headers are missing or malformed');
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        let txSignature: string;

        if (requirement.token === 'SOL') {
          txSignature = await paySol(
            this.connection,
            this.keypair,
            requirement.address,
            requirement.amount,
            requirement.memo,
          );
        } else {
          txSignature = await paySpl(
            this.connection,
            this.keypair,
            requirement.address,
            requirement.amount,
            requirement.token,
            requirement.memo,
          );
        }

        const retryHeaders = new Headers(init?.headers);
        retryHeaders.set(PAYMENT_HEADERS.TX, txSignature);

        return await globalThis.fetch(url, { ...init, headers: retryHeaders });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw new Error(`Payment failed after ${this.maxRetries} attempts: ${lastError?.message}`);
  }
}
