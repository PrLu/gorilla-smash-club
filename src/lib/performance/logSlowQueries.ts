/**
 * Performance monitoring utility
 * Logs slow database queries and API calls
 */

export interface QueryMetrics {
  queryName: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const SLOW_QUERY_THRESHOLD = 500; // ms

/**
 * Log slow query to console and optionally to monitoring service
 */
export function logSlowQuery(metrics: QueryMetrics) {
  if (metrics.duration > SLOW_QUERY_THRESHOLD) {
    console.warn('🐌 Slow query detected:', {
      query: metrics.queryName,
      duration: `${metrics.duration}ms`,
      threshold: `${SLOW_QUERY_THRESHOLD}ms`,
      timestamp: metrics.timestamp.toISOString(),
      ...metrics.metadata,
    });

    // TODO: Send to monitoring service (Sentry, DataDog, etc.)
    // Example:
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureMessage('Slow query', {
    //     level: 'warning',
    //     extra: metrics,
    //   });
    // }
  }
}

/**
 * Measure query execution time
 */
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;

    logSlowQuery({
      queryName,
      duration,
      timestamp: new Date(),
      metadata,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('❌ Query failed:', {
      query: queryName,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Performance metrics collector
 */
export class PerformanceMonitor {
  private metrics: QueryMetrics[] = [];

  record(queryName: string, duration: number, metadata?: Record<string, any>) {
    const metric: QueryMetrics = {
      queryName,
      duration,
      timestamp: new Date(),
      metadata,
    };

    this.metrics.push(metric);
    logSlowQuery(metric);

    // Keep only last 100 metrics in memory
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  getSlowQueries(): QueryMetrics[] {
    return this.metrics.filter((m) => m.duration > SLOW_QUERY_THRESHOLD);
  }

  getAverageDuration(queryName: string): number {
    const matching = this.metrics.filter((m) => m.queryName === queryName);
    if (matching.length === 0) return 0;

    const total = matching.reduce((sum, m) => sum + m.duration, 0);
    return Math.round(total / matching.length);
  }

  clear() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

