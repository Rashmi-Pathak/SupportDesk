/**
 * ============================================================================
 * SUPPORTDESK CRM — CACHE MANAGER
 * Wraps Google CacheService with JSON serialisation and TTL.
 * Handles the 100 KB per-key limit gracefully.
 * ============================================================================
 */
const CacheManager = {
  /**
   * Get cached data or execute `fetchFn` and cache the result.
   */
  getOrSet: function (key, ttlSeconds, fetchFn) {
    const cache = CacheService.getScriptCache();
    const raw = cache.get(key);

    if (raw) {
      try { return JSON.parse(raw); }
      catch (_) { /* corrupted — refetch */ }
    }

    const data = fetchFn();
    if (data !== undefined && data !== null) {
      try {
        const serialised = JSON.stringify(data);
        // CacheService limit is 100 KB per key
        if (serialised.length < 100000) {
          cache.put(key, serialised, ttlSeconds);
        }
      } catch (e) {
        Logger.log('[CacheManager] Failed to cache ' + key + ': ' + e.message);
      }
    }
    return data;
  },

  /**
   * Invalidate a single key.
   */
  clear: function (key) {
    CacheService.getScriptCache().remove(key);
  },

  /**
   * Invalidate multiple keys at once.
   */
  clearMany: function (keys) {
    const cache = CacheService.getScriptCache();
    keys.forEach(function (k) { cache.remove(k); });
  }
};
