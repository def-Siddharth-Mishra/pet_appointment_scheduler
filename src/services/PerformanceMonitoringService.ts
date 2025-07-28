interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  totalOperations: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
  errorCount: number;
  lastError?: string;
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private activeTimers: Map<string, PerformanceMetric> = new Map();
  private readonly MAX_METRICS_PER_TYPE = 100;

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  // Start timing an operation
  startTimer(operationName: string, metadata?: Record<string, any>): string {
    const timerId = `${operationName}_${Date.now()}_${Math.random()}`;
    const metric: PerformanceMetric = {
      name: operationName,
      startTime: performance.now(),
      metadata,
    };

    this.activeTimers.set(timerId, metric);
    return timerId;
  }

  // End timing an operation
  endTimer(timerId: string): number | null {
    const metric = this.activeTimers.get(timerId);
    if (!metric) {
      console.warn(`Timer ${timerId} not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    this.activeTimers.delete(timerId);
    this.recordMetric(metric);

    return metric.duration;
  }

  // Record a completed metric
  private recordMetric(metric: PerformanceMetric): void {
    if (!metric.duration) return;

    const operationName = metric.name;
    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, []);
    }

    const operationMetrics = this.metrics.get(operationName)!;
    operationMetrics.push(metric);

    // Keep only the most recent metrics to prevent memory leaks
    if (operationMetrics.length > this.MAX_METRICS_PER_TYPE) {
      operationMetrics.shift();
    }
  }

  // Record an error for an operation
  recordError(operationName: string, error: string | Error): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const metric: PerformanceMetric = {
      name: `${operationName}_error`,
      startTime: performance.now(),
      endTime: performance.now(),
      duration: 0,
      metadata: { error: errorMessage },
    };

    this.recordMetric(metric);
  }

  // Get performance statistics for an operation
  getStats(operationName: string): PerformanceStats | null {
    const metrics = this.metrics.get(operationName);
    const errorMetrics = this.metrics.get(`${operationName}_error`);

    if (!metrics || metrics.length === 0) {
      return null;
    }

    const durations = metrics
      .filter(m => m.duration !== undefined)
      .map(m => m.duration!)
      .sort((a, b) => a - b);

    if (durations.length === 0) {
      return null;
    }

    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    const p95Index = Math.floor(durations.length * 0.95);

    return {
      totalOperations: durations.length,
      averageDuration: totalDuration / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p95Duration: durations[p95Index] || durations[durations.length - 1],
      errorCount: errorMetrics?.length || 0,
      lastError: errorMetrics?.[errorMetrics.length - 1]?.metadata?.error,
    };
  }

  // Get all available operation names
  getOperationNames(): string[] {
    return Array.from(this.metrics.keys()).filter(name => !name.endsWith('_error'));
  }

  // Get comprehensive performance report
  getPerformanceReport(): Record<string, PerformanceStats> {
    const report: Record<string, PerformanceStats> = {};
    
    this.getOperationNames().forEach(operationName => {
      const stats = this.getStats(operationName);
      if (stats) {
        report[operationName] = stats;
      }
    });

    return report;
  }

  // Clear all metrics (useful for testing or memory management)
  clearMetrics(): void {
    this.metrics.clear();
    this.activeTimers.clear();
  }

  // Log performance warnings for slow operations
  checkPerformanceThresholds(): void {
    const report = this.getPerformanceReport();
    
    Object.entries(report).forEach(([operationName, stats]) => {
      // Warn if average duration is over 1 second
      if (stats.averageDuration > 1000) {
        console.warn(
          `Performance Warning: ${operationName} average duration is ${stats.averageDuration.toFixed(2)}ms`
        );
      }

      // Warn if P95 is over 2 seconds
      if (stats.p95Duration > 2000) {
        console.warn(
          `Performance Warning: ${operationName} P95 duration is ${stats.p95Duration.toFixed(2)}ms`
        );
      }

      // Warn if error rate is over 5%
      const errorRate = stats.errorCount / stats.totalOperations;
      if (errorRate > 0.05) {
        console.warn(
          `Performance Warning: ${operationName} error rate is ${(errorRate * 100).toFixed(1)}%`
        );
      }
    });
  }

  // Measure and record a function execution
  async measureAsync<T>(
    operationName: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const timerId = this.startTimer(operationName, metadata);
    
    try {
      const result = await fn();
      this.endTimer(timerId);
      return result;
    } catch (error) {
      this.endTimer(timerId);
      this.recordError(operationName, error as Error);
      throw error;
    }
  }

  // Measure and record a synchronous function execution
  measureSync<T>(
    operationName: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const timerId = this.startTimer(operationName, metadata);
    
    try {
      const result = fn();
      this.endTimer(timerId);
      return result;
    } catch (error) {
      this.endTimer(timerId);
      this.recordError(operationName, error as Error);
      throw error;
    }
  }
}

// Decorator for automatic performance monitoring
export function performanceMonitor(operationName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const monitoringService = PerformanceMonitoringService.getInstance();
    const name = operationName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return monitoringService.measureAsync(name, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}