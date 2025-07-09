// Cache service for performance optimization
import NodeCache from 'node-cache';

interface CacheConfig {
  defaultTTL: number;
  checkPeriod: number;
  useClones: boolean;
  maxKeys: number;
}

class CacheService {
  private cache: NodeCache;
  private hitCount: number = 0;
  private missCount: number = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    const defaultConfig: CacheConfig = {
      defaultTTL: 300, // 5 minutes
      checkPeriod: 120, // Check for expired keys every 2 minutes
      useClones: false, // Performance optimization
      maxKeys: 1000, // Maximum number of keys
      ...config
    };

    this.cache = new NodeCache(defaultConfig);

    // Set up event listeners for monitoring
    this.cache.on('set', (key, value) => {
      console.log(`Cache SET: ${key}`);
    });

    this.cache.on('del', (key, value) => {
      console.log(`Cache DEL: ${key}`);
    });

    this.cache.on('expired', (key, value) => {
      console.log(`Cache EXPIRED: ${key}`);
    });
  }

  // Generic cache methods
  set(key: string, value: any, ttl?: number): boolean {
    return this.cache.set(key, value, ttl);
  }

  get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    if (value !== undefined) {
      this.hitCount++;
    } else {
      this.missCount++;
    }
    return value;
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
  }

  // Specialized caching methods for application domains

  // User profile caching
  setUserProfile(userId: string, profile: any, ttl: number = 1800): boolean {
    return this.set(`user:profile:${userId}`, profile, ttl);
  }

  getUserProfile(userId: string): any | undefined {
    return this.get(`user:profile:${userId}`);
  }

  invalidateUserProfile(userId: string): number {
    return this.del(`user:profile:${userId}`);
  }

  // Job analysis caching
  setJobAnalysis(jobHash: string, analysis: any, ttl: number = 3600): boolean {
    return this.set(`job:analysis:${jobHash}`, analysis, ttl);
  }

  getJobAnalysis(jobHash: string): any | undefined {
    return this.get(`job:analysis:${jobHash}`);
  }

  // Template caching
  setTemplates(userId: string, templates: any[], ttl: number = 600): boolean {
    return this.set(`templates:user:${userId}`, templates, ttl);
  }

  getTemplates(userId: string): any[] | undefined {
    return this.get(`templates:user:${userId}`);
  }

  setPublicTemplates(templates: any[], ttl: number = 1800): boolean {
    return this.set('templates:public', templates, ttl);
  }

  getPublicTemplates(): any[] | undefined {
    return this.get('templates:public');
  }

  invalidateTemplates(userId?: string): void {
    if (userId) {
      this.del(`templates:user:${userId}`);
    }
    this.del('templates:public');
  }

  // Application analytics caching
  setUserAnalytics(userId: string, timeRange: string, analytics: any, ttl: number = 300): boolean {
    return this.set(`analytics:${userId}:${timeRange}`, analytics, ttl);
  }

  getUserAnalytics(userId: string, timeRange: string): any | undefined {
    return this.get(`analytics:${userId}:${timeRange}`);
  }

  invalidateUserAnalytics(userId: string): void {
    const patterns = ['7', '30', '90'];
    patterns.forEach(range => {
      this.del(`analytics:${userId}:${range}`);
    });
  }

  // AI response caching
  setAIResponse(promptHash: string, response: any, ttl: number = 1800): boolean {
    return this.set(`ai:response:${promptHash}`, response, ttl);
  }

  getAIResponse(promptHash: string): any | undefined {
    return this.get(`ai:response:${promptHash}`);
  }

  // Smart suggestions caching
  setSmartSuggestions(userId: string, suggestions: any, ttl: number = 3600): boolean {
    return this.set(`suggestions:${userId}`, suggestions, ttl);
  }

  getSmartSuggestions(userId: string): any | undefined {
    return this.get(`suggestions:${userId}`);
  }

  invalidateSmartSuggestions(userId: string): number {
    return this.del(`suggestions:${userId}`);
  }

  // Utility methods for cache management
  getStats(): any {
    const stats = this.cache.getStats();
    return {
      ...stats,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      hitCount: this.hitCount,
      missCount: this.missCount
    };
  }

  getKeys(): string[] {
    return this.cache.keys();
  }

  getTTL(key: string): number | undefined {
    return this.cache.getTtl(key);
  }

  // Cache warming methods
  async warmUserCache(userId: string, userProfile: any): Promise<void> {
    // Warm up frequently accessed user data
    this.setUserProfile(userId, userProfile);
    
    // Pre-cache smart suggestions if profile is complete
    if (this.isProfileComplete(userProfile)) {
      // Could trigger background smart suggestions generation
      console.log(`Warming cache for user ${userId}`);
    }
  }

  private isProfileComplete(profile: any): boolean {
    return profile?.personalInfo?.firstName &&
           profile?.personalInfo?.lastName &&
           profile?.personalInfo?.email &&
           profile?.experience?.length > 0 &&
           profile?.skills?.length > 0;
  }

  // Batch operations
  setMultiple(items: Array<{ key: string; value: any; ttl?: number }>): boolean {
    try {
      items.forEach(item => {
        this.set(item.key, item.value, item.ttl);
      });
      return true;
    } catch (error) {
      console.error('Cache setMultiple error:', error);
      return false;
    }
  }

  getMultiple(keys: string[]): { [key: string]: any } {
    const result: { [key: string]: any } = {};
    keys.forEach(key => {
      const value = this.get(key);
      if (value !== undefined) {
        result[key] = value;
      }
    });
    return result;
  }

  // Cache invalidation patterns
  invalidatePattern(pattern: string): number {
    const keys = this.cache.keys().filter(key => key.includes(pattern));
    return this.cache.del(keys);
  }

  // Memory management
  cleanup(): void {
    const stats = this.getStats();
    console.log('Cache cleanup - Stats before:', stats);
    
    // Remove least recently used items if cache is getting full
    if (stats.keys > 800) { // 80% of maxKeys
      const oldestKeys = this.cache.keys().slice(0, 100); // Remove oldest 100 items
      this.cache.del(oldestKeys);
      console.log(`Cache cleanup: removed ${oldestKeys.length} oldest items`);
    }
  }

  // Health check
  healthCheck(): { status: string; stats: any } {
    try {
      const stats = this.getStats();
      const status = stats.keys < 900 ? 'healthy' : 'warning';
      return { status, stats };
    } catch (error) {
      return { status: 'error', stats: null };
    }
  }
}

// Utility function to create consistent cache keys
export function createCacheKey(...parts: string[]): string {
  return parts.join(':');
}

// Utility function to hash content for cache keys
export function hashContent(content: string): string {
  // Simple hash function for cache keys
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Create and export singleton instance
export const cacheService = new CacheService();
export default cacheService;
