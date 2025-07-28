import { useEffect, useRef, useState } from 'react';
import { PerformanceMonitoringService } from '../services/PerformanceMonitoringService';

interface PerformanceHookOptions {
  enableAutoReporting?: boolean;
  reportingInterval?: number; // in milliseconds
  performanceThresholds?: {
    slowOperationMs?: number;
    highErrorRate?: number;
  };
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

export const usePerformanceMonitoring = (options: PerformanceHookOptions = {}) => {
  const {
    enableAutoReporting = false,
    reportingInterval = 30000, // 30 seconds
    performanceThresholds = {
      slowOperationMs: 1000,
      highErrorRate: 0.05,
    },
  } = options;

  const performanceService = PerformanceMonitoringService.getInstance();
  const [performanceReport, setPerformanceReport] = useState<Record<string, PerformanceStats>>({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start monitoring
  const startMonitoring = () => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    
    if (enableAutoReporting) {
      intervalRef.current = setInterval(() => {
        const report = performanceService.getPerformanceReport();
        setPerformanceReport(report);
        
        // Check thresholds and log warnings
        performanceService.checkPerformanceThresholds();
      }, reportingInterval);
    }
  };

  // Stop monitoring
  const stopMonitoring = () => {
    if (!isMonitoring) return;
    
    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Get current performance report
  const getPerformanceReport = () => {
    const report = performanceService.getPerformanceReport();
    setPerformanceReport(report);
    return report;
  };

  // Measure a function execution
  const measureAsync = async <T>(
    operationName: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    return performanceService.measureAsync(operationName, fn, metadata);
  };

  const measureSync = <T>(
    operationName: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T => {
    return performanceService.measureSync(operationName, fn, metadata);
  };

  // Get stats for a specific operation
  const getOperationStats = (operationName: string): PerformanceStats | null => {
    return performanceService.getStats(operationName);
  };

  // Clear all metrics
  const clearMetrics = () => {
    performanceService.clearMetrics();
    setPerformanceReport({});
  };

  // Check if an operation is performing poorly
  const isOperationSlow = (operationName: string): boolean => {
    const stats = getOperationStats(operationName);
    if (!stats) return false;
    
    return stats.averageDuration > (performanceThresholds.slowOperationMs || 1000);
  };

  const hasHighErrorRate = (operationName: string): boolean => {
    const stats = getOperationStats(operationName);
    if (!stats) return false;
    
    const errorRate = stats.errorCount / stats.totalOperations;
    return errorRate > (performanceThresholds.highErrorRate || 0.05);
  };

  // Get performance insights
  const getPerformanceInsights = () => {
    const report = getPerformanceReport();
    const insights: string[] = [];
    
    Object.entries(report).forEach(([operationName, stats]) => {
      if (isOperationSlow(operationName)) {
        insights.push(`${operationName} is running slowly (avg: ${stats.averageDuration.toFixed(2)}ms)`);
      }
      
      if (hasHighErrorRate(operationName)) {
        const errorRate = (stats.errorCount / stats.totalOperations * 100).toFixed(1);
        insights.push(`${operationName} has high error rate (${errorRate}%)`);
      }
      
      if (stats.p95Duration > 2000) {
        insights.push(`${operationName} has high P95 latency (${stats.p95Duration.toFixed(2)}ms)`);
      }
    });
    
    return insights;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);

  return {
    // State
    performanceReport,
    isMonitoring,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    getPerformanceReport,
    measureAsync,
    measureSync,
    getOperationStats,
    clearMetrics,
    
    // Analysis
    isOperationSlow,
    hasHighErrorRate,
    getPerformanceInsights,
  };
};

// Hook for measuring component render performance
export const useRenderPerformance = (componentName: string) => {
  const performanceService = PerformanceMonitoringService.getInstance();
  const renderStartTime = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderDuration = performance.now() - renderStartTime.current;
    performanceService.measureSync(`${componentName}.render`, () => renderDuration);
  });

  const measureEffect = (effectName: string, fn: () => void | (() => void)) => {
    return performanceService.measureSync(`${componentName}.${effectName}`, fn);
  };

  const measureAsyncEffect = async (effectName: string, fn: () => Promise<void>) => {
    return performanceService.measureAsync(`${componentName}.${effectName}`, fn);
  };

  return {
    measureEffect,
    measureAsyncEffect,
  };
};