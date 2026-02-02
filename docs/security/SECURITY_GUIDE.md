# Security, Validation & Monitoring Guide

This guide explains the security, validation, and monitoring features implemented in WiredLiving.

## 🔒 Security Features

### 1. Input Validation

All user inputs are validated using **Zod schemas** to prevent malicious data:

```typescript
import { postSchema, validateRequestBody } from '@/lib/validation';

// Validate request body
const validation = await validateRequestBody(request, postSchema);
if (!validation.success) {
  return errorResponse(validation.error, 400);
}
```

**Available Schemas:**
- `postSchema` - Blog post creation/update
- `draftPostSchema` - Draft posts (more lenient)
- `loginSchema` - User authentication
- `registerSchema` - User registration with password strength
- `contactSchema` - Contact form
- `newsletterSchema` - Newsletter subscription
- `searchSchema` - Search queries
- `analyticsSchema` - Analytics tracking

### 2. Security Utilities

Located in `/lib/security.ts`:

- **Audit Logging** - Track all sensitive operations
- **CSRF Protection** - Token generation and validation
- **Data Encryption** - Encrypt/decrypt sensitive data
- **SQL Injection Detection** - Detect and prevent SQL injection
- **XSS Detection** - Detect and prevent cross-site scripting
- **File Upload Validation** - Validate file types and sizes
- **Password Strength Checking** - Enforce strong passwords

**Example Usage:**

```typescript
import { auditLog, validateInput, detectSqlInjection } from '@/lib/security';

// Audit log for admin actions
await auditLog({
  userId: user.email,
  action: 'delete_post',
  resource: 'post',
  resourceId: postSlug,
  ipAddress: clientIp,
});

// Validate user input
const result = validateInput(userInput, 'text');
if (!result.valid) {
  console.error('Threats detected:', result.threats);
}
```

### 3. Request Security

- **IP Address Tracking** - Log client IPs for security events
- **Suspicious Request Detection** - Identify bot/scraper activity
- **Rate Limiting** - Built-in rate limiting (Upstash Redis)
- **Security Headers** - CSP, X-Frame-Options, etc. (see middleware.ts)

## 📊 Monitoring & Logging

### 1. Structured Logging

Uses **Winston** for comprehensive logging:

```typescript
import { loggers } from '@/lib/logger';

// Log different event types
loggers.logRequest('POST', '/api/posts', userId);
loggers.logError(error, { context: 'api_handler' });
loggers.logSecurityEvent('Suspicious Activity', 'high', details);
loggers.logDbOperation('create', 'posts', true);
loggers.logAuth('login', userId);
loggers.logPerformance('database_query', 250);
```

**Log Levels:**
- `error` - Error events
- `warn` - Warning events
- `info` - Informational messages
- `http` - HTTP request/response
- `debug` - Debug information

**Log Files** (Production):
- `logs/error.log` - Error logs only
- `logs/combined.log` - All logs

### 2. Application Monitoring

Located in `/lib/monitoring.ts`:

```typescript
import { monitoring } from '@/lib/monitoring';

// Track API calls with performance metrics
await monitoring.trackApiCall(
  endpoint,
  method,
  statusCode,
  duration,
  userId,
  error
);

// Track errors with context
await monitoring.trackError(
  error,
  'context_name',
  'error', // severity
  userId
);

// Track security events
await monitoring.trackSecurityEvent(
  'Rate Limit Exceeded',
  'medium',
  { identifier, endpoint }
);

// Track slow database queries
monitoring.trackSlowQuery(query, duration);

// Get metrics summary
const metrics = monitoring.getMetricsSummary();

// Health check
const health = await monitoring.performHealthCheck();
```

### 3. API Middleware

Centralized API handling with logging and error handling:

```typescript
import { withApiHandler } from '@/lib/api-middleware';

export const POST = withApiHandler(
  async (request, context) => {
    // Your handler logic
    // context includes: session, userId, userEmail, clientIp, startTime
    return successResponse({ data: 'success' });
  },
  {
    requireAuth: true,
    requireAdmin: false,
    logRequests: true,
  }
);
```

## 🗄️ Database Setup

### Security Tables

Run the SQL script to create security tables:

```bash
# In Supabase SQL Editor, run:
cat supabase-security-schema.sql
```

**Tables Created:**
- `audit_logs` - Audit trail for all sensitive operations
- `monitoring_events` - Application health and performance events
- `failed_login_attempts` - Failed authentication tracking
- `rate_limits` - Rate limiting (if not using Upstash)

### Row Level Security (RLS)

All security tables have RLS enabled:
- Users can only view their own audit logs
- Service role can insert into all tables
- Monitoring events readable by all authenticated users

## ⚙️ Environment Validation

Automatic environment variable validation on startup:

```typescript
import { validateEnv, getEnv, logEnvStatus } from '@/lib/env';

// Validate environment
const validation = validateEnv();
if (!validation.valid) {
  console.error(validation.errors);
}

// Get typed environment variables
const env = getEnv(); // Throws if invalid

// Check service configuration
logEnvStatus(); // Logs configuration status
```

**Required Environment Variables:**
```env
# Authentication
AUTH_SECRET=your-secret-key-min-32-chars
NEXTAUTH_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SERVICE_ROLE_KEY=your-service-role-key

# Admin Access (comma-separated emails)
ADMIN_EMAILS=admin@example.com,admin2@example.com

# Optional: Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

## 🚀 Usage Examples

### Secure API Route

```typescript
import { NextRequest } from 'next/server';
import { withApiHandler, successResponse, errorResponse } from '@/lib/api-middleware';
import { validateRequestBody, postSchema } from '@/lib/validation';
import { auditLog } from '@/lib/security';

