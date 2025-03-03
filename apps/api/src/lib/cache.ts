// Simple in-memory cache implementation
import { logger } from "@repo/logger";

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

class Cache {
  private store: Map<string, CacheItem<any>> = new Map();
  
  /**
   * Set a value in the cache with an expiration time
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
    logger.debug(`Cache: Set key "${key}" with TTL ${ttlMs}ms`);
  }
  
  /**
   * Get a value from the cache if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const item = this.store.get(key);
    
    // Return null if item doesn't exist
    if (!item) {
      logger.debug(`Cache: Miss for key "${key}"`);
      return null;
    }
    
    // Check if the item has expired
    if (Date.now() > item.expiresAt) {
      // Cleanup expired item
      this.store.delete(key);
      logger.debug(`Cache: Expired key "${key}"`);
      return null;
    }
    
    logger.debug(`Cache: Hit for key "${key}"`);
    return item.value;
  }
  
  /**
   * Remove a specific item from the cache
   */
  delete(key: string): boolean {
    const result = this.store.delete(key);
    if (result) {
      logger.debug(`Cache: Deleted key "${key}"`);
    }
    return result;
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.store.clear();
    logger.debug("Cache: Cleared all items");
  }
  
  /**
   * Get the number of items in the cache
   */
  get size(): number {
    return this.store.size;
  }
  
  /**
   * Cleanup all expired items from the cache
   */
  cleanup(): number {
    const now = Date.now();
    let count = 0;
    
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      logger.debug(`Cache: Cleaned up ${count} expired items`);
    }
    
    return count;
  }
}

// Export a singleton instance
export const cache = new Cache(); 