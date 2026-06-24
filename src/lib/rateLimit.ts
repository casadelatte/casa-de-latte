/**
 * In-memory IP-based rate limiter.
 *
 * Stores hit counts in a module-level Map. Resets on server restart.
 * This is intentional — no external Redis dependency required for this scale.
 *
 * Usage:
 *   const result = rateLimit(ip, { limit: 10, windowMs: 10 * 60 * 1000 });
 *   if (!result.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Global store — persists across requests within the same Node.js process.
const store = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  /** Maximum number of requests allowed in the window. */
  limit: number;
  /** Time window in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** How many requests remain in this window. */
  remaining: number;
  /** Unix timestamp (ms) when the window resets. */
  resetAt: number;
}

/**
 * Check and record a request for a given key (typically the caller's IP).
 * Thread-safe for single-process Node.js (event loop is single-threaded).
 */
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const { limit, windowMs } = options;

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // First request or window has expired — start a fresh window.
    const newEntry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
    store.set(key, newEntry);
    return { allowed: true, remaining: limit - 1, resetAt: newEntry.resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Extract the real caller IP from Next.js request headers.
 * Prefers x-forwarded-for (set by Vercel/reverse proxies).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // "x-forwarded-for" can be a comma-separated list; take the first (client) IP.
    return forwarded.split(",")[0].trim();
  }
  // Fallback — real-ip header (some proxies)
  return request.headers.get("x-real-ip") ?? "unknown";
}
