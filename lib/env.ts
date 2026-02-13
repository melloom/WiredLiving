import { z } from 'zod';

/**
 * Environment variable validation
 * Ensures all required environment variables are set and valid
 */

// Define the schema for environment variables
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // NextAuth
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional(),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SERVICE_ROLE_KEY: z.string().min(1, 'SERVICE_ROLE_KEY is required'),

  // Upstash Redis (optional, for rate limiting)
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL').optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Admin emails (comma-separated)
  ADMIN_EMAILS: z.string().optional(),

  // News API (optional)
  NEWS_API_KEY: z.string().optional(),

  // Weather API (optional)
  NEXT_PUBLIC_WEATHER_API_KEY: z.string().optional(),

  // Email service (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email('SMTP_FROM must be a valid email').optional(),

  // Analytics (optional)
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  PLAUSIBLE_DOMAIN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 */
export function validateEnv(): { valid: boolean; errors?: string[] } {
  try {
    envSchema.parse(process.env);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`
      );
      return { valid: false, errors };
    }
    return { valid: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Get typed environment variables (throws if invalid)
 */
export function getEnv(): Env {
  const validation = validateEnv();
  
  if (!validation.valid) {
    console.error('❌ Environment validation failed:');
    validation.errors?.forEach((error) => console.error(`  - ${error}`));
    throw new Error('Invalid environment configuration');
  }

  return process.env as unknown as Env;
}

/**
 * Check if required services are configured
 */
export function checkServiceConfiguration() {
  const checks = {
    supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SERVICE_ROLE_KEY),
    auth: !!process.env.AUTH_SECRET,
    rateLimit: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    email: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD),
    analytics: !!(process.env.GOOGLE_ANALYTICS_ID || process.env.PLAUSIBLE_DOMAIN),
    newsApi: !!process.env.NEWS_API_KEY,
    weatherApi: !!process.env.NEXT_PUBLIC_WEATHER_API_KEY,
  };

  return checks;
}

/**
 * Log environment configuration status
 */
export function logEnvStatus() {
  const validation = validateEnv();
  const services = checkServiceConfiguration();

  console.log('\n🔧 Environment Configuration:');
  console.log('─'.repeat(50));
  
  if (validation.valid) {
    console.log('✅ Environment variables: Valid');
  } else {
    console.log('❌ Environment variables: Invalid');
    validation.errors?.forEach((error) => console.log(`   - ${error}`));
  }

  console.log('\n📦 Service Configuration:');
  console.log('─'.repeat(50));
  console.log(`  Supabase:      ${services.supabase ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  Authentication: ${services.auth ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  Rate Limiting:  ${services.rateLimit ? '✅ Configured' : '⚠️  Optional'}`);
  console.log(`  Email Service:  ${services.email ? '✅ Configured' : '⚠️  Optional'}`);
  console.log(`  Analytics:      ${services.analytics ? '✅ Configured' : '⚠️  Optional'}`);
  console.log(`  News API:       ${services.newsApi ? '✅ Configured' : '⚠️  Optional'}`);
  console.log(`  Weather API:    ${services.weatherApi ? '✅ Configured' : '⚠️  Optional'}`);
  console.log('─'.repeat(50) + '\n');
}

// Validate environment on module load (only in development)
if (process.env.NODE_ENV === 'development') {
  try {
    logEnvStatus();
  } catch (error) {
    console.error('Failed to validate environment:', error);
  }
}
