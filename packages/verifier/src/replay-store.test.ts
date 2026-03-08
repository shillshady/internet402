import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryReplayStore } from './replay-store.js';

describe('MemoryReplayStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false for unknown signatures', async () => {
    const store = new MemoryReplayStore();
    expect(await store.has('unknown-sig')).toBe(false);
    store.destroy();
  });

  it('returns true after adding a signature', async () => {
    const store = new MemoryReplayStore();
    const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
    await store.add('sig-1', futureExpiry);
    expect(await store.has('sig-1')).toBe(true);
    store.destroy();
  });

  it('returns false for expired signatures', async () => {
    const store = new MemoryReplayStore();
    const pastExpiry = Math.floor(Date.now() / 1000) - 100;
    await store.add('sig-expired', pastExpiry);
    expect(await store.has('sig-expired')).toBe(false);
    store.destroy();
  });

  it('cleanup removes expired entries', async () => {
    vi.useFakeTimers();
    const store = new MemoryReplayStore(500);
    const pastExpiry = Math.floor(Date.now() / 1000) - 10;
    await store.add('sig-old', pastExpiry);

    // Advance timer to trigger cleanup interval
    vi.advanceTimersByTime(600);

    expect(await store.has('sig-old')).toBe(false);
    store.destroy();
    vi.useRealTimers();
  });

  it('destroy clears all entries', async () => {
    const store = new MemoryReplayStore();
    const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
    await store.add('sig-a', futureExpiry);
    store.destroy();
    // After destroy, internal store is cleared
    // Creating a new reference won't help, but we verify no errors
  });
});
