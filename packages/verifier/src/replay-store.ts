export interface ReplayStore {
  has(signature: string): Promise<boolean>;
  add(signature: string, expiresAt: number): Promise<void>;
}

export class MemoryReplayStore implements ReplayStore {
  private store = new Map<string, number>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(cleanupIntervalMs = 60_000) {
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
    if (this.cleanupInterval.unref) this.cleanupInterval.unref();
  }

  async has(signature: string): Promise<boolean> {
    const expiresAt = this.store.get(signature);
    if (expiresAt === undefined) return false;
    if (Date.now() / 1000 > expiresAt) {
      this.store.delete(signature);
      return false;
    }
    return true;
  }

  async add(signature: string, expiresAt: number): Promise<void> {
    this.store.set(signature, expiresAt);
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now() / 1000;
    for (const [sig, exp] of this.store) {
      if (now > exp) this.store.delete(sig);
    }
  }
}
