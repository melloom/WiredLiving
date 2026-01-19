import { createClient } from '@supabase/supabase-js';
import { loggers } from './logger';

/**
 * Monitoring utilities for tracking application health,
 * performance, and user behavior
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Monitoring event types
export type MonitoringEventType =
  | 'api_call'
  | 'database_query'
  | 'authentication'
  | 'error'
  | 'performance'
  | 'security'
  | 'user_action';

export interface MonitoringEvent {
  type: MonitoringEventType;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  timestamp: Date;
}

// In-memory metrics storage (for development/fallback)
const metrics = {
  apiCalls: new Map<string, number>(),
  errors: new Map<string, number>(),
  slowQueries: [] as Array<{ query: string; duration: number; timestamp: Date }>,
};

/**
 * Track API endpoint calls and performance
 */
export async function trackApiCall(
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number,
  userId?: string,
  error?: string
) {
  // Update in-memory metrics
  const key = `${method}:${endpoint}`;
  metrics.apiCalls.set(key, (metrics.apiCalls.get(key) || 0) + 1);

  // Log the API call
  loggers.logRequest(method, endpoint, userId, {
    statusCode,
    duration,
    error,
  });

  // Store in database if available
  if (supabase) {
    try {
      await supabase.from('monitoring_events').insert({
        type: 'api_call',
        severity: statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warning' : 'info',
        message: `${method} ${endpoint}`,
        metadata: {
          endpoint,
          method,
          statusCode,
          duration,
          error,
        },
        user_id: userId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      // Silently fail - monitoring shouldn't break the app
      console.error('Failed to track API call:', err);
    }
  }

  // Alert on slow responses
  if (duration > 3000) {
    loggers.logSecurityEvent('Slow API Response', 'medium', {
      endpoint,
      method,
      duration,
    });
  }
}

/**
 * Track errors and exceptions
 */
export async function trackError(
  error: Error | string,
  context: string,
  severity: 'warning' | 'error' | 'critical' = 'error',
  userId?: string,
  metadata?: Record<string, unknown>
) {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Update in-memory metrics
  metrics.errors.set(context, (metrics.errors.get(context) || 0) + 1);

  // Log the error
  loggers.logError(error, {
    context,
    severity,
    userId,
    ...metadata,
  });

  // Store in database
  if (supabase) {
    try {
      await supabase.from('monitoring_events').insert({
        type: 'error',
        severity,
        message: errorMessage,
        metadata: {
          context,
          stack: errorStack,
          ...metadata,
        },
        user_id: userId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to track error:', err);
    }
  }
}

/**
 * Track slow database queries
 */
export function trackSlowQuery(query: string, duration: number) {
  if (duration > 1000) { // Queries taking more than 1 second
    const event = { query, duration, timestamp: new Date() };
    metrics.slowQueries.push(event);
    
    // Keep only last 100 slow queries
    if (metrics.slowQueries.length > 100) {
      metrics.slowQueries.shift();
    }

    loggers.logSecurityEvent('Slow Database Query', 'medium', {
      query: query.substring(0, 200), // Truncate long queries
      duration,
    });
  }
}

/**
 * Track security events
 */
export async function trackSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, unknown>
) {
  loggers.logSecurityEvent(event, severity, details);

  if (supabase) {
    try {
      await supabase.from('monitoring_events').insert({
        type: 'security',
        severity: severity === 'low' ? 'info' : severity === 'medium' ? 'warning' : 'critical',
        message: event,
        metadata: details,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to track security event:', err);
    }
  }

  // Alert on critical security events
  if (severity === 'critical' || severity === 'high') {
    console.error(`🚨 SECURITY ALERT [${severity.toUpperCase()}]: ${event}`, details);
  }
}

/**
 * Get current metrics summary
 */
export function getMetricsSummary() {
  return {
    totalApiCalls: Array.from(metrics.apiCalls.values()).reduce((a, b) => a + b, 0),
    apiCallsByEndpoint: Object.fromEntries(metrics.apiCalls),
    totalErrors: Array.from(metrics.errors.values()).reduce((a, b) => a + b, 0),
    errorsByContext: Object.fromEntries(metrics.errors),
    slowQueries: metrics.slowQueries.slice(-10), // Last 10 slow queries
  };
}

/**
 * Health check function
 */
export async function performHealthCheck() {
  const checks = {
    database: false,
    supabase: false,
    timestamp: new Date().toISOString(),
  };

  // Check Supabase connection
  if (supabase) {
    try {
      const { error } = await supabase.from('posts').select('count').limit(1);
      checks.supabase = !error;
      checks.database = !error;
    } catch (err) {
      loggers.logError('Health check failed', { error: err });
    }
  }

  return checks;
}

/**
 * Rate limit violation tracking
 */
export async function trackRateLimitViolation(
  identifier: string,
  endpoint: string,
  metadata?: Record<string, unknown>
) {
  await trackSecurityEvent('Rate Limit Exceeded', 'medium', {
    identifier,
    endpoint,
    ...metadata,
  });
}

/**
 * Suspicious activity detection
 */
export async function trackSuspiciousActivity(
  activity: string,
  identifier: string,
  details: Record<string, unknown>
) {
  await trackSecurityEvent('Suspicious Activity Detected', 'high', {
    activity,
    identifier,
    ...details,
  });
}

// Export metrics for external access
export const monitoring = {
  trackApiCall,
  trackError,
  trackSlowQuery,
  trackSecurityEvent,
  trackRateLimitViolation,
  trackSuspiciousActivity,
  getMetricsSummary,
  performHealthCheck,
};
