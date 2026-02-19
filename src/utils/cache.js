export class TTLCache {
  constructor(defaultTtlMs = 180_000) {
    this.defaultTtlMs = defaultTtlMs;
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
    return value;
  }

  async getOrSet(key, producer, ttlMs = this.defaultTtlMs) {
    const cached = this.get(key);
    if (cached !== null) return cached;

    const pending = producer();
    this.set(key, pending, ttlMs);
    try {
      const resolved = await pending;
      this.set(key, resolved, ttlMs);
      return resolved;
    } catch (error) {
      this.store.delete(key);
      throw error;
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.expiresAt < now) this.store.delete(key);
    }
  }
}
