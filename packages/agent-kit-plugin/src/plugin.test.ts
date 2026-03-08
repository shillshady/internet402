import { describe, it, expect, vi } from 'vitest';
import { Keypair } from '@solana/web3.js';

// Mock the client to avoid real connections
const mockClientFetch = vi.fn().mockResolvedValue(new Response('ok'));

vi.mock('@internet402/client', () => {
  return {
    Agent402Client: class MockAgent402Client {
      fetch = mockClientFetch;
      opts: any;
      constructor(opts: any) {
        this.opts = opts;
      }
    },
  };
});

import { withInternet402, type AgentKitLike } from './plugin.js';

describe('withInternet402', () => {
  it('adds internet402Client to the agent', () => {
    const agent: AgentKitLike = {
      wallet: Keypair.generate(),
      connection: { rpcEndpoint: 'https://fake-rpc.test' },
    };

    const enhanced = withInternet402(agent);

    expect(enhanced.internet402Client).toBeDefined();
    expect((enhanced.internet402Client as any).opts).toEqual({
      keypair: agent.wallet,
      rpcUrl: 'https://fake-rpc.test',
      maxRetries: undefined,
    });
  });

  it('adds a fetch method that delegates to the client', async () => {
    const agent: AgentKitLike = {
      wallet: Keypair.generate(),
      connection: { rpcEndpoint: 'https://fake-rpc.test' },
    };

    const enhanced = withInternet402(agent);
    const response = await (enhanced as any).fetch('https://example.com/api');

    expect(response).toBeDefined();
    expect(mockClientFetch).toHaveBeenCalledWith(
      'https://example.com/api',
      undefined,
    );
  });

  it('passes maxRetries option through', () => {
    const agent: AgentKitLike = {
      wallet: Keypair.generate(),
      connection: { rpcEndpoint: 'https://fake-rpc.test' },
    };

    const enhanced = withInternet402(agent, { maxRetries: 3 });
    expect((enhanced.internet402Client as any).opts.maxRetries).toBe(3);
  });

  it('preserves existing agent properties', () => {
    const agent = {
      wallet: Keypair.generate(),
      connection: { rpcEndpoint: 'https://fake-rpc.test' },
      customProp: 'hello',
    };

    const enhanced = withInternet402(agent);
    expect(enhanced.customProp).toBe('hello');
    expect(enhanced.wallet).toBe(agent.wallet);
  });
});
