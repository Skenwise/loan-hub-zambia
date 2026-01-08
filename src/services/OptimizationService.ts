/**
 * Optimization Service (Phase 2D)
 * Provides performance optimization, caching strategies,
 * and query optimization for the application
 */

import { BaseCrudService } from './BaseCrudService';
import { CacheService } from './CacheService';

interface WixDataItem {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
}

export interface PerformanceMetrics {
  queryTime: number;
  cacheHit: boolean;
  itemsProcessed: number;
  timestamp: Date;
}

export interface OptimizationStrategy {
  name: string;
  enabled: boolean;
  cacheExpiry: number; // in seconds
  batchSize: number;
  priority: 'low' | 'medium' | 'high';
}

class OptimizationService {
  private static performanceMetrics: PerformanceMetrics[] = [];
  private static strategies: Map<string, OptimizationStrategy> = new Map();

  /**
   * Initialize optimization strategies
   */
  static initializeStrategies(): void {
    this.strategies.set('loans', {
      name: 'Loan Optimization',
      enabled: true,
      cacheExpiry: 300, // 5 minutes
      batchSize: 100,
      priority: 'high',
    });

    this.strategies.set('customers', {
      name: 'Customer Optimization',
      enabled: true,
      cacheExpiry: 600, // 10 minutes
      batchSize: 50,
      priority: 'high',
    });

    this.strategies.set('repayments', {
      name: 'Repayment Optimization',
      enabled: true,
      cacheExpiry: 300,
      batchSize: 100,
      priority: 'medium',
    });

    this.strategies.set('reports', {
      name: 'Report Optimization',
      enabled: true,
      cacheExpiry: 1800, // 30 minutes
      batchSize: 500,
      priority: 'medium',
    });
  }

  /**
   * Get optimized data with caching
   */
  static async getOptimizedData<T extends WixDataItem>(
    collectionId: string,
    organisationId: string,
    filter?: (item: T) => boolean
  ): Promise<{ items: T[]; metrics: PerformanceMetrics }> {
    const startTime = performance.now();
    const cacheKey = `${collectionId}:${organisationId}`;
    let cacheHit = false;

    try {
      // Try to get from cache first
      const cachedData = await CacheService.get<T[]>(cacheKey);
      if (cachedData) {
        cacheHit = true;
        const items = filter ? cachedData.filter(filter) : cachedData;
        const endTime = performance.now();

        const metrics: PerformanceMetrics = {
          queryTime: endTime - startTime,
          cacheHit: true,
          itemsProcessed: items.length,
          timestamp: new Date(),
        };

        this.recordMetrics(metrics);
        return { items, metrics };
      }

      // Fetch from database
      const { items: allItems } = await BaseCrudService.getAll<T>(collectionId);
      const filtered = allItems.filter((item: any) => item.organisationId === organisationId);
      const items = filter ? filtered.filter(filter) : filtered;

      // Cache the results
      const strategy = this.strategies.get(collectionId);
      if (strategy?.enabled) {
        await CacheService.set(cacheKey, filtered, strategy.cacheExpiry);
      }

      const endTime = performance.now();

      const metrics: PerformanceMetrics = {
        queryTime: endTime - startTime,
        cacheHit: false,
        itemsProcessed: items.length,
        timestamp: new Date(),
      };

      this.recordMetrics(metrics);
      return { items, metrics };
    } catch (error) {
      console.error('Error getting optimized data:', error);
      throw error;
    }
  }

