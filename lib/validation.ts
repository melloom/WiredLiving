import { z } from 'zod';

/**
 * Validation schemas for various data types
 * Using Zod for runtime validation with TypeScript types
 */

// Common field validators
export const emailSchema = z.string().email('Invalid email address').toLowerCase();
export const urlSchema = z.string().url('Invalid URL');
export const slugSchema = z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens');
export const uuidSchema = z.string().uuid('Invalid UUID');

// Post creation/update schema
export const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  content: z.string().min(1, 'Content is required'),
  author: z.string().min(1, 'Author is required'),
  tags: z.array(z.string()).optional(),
  published: z.boolean().default(false),
  date: z.string().or(z.date()).optional(),
  excerpt: z.string().max(500).optional(),
  coverImage: urlSchema.optional().or(z.literal('')),
  coverImageCrop: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    objectPosition: z.string().optional(),
  }).optional(),
  featured: z.boolean().default(false),
  seoTitle: z.string().max(70, 'SEO title should be under 70 characters').optional(),
  seoDescription: z.string().max(160, 'SEO description should be under 160 characters').optional(),
  galleryImages: z.array(urlSchema).optional(),
  category: z.string().optional(),
  series: z.string().optional(),
  seriesOrder: z.number().int().positive().optional().nullable(),
  slugOverride: slugSchema.optional(),
  slugLocked: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']).default('draft'),
  scheduledAt: z.string().or(z.date()).optional().nullable(),
  visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
  isPremium: z.boolean().default(false),
  requiresLogin: z.boolean().default(false),
  canonicalUrl: urlSchema.optional(),
  ogImageOverride: urlSchema.optional(),
  twitterTitle: z.string().max(70).optional(),
  twitterDescription: z.string().max(200).optional(),
  structuredDataType: z.string().optional(),
  relatedLinks: z.array(z.object({
    title: z.string(),
    url: urlSchema,
    description: z.string().optional(),
  })).optional(),
});

// Draft post schema (more lenient)
export const draftPostSchema = postSchema.extend({
  title: z.string().min(1).max(200).default('Untitled Draft'),
  content: z.string().default(''),
  author: z.string().default('Admin'),
});

// Analytics tracking schema
export const analyticsSchema = z.object({
  pagePath: z.string().min(1, 'Page path is required'),
  pageTitle: z.string().optional(),
  postSlug: slugSchema.optional(),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
});

// Contact form schema
export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: emailSchema,
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

// Newsletter subscription schema
export const newsletterSchema = z.object({
  email: emailSchema,
  name: z.string().min(2).max(100).optional(),
  preferences: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
    topics: z.array(z.string()).optional(),
  }).optional(),
});

// Comment schema (if you add comments)
export const commentSchema = z.object({
  postSlug: slugSchema,
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
  author: z.string().min(2).max(100),
  email: emailSchema,
  parentId: uuidSchema.optional(),
});

// Search query schema
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

// User registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  name: z.string().min(2).max(100).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Admin action logging schema
export const adminActionSchema = z.object({
  action: z.enum(['create', 'update', 'delete', 'publish', 'unpublish', 'archive']),
  resource: z.enum(['post', 'tag', 'category', 'user', 'setting']),
  resourceId: z.string(),
  userId: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// File upload schema
export const fileUploadSchema = z.object({
  file: z.custom<File>(),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB default
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
});

// Helper function to validate request body
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Invalid request body' };
  }
}

// Helper to validate query parameters
export function validateQueryParams<T>(
  params: URLSearchParams | Record<string, unknown>,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = params instanceof URLSearchParams
      ? Object.fromEntries(params.entries())
      : params;
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Invalid query parameters' };
  }
}

// Sanitization helpers
export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
