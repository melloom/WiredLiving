import { createClient } from '@supabase/supabase-js';
import { loggers } from './logger';
import { trackSecurityEvent } from './monitoring';
import crypto from 'crypto';

/**
 * Security utilities and helpers for the application
 * Includes audit logging, CSRF protection, input sanitization, etc.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Audit log entry type
 */
export interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log audit trail for sensitive operations
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  const timestamp = new Date().toISOString();

  // Log to application logger
  loggers.logAdminAction(
    entry.action,
    entry.resource,
    entry.resourceId,
    entry.userId,
    {
      changes: entry.changes,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      ...entry.metadata,
    }
  );

  // Store in database
  if (supabase) {
    try {
      await supabase.from('audit_logs').insert({
        user_id: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resourceId,
        changes: entry.changes,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        metadata: entry.metadata,
        created_at: timestamp,
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      loggers.logError(error as Error, { context: 'auditLog' });
    }
  }
}

/**
 * Generate a secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) {
    return false;
  }
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(storedToken)
    );
  } catch {
    return false;
  }
}

/**
 * Hash sensitive data (e.g., for storing API keys)
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Encrypt sensitive data
 */
export function encryptData(data: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(key.padEnd(32, '0').slice(0, 32)),
    iv
  );
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string, key: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key.padEnd(32, '0').slice(0, 32)),
    Buffer.from(ivHex, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Sanitize SQL input to prevent SQL injection
 */
export function sanitizeSqlInput(input: string): string {
  // Remove any SQL-specific characters that could be used for injection
  return input
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim();
}

/**
 * Validate file uploads
 */
export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export function validateFileUpload(
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
    };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check file extension
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Check if request is from a suspicious source
 */
export function isSuspiciousRequest(headers: Headers): boolean {
  const userAgent = headers.get('user-agent');
  const referer = headers.get('referer');

  // Check for missing user agent
  if (!userAgent || userAgent.trim() === '') {
    return true;
  }

  // Check for known bad user agents
  const suspiciousAgents = [
    'curl',
    'wget',
    'python-requests',
    'bot',
    'spider',
    'crawler',
  ];

  const lowerAgent = userAgent.toLowerCase();
  if (suspiciousAgents.some(agent => lowerAgent.includes(agent))) {
    // Allow legitimate crawlers
    if (lowerAgent.includes('googlebot') || lowerAgent.includes('bingbot')) {
      return false;
    }
    return true;
  }

  return false;
}

/**
 * Extract IP address from request
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

/**
 * Detect potential SQL injection patterns
 */
export function detectSqlInjection(input: string): boolean {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bOR\b.*=.*)/i,
    /(--|;|\/\*|\*\/)/,
    /(\bxp_|\bsp_)/i,
  ];

  return patterns.some(pattern => pattern.test(input));
}

/**
 * Detect potential XSS patterns
 * NOTE: This is lenient to allow markdown, code blocks, and legitimate HTML
 * Actual HTML sanitization happens at render time
 */
export function detectXss(input: string): boolean {
  const patterns = [
    // Only flag actual executable script tags (not code blocks or examples)
    /<script\b[^>]*>\s*(?!.*```|.*`|.*code)[^<]*<\/script>/i,
    // Event handlers in actual HTML attributes
    /\s(on\w+)\s*=\s*["']?(?!.*```|.*`)(?:javascript:|[^"'\s]*)/i,
    // Only flag iframe if not in code block/markdown
    /(?<!`)<iframe[^>]*>/i,
    // Only flag embed if not in code block
    /(?<!`)<embed[^>]*>/i,
    // Only flag object if not in code block
    /(?<!`)<object[^>]*>/i,
    // Flag only dangerous javascript: protocols outside code blocks
    /(?<![\`<])\bjavascript:/i,
  ];

  // If content is clearly markdown/code, skip XSS detection
  if (input.includes('```') || input.includes('```javascript') || input.includes('```html')) {
    return false;
  }

  return patterns.some(pattern => pattern.test(input));
}

/**
 * Validate and sanitize user input
 */
export function validateInput(input: string, type: 'text' | 'email' | 'url' | 'sql' = 'text'): {
  valid: boolean;
  sanitized: string;
  threats: string[];
} {
  const threats: string[] = [];
  let sanitized = input.trim();

  // Check for SQL injection
  if (type === 'sql' || type === 'text') {
    if (detectSqlInjection(input)) {
      threats.push('SQL Injection');
      trackSecurityEvent('SQL Injection Attempt Detected', 'high', { input });
    }
  }

  // Check for XSS
  if (detectXss(input)) {
    threats.push('XSS Attack');
    trackSecurityEvent('XSS Attempt Detected', 'high', { input });
  }

  // Type-specific validation
  if (type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input)) {
      return { valid: false, sanitized, threats: ['Invalid Email'] };
    }
  }

  if (type === 'url') {
    try {
      new URL(input);
    } catch {
      return { valid: false, sanitized, threats: ['Invalid URL'] };
    }
  }

  return {
    valid: threats.length === 0,
    sanitized,
    threats,
  };
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number; // 0-4
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score < 2) feedback.push('Password is too weak');
  if (password.length < 8) feedback.push('Password should be at least 8 characters');
  if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
  if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters');
  if (!/[0-9]/.test(password)) feedback.push('Add numbers');
  if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('Add special characters');

  return { score: Math.min(score, 4), feedback };
}

export const security = {
  auditLog,
  generateCsrfToken,
  validateCsrfToken,
  hashData,
  encryptData,
  decryptData,
  sanitizeSqlInput,
  validateFileUpload,
  isSuspiciousRequest,
  getClientIp,
  detectSqlInjection,
  detectXss,
  validateInput,
  generateSecureToken,
  checkPasswordStrength,
};
