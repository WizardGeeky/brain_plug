interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const cache = new Map<string, RateLimitEntry>();

// Clean expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.resetAt <= now) {
      cache.delete(key);
    }
  }
}, 60000);

export class RateLimiter {
  /**
   * Check and increment rate limit for a specific identifier
   * @param key Unique key (e.g. `login:ip:127.0.0.1` or `chat:apikey:ak_123`)
   * @param maxRequests Maximum allowed requests in window
   * @param windowSeconds Window duration in seconds
   * @returns { allowed: boolean, remaining: number, resetInSeconds: number }
   */
  public static check(
    key: string,
    maxRequests = 60,
    windowSeconds = 60
  ): {
    allowed: boolean;
    remaining: number;
    resetInSeconds: number;
  } {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const entry = cache.get(key);

    if (!entry || entry.resetAt <= now) {
      cache.set(key, { count: 1, resetAt: now + windowMs });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetInSeconds: windowSeconds,
      };
    }

    if (entry.count >= maxRequests) {
      const resetInSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds,
      };
    }

    entry.count += 1;
    const remaining = maxRequests - entry.count;
    const resetInSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));

    return {
      allowed: true,
      remaining,
      resetInSeconds,
    };
  }

  public static reset(key: string): void {
    cache.delete(key);
  }
}
