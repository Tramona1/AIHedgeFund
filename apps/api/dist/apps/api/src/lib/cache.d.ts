declare class Cache {
    private store;
    /**
     * Set a value in the cache with an expiration time
     */
    set<T>(key: string, value: T, ttlMs: number): void;
    /**
     * Get a value from the cache if it exists and hasn't expired
     */
    get<T>(key: string): T | null;
    /**
     * Remove a specific item from the cache
     */
    delete(key: string): boolean;
    /**
     * Clear all items from the cache
     */
    clear(): void;
    /**
     * Get the number of items in the cache
     */
    get size(): number;
    /**
     * Cleanup all expired items from the cache
     */
    cleanup(): number;
}
export declare const cache: Cache;
export {};