  /**
   * Batch process items for better performance
   */
  static async batchProcess<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    collectionId: string
  ): Promise<R[]> {
    const strategy = this.strategies.get(collectionId);
    const batchSize = strategy?.batchSize || 100;
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Prefetch related data
   */
  static async prefetchRelatedData(
    collectionId: string,
    organisationId: string,
    relatedCollections: string[]
  ): Promise<void> {
    try {
      const promises = relatedCollections.map(collection =>
        this.getOptimizedData(collection, organisationId)
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error prefetching related data:', error);
    }
  }

  /**
   * Clear cache for a collection
   */
  static async clearCache(collectionId: string, organisationId?: string): Promise<void> {
    if (organisationId) {
      const cacheKey = `${collectionId}:${organisationId}`;
      await CacheService.delete(cacheKey);
    } else {
      // Clear all caches for this collection
      await CacheService.invalidateByPattern(`${collectionId}:*`);
    }
  }

  /**
   * Record performance metrics
   */
  private static recordMetrics(metrics: PerformanceMetrics): void {
    this.performanceMetrics.push(metrics);

    // Keep only last 1000 metrics
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  /**
   * Get performance report
   */
  static getPerformanceReport(): {
    averageQueryTime: number;
    cacheHitRate: number;
    totalQueries: number;
    metrics: PerformanceMetrics[];
  } {
    const totalQueries = this.performanceMetrics.length;
    const cacheHits = this.performanceMetrics.filter(m => m.cacheHit).length;
    const averageQueryTime =
      this.performanceMetrics.reduce((sum, m) => sum + m.queryTime, 0) / totalQueries || 0;

    return {
      averageQueryTime,
      cacheHitRate: totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0,
      totalQueries,
      metrics: this.performanceMetrics.slice(-100), // Last 100 metrics
    };
  }

  /**
   * Optimize query by using indexes
   */
  static createIndex(collectionId: string, fields: string[]): void {
    // This would be implemented in the backend
    console.log(`Creating index on ${collectionId} for fields: ${fields.join(', ')}`);
  }

  /**
   * Analyze query performance
   */
  static analyzeQueryPerformance(
    collectionId: string,
    durationMs: number
  ): { status: 'good' | 'warning' | 'critical'; recommendation: string } {
    let status: 'good' | 'warning' | 'critical' = 'good';
    let recommendation = 'Query performance is optimal';

    if (durationMs > 5000) {
      status = 'critical';
      recommendation = 'Query is taking too long. Consider adding indexes or optimizing filters.';
    } else if (durationMs > 1000) {
      status = 'warning';
      recommendation = 'Query performance could be improved. Consider caching or pagination.';
    }

    return { status, recommendation };
  }

  /**
   * Get optimization recommendations
   */
  static getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const report = this.getPerformanceReport();

    if (report.cacheHitRate < 50) {
      recommendations.push('Cache hit rate is low. Consider increasing cache expiry times.');
    }

    if (report.averageQueryTime > 1000) {
      recommendations.push('Average query time is high. Consider implementing pagination or indexes.');
    }

    const strategies = Array.from(this.strategies.values());
    const disabledStrategies = strategies.filter(s => !s.enabled);
    if (disabledStrategies.length > 0) {
      recommendations.push(
        `${disabledStrategies.length} optimization strategies are disabled. Enable them for better performance.`
      );
    }

    return recommendations;
  }

  /**
   * Enable/disable optimization strategy
   */
  static setStrategyEnabled(collectionId: string, enabled: boolean): void {
    const strategy = this.strategies.get(collectionId);
    if (strategy) {
      strategy.enabled = enabled;
    }
  }

  /**
   * Update strategy configuration
   */
  static updateStrategy(collectionId: string, updates: Partial<OptimizationStrategy>): void {
    const strategy = this.strategies.get(collectionId);
    if (strategy) {
      Object.assign(strategy, updates);
    }
  }

  /**
   * Get all strategies
   */
  static getStrategies(): OptimizationStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Lazy load data
   */
  static async lazyLoadData<T extends WixDataItem>(
    collectionId: string,
    organisationId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ items: T[]; total: number; hasMore: boolean }> {
    try {
      const { items, metrics } = await this.getOptimizedData<T>(
        collectionId,
        organisationId
      );

      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedItems = items.slice(start, end);

      return {
        items: paginatedItems,
        total: items.length,
        hasMore: end < items.length,
      };
    } catch (error) {
      console.error('Error lazy loading data:', error);
      throw error;
    }
  }
}

// Initialize strategies on module load
OptimizationService.initializeStrategies();

export default OptimizationService;