export const POST = withApiHandler(
  async (request: NextRequest, context) => {
    // Validate input
    const validation = await validateRequestBody(request, postSchema);
    if (!validation.success) {
      return errorResponse(validation.error, 400);
    }

    const data = validation.data;

    // Your business logic here
    const result = await doSomething(data);

    // Audit log
    await auditLog({
      userId: context.userEmail!,
      action: 'create',
      resource: 'post',
      resourceId: result.id,
      ipAddress: context.clientIp,
    });

    return successResponse(result);
  },
  { requireAuth: true, requireAdmin: true }
);
```

### Client-Side Form Validation

```typescript
import { postSchema } from '@/lib/validation';

// Validate form data before submission
try {
  const validatedData = postSchema.parse(formData);
  // Submit validated data
  await submitForm(validatedData);
} catch (error) {
  if (error instanceof z.ZodError) {
    // Show validation errors
    setErrors(error.errors);
  }
}
```

## 📈 Monitoring Dashboard

Access monitoring data:

```typescript
// Get metrics summary
const metrics = monitoring.getMetricsSummary();

console.log('Total API Calls:', metrics.totalApiCalls);
console.log('Total Errors:', metrics.totalErrors);
console.log('Slow Queries:', metrics.slowQueries);
```

Query database for detailed analytics:

```sql
-- Most common errors in the last 24 hours
SELECT message, COUNT(*) as count
FROM monitoring_events
WHERE type = 'error' AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY message
ORDER BY count DESC
LIMIT 10;

-- Recent audit trail
SELECT user_id, action, resource, created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 50;

-- Failed login attempts by IP
SELECT ip_address, COUNT(*) as attempts
FROM failed_login_attempts
WHERE attempted_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 5
ORDER BY attempts DESC;
```

## 🔐 Best Practices

1. **Always validate user input** - Use Zod schemas for all user-submitted data
2. **Log security events** - Track suspicious activity and security incidents
3. **Audit sensitive operations** - Log all create/update/delete operations
4. **Monitor performance** - Track slow queries and API response times
5. **Review logs regularly** - Check for patterns of suspicious activity
6. **Keep dependencies updated** - Regularly update security-related packages
7. **Use environment validation** - Ensure all required config is set
8. **Implement rate limiting** - Protect against abuse and DDoS
9. **Sanitize HTML content** - Prevent XSS attacks in user-generated content
10. **Encrypt sensitive data** - Use encryption for API keys and secrets

## 🧹 Maintenance

### Clean Up Old Data

Run periodically to clean up old monitoring data:

```sql
SELECT cleanup_old_monitoring_data();
```

Or set up a cron job:
```sql
-- Requires pg_cron extension
SELECT cron.schedule(
  'cleanup-monitoring-data',
  '0 2 * * *', -- Daily at 2 AM
  'SELECT cleanup_old_monitoring_data()'
);
```

### Log Rotation

In production, logs are automatically rotated:
- Max file size: 5MB
- Max files: 5
- Old files are compressed and archived

## 📚 API Reference

### Validation (`/lib/validation.ts`)
- `validateRequestBody(request, schema)` - Validate request body
- `validateQueryParams(params, schema)` - Validate URL parameters
- `sanitizeHtml(html)` - Remove dangerous HTML
- `sanitizeInput(input)` - Basic input sanitization

### Security (`/lib/security.ts`)
- `auditLog(entry)` - Create audit log entry
- `validateInput(input, type)` - Comprehensive input validation
- `validateFileUpload(file, options)` - Validate file uploads
- `checkPasswordStrength(password)` - Check password strength
- `generateSecureToken(length)` - Generate random tokens
- `detectSqlInjection(input)` - Detect SQL injection patterns
- `detectXss(input)` - Detect XSS patterns

### Monitoring (`/lib/monitoring.ts`)
- `trackApiCall(...)` - Track API endpoint calls
- `trackError(...)` - Track errors and exceptions
- `trackSecurityEvent(...)` - Track security events
- `trackSlowQuery(...)` - Track slow database queries
- `getMetricsSummary()` - Get current metrics
- `performHealthCheck()` - Check system health

### Logging (`/lib/logger.ts`)
- `loggers.logRequest(...)` - Log API requests
- `loggers.logResponse(...)` - Log API responses
- `loggers.logError(...)` - Log errors
- `loggers.logSecurityEvent(...)` - Log security events
- `loggers.logAuth(...)` - Log authentication events
- `loggers.logDbOperation(...)` - Log database operations
- `loggers.logPerformance(...)` - Log performance metrics

## 🆘 Troubleshooting

### Logs Not Writing

Check that the `logs/` directory exists:
```bash
mkdir -p logs
chmod 755 logs
```

### Environment Validation Failing

Run the status check:
```bash
npm run dev
# Check console for environment status
```

### Monitoring Events Not Saving

Ensure security tables are created:
```sql
-- Run in Supabase SQL Editor
\i supabase-security-schema.sql
```

### High Memory Usage

Adjust log rotation settings in `/lib/logger.ts`:
```typescript
maxsize: 2097152, // 2MB instead of 5MB
maxFiles: 3,      // 3 files instead of 5
```
