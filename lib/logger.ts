import winston from 'winston';

/**
 * Centralized logging utility using Winston
 * Provides structured logging with different levels and formats
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? `\n${info.stack}` : ''}`
  )
);

// Create transports
const transports: winston.transport[] = [
  // Console transport (works in all environments including Vercel)
  new winston.transports.Console({
    format: isDevelopment ? consoleFormat : logFormat,
  }),
];

// Only add file transports if we're not in a serverless environment
// Vercel and other serverless platforms have read-only filesystems
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;

if (!isDevelopment && !isServerless) {
  // Only create file transports in traditional hosting environments
  try {
    const fs = require('fs');
    const path = require('path');
    const logsDir = path.join(process.cwd(), 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    transports.push(
      // Error log file
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      // Combined log file
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  } catch (error) {
    // Silently fail if we can't create log files (e.g., read-only filesystem)
    console.warn('Could not initialize file logging:', error);
  }
}

// Create the logger
export const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  levels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Structured logging helpers
export const loggers = {
  // API request logging
  logRequest: (method: string, url: string, userId?: string, metadata?: Record<string, unknown>) => {
    logger.http('API Request', {
      type: 'request',
      method,
      url,
      userId,
      ...metadata,
    });
  },

  // API response logging
  logResponse: (method: string, url: string, status: number, duration?: number, metadata?: Record<string, unknown>) => {
    logger.http('API Response', {
      type: 'response',
      method,
      url,
      status,
      duration,
      ...metadata,
    });
  },

  // Error logging
  logError: (error: Error | string, context?: Record<string, unknown>) => {
    if (error instanceof Error) {
      logger.error(error.message, {
        type: 'error',
        stack: error.stack,
        ...context,
      });
    } else {
      logger.error(error, {
        type: 'error',
        ...context,
      });
    }
  },

  // Security event logging
  logSecurityEvent: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: Record<string, unknown>) => {
    logger.warn('Security Event', {
      type: 'security',
      event,
      severity,
      ...details,
    });
  },

  // Database operation logging
  logDbOperation: (operation: string, table: string, success: boolean, metadata?: Record<string, unknown>) => {
    logger.info('Database Operation', {
      type: 'database',
      operation,
      table,
      success,
      ...metadata,
    });
  },

  // Authentication logging
  logAuth: (event: 'login' | 'logout' | 'register' | 'failed_login' | 'password_reset', userId?: string, metadata?: Record<string, unknown>) => {
    logger.info('Authentication Event', {
      type: 'authentication',
      event,
      userId,
      ...metadata,
    });
  },

  // Performance logging
  logPerformance: (operation: string, duration: number, metadata?: Record<string, unknown>) => {
    logger.debug('Performance Metric', {
      type: 'performance',
      operation,
      duration,
      ...metadata,
    });
  },

  // Admin action logging
  logAdminAction: (action: string, resource: string, resourceId: string, userId: string, metadata?: Record<string, unknown>) => {
    logger.info('Admin Action', {
      type: 'admin',
      action,
      resource,
      resourceId,
      userId,
      ...metadata,
    });
  },
};

// Helper to measure execution time
export function measureTime<T>(
  operation: string,
  fn: () => T | Promise<T>
): Promise<T> {
  const start = Date.now();
  
  const handleResult = (result: T) => {
    const duration = Date.now() - start;
    loggers.logPerformance(operation, duration);
    return result;
  };

  const handleError = (error: unknown) => {
    const duration = Date.now() - start;
    loggers.logPerformance(operation, duration, { error: true });
    throw error;
  };

  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(handleResult).catch(handleError);
    }
    return Promise.resolve(handleResult(result));
  } catch (error) {
    handleError(error);
    throw error;
  }
}

// Export default logger
export default logger;
