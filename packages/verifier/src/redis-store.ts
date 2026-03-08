import type { ReplayStore } from './replay-store.js';

const KEY_PREFIX = 'internet402:tx:';

interface RedisClient {
  exists(key: string): Promise<number>;
  set(key: string, value: string, secondsToken: 'EX', seconds: number): Promise<unknown>;
}

export class RedisReplayStore implements ReplayStore {
  private client: RedisClient;

  constructor(client: RedisClient) {
    this.client = client;
  }

  async has(signature: string): Promise<boolean> {
    const result = await this.client.exists(`${KEY_PREFIX}${signature}`);
    return result === 1;
  }

  async add(signature: string, expiresAt: number): Promise<void> {
    const ttl = Math.max(1, Math.floor(expiresAt - Date.now() / 1000));
    await this.client.set(`${KEY_PREFIX}${signature}`, '1', 'EX', ttl);
  }
}
