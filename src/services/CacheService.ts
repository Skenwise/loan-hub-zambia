/**
 * Cache Service
 * Handles caching of frequently accessed data with TTL support
 * Phase 2A: Performance Optimization
 */

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  itemsInCache: number;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

/**
 * In-memory cache service
 * Note: For production, consider using Redis or similar
 */
export class CacheService {
  // Cache configuration
  static readonly DEFAULT_TTL = 300; // 5 minutes
  static readonly REFERENCE_DATA_TTL = 3600; // 1 hour
  static readonly CACHE_PREFIX = 'app:';

  // Cache storage
  private static cache = new Map<string, CacheEntry<any>>();

  // Metrics
  private static metrics = {
    hits: 0,
    misses: 0,
  };

  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Cached value or null if not found or expired
   */
  static async get<T>(key: string): Promise<T | null> {
    const fullKey = this.CACHE_PREFIX + key;
    const entry = this.cache.get(fullKey);

    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(fullKey);
      this.metrics.misses++;
      return null;
    }

    this.metrics.hits++;
    return entry.value as T;
  }

  /**
   * Set value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (default: 5 minutes)
   */
  static async set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const fullKey = this.CACHE_PREFIX + key;
    const expiresAt = Date.now() + (ttl * 1000);

    this.cache.set(fullKey, {
      value,
      expiresAt,
      createdAt: Date.now(),
    });

    console.log(`[Cache] Set: ${fullKey} (TTL: ${ttl}s)`);
  }

  /**
   * Delete value from cache
   * @param key - Cache key
   */
  static async delete(key: string): Promise<void> {
    const fullKey = this.CACHE_PREFIX + key;
    this.cache.delete(fullKey);
    console.log(`[Cache] Deleted: ${fullKey}`);
  }

  /**
   * Clear all cache
   */
  static async clear(): Promise<void> {
    this.cache.clear();
    console.log('[Cache] Cleared all cache');
  }

  /**
   * Get cache metrics
   */
  static async getMetrics(): Promise<CacheMetrics> {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0;

    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      totalRequests,
      itemsInCache: this.cache.size,
    };
  }

  /**
   * Reset metrics
   */
  static async resetMetrics(): Promise<void> {
    this.metrics = {
      hits: 0,
      misses: 0,
    };
    console.log('[Cache] Metrics reset');
  }

  // ============================================
  // Organization-Scoped Caching
  // ============================================

  /**
   * Get organization-scoped value from cache
   * @param orgId - Organization ID
   * @param key - Cache key
   */
  static async getOrgScoped<T>(orgId: string, key: string): Promise<T | null> {
    const scopedKey = `org:${orgId}:${key}`;
    return this.get<T>(scopedKey);
  }

  /**
   * Set organization-scoped value in cache
   * @param orgId - Organization ID
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds
   */
  static async setOrgScoped<T>(
    orgId: string,
    key: string,
    value: T,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    const scopedKey = `org:${orgId}:${key}`;
    return this.set<T>(scopedKey, value, ttl);
  }

  /**
   * Delete organization-scoped value from cache
   * @param orgId - Organization ID
   * @param key - Cache key
   */
  static async deleteOrgScoped(orgId: string, key: string): Promise<void> {
    const scopedKey = `org:${orgId}:${key}`;
    return this.delete(scopedKey);
  }

  /**
   * Invalidate all cache for an organization
   * @param orgId - Organization ID
   */
  static async invalidateOrgCache(orgId: string): Promise<void> {
    const prefix = this.CACHE_PREFIX + `org:${orgId}:`;
    let count = 0;

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }

    console.log(`[Cache] Invalidated ${count} items for org: ${orgId}`);
  }

  // ============================================
  // Convenience Methods
  // ============================================

  /**
   * Get or set value in cache
   * @param key - Cache key
   * @param fetchFn - Function to fetch value if not in cache
   * @param ttl - Time to live in seconds
   */
  static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const value = await fetchFn();
    await this.set<T>(key, value, ttl);
    return value;
  }

  /**
   * Get or set organization-scoped value in cache
   * @param orgId - Organization ID
   * @param key - Cache key
   * @param fetchFn - Function to fetch value if not in cache
   * @param ttl - Time to live in seconds
   */
  static async getOrSetOrgScoped<T>(
    orgId: string,
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const scopedKey = `org:${orgId}:${key}`;
    return this.getOrSet<T>(scopedKey, fetchFn, ttl);
  }

  /**
   * Invalidate cache by pattern
   * @param pattern - Pattern to match (supports wildcards)
   */
  static async invalidateByPattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    console.log(`[Cache] Invalidated ${count} items matching pattern: ${pattern}`);
  }

  /**
   * Get cache size in bytes (approximate)
   */
  static async getCacheSize(): Promise<number> {
    let size = 0;

    for (const [key, entry] of this.cache.entries()) {
      size += key.length;
      size += JSON.stringify(entry.value).length;
    }

    return size;
  }

  /**
   * Clean up expired entries
   */
  static async cleanup(): Promise<void> {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        count++;
      }
    }

    console.log(`[Cache] Cleaned up ${count} expired entries`);
  }

  /**
   * Get cache info
   */
  static async getInfo(): Promise<{
    size: number;
    itemCount: number;
    metrics: CacheMetrics;
  }> {
    return {
      size: await this.getCacheSize(),
      itemCount: this.cache.size,
      metrics: await this.getMetrics(),
    };
  }
}
