import { Keypair } from '@solana/web3.js';
import { Agent402Client, type Agent402ClientOptions } from '@internet402/client';

export interface AgentKitLike {
  wallet: Keypair;
  connection: { rpcEndpoint: string };
}

export interface WithInternet402Options {
  maxRetries?: number;
}

export function withInternet402<T extends AgentKitLike>(
  agent: T,
  options?: WithInternet402Options,
): T & { internet402Client: Agent402Client } {
  const clientOptions: Agent402ClientOptions = {
    keypair: agent.wallet,
    rpcUrl: agent.connection.rpcEndpoint,
    maxRetries: options?.maxRetries,
  };

  const client = new Agent402Client(clientOptions);

  return Object.assign(agent, {
    internet402Client: client,
    fetch: (url: string, init?: RequestInit) => client.fetch(url, init),
  });
}
