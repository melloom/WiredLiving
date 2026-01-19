/**
 * Custom logger utility to replace console.log statements
 * Provides better debugging capabilities and can be easily disabled in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

interface LogOptions {
  context?: string;
  data?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private enableLogs = true;

  private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const timestamp = new Date().toISOString();
    const context = options?.context ? `[${options.context}]` : '';
    return `${timestamp} ${context} ${message}`;
  }

  private getEmoji(level: LogLevel): string {
    const emojis = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
    };
    return emojis[level];
  }

  private log(level: LogLevel, message: string, options?: LogOptions) {
    if (!this.enableLogs && level !== 'error') return;
    if (!this.isDevelopment && level === 'debug') return;

    const emoji = this.getEmoji(level);
    const formattedMessage = this.formatMessage(level, message, options);

    switch (level) {
      case 'error':
        console.error(`${emoji} ${formattedMessage}`, options?.data || '');
        break;
      case 'warn':
        console.warn(`${emoji} ${formattedMessage}`, options?.data || '');
        break;
      case 'debug':
      case 'info':
      case 'success':
      default:
        console.log(`${emoji} ${formattedMessage}`, options?.data || '');
        break;
    }
  }

  debug(message: string, options?: LogOptions) {
    this.log('debug', message, options);
  }

  info(message: string, options?: LogOptions) {
    this.log('info', message, options);
  }

  warn(message: string, options?: LogOptions) {
    this.log('warn', message, options);
  }

  error(message: string, options?: LogOptions) {
    this.log('error', message, options);
  }

  success(message: string, options?: LogOptions) {
    this.log('success', message, options);
  }

  // Group logging for better organization
  group(label: string) {
    if (this.enableLogs && this.isDevelopment) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.enableLogs && this.isDevelopment) {
      console.groupEnd();
    }
  }

  // Table logging for structured data
  table(data: any) {
    if (this.enableLogs && this.isDevelopment) {
      console.table(data);
    }
  }

  // Disable/enable logging
  disable() {
    this.enableLogs = false;
  }

  enable() {
    this.enableLogs = true;
  }
}

// Export singleton instance
export const logger = new Logger();
