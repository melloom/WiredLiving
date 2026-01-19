import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { loggers } from './logger';
import { trackApiCall } from './monitoring';
import { getClientIp, isSuspiciousRequest } from './security';

/**
 * API middleware utilities for request handling
 */

export interface ApiContext {
  session: any;
  userId?: string;
  userEmail?: string;
  clientIp: string;
  startTime: number;
}

/**
 * Wrap API handler with authentication, logging, and error handling
 */
export function withApiHandler(
  handler: (request: NextRequest, context: ApiContext) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    logRequests?: boolean;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { requireAuth = false, requireAdmin = false, logRequests = true } = options;
    
    const startTime = Date.now();
    const clientIp = getClientIp(request.headers);
    const url = new URL(request.url);
    const endpoint = url.pathname;
    const method = request.method;

    try {
      // Check for suspicious requests
      if (isSuspiciousRequest(request.headers)) {
        loggers.logSecurityEvent('Suspicious request detected', 'medium', {
          endpoint,
          ip: clientIp,
          userAgent: request.headers.get('user-agent'),
        });
      }

      // Authentication check
      const session = requireAuth || requireAdmin ? await auth() : null;

      if (requireAuth && !session?.user) {
        loggers.logAuth('failed_login', undefined, { endpoint, ip: clientIp });
        await trackApiCall(endpoint, method, 401, Date.now() - startTime, undefined, 'Unauthorized');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Admin check (you can customize this based on your user model)
      if (requireAdmin && (!session?.user?.email || !isAdminEmail(session.user.email))) {
        loggers.logSecurityEvent('Unauthorized admin access attempt', 'high', {
          endpoint,
          userId: session?.user?.email || undefined,
          ip: clientIp,
        });
        await trackApiCall(endpoint, method, 403, Date.now() - startTime, session?.user?.email || undefined, 'Forbidden');
        return NextResponse.json(
          { success: false, error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }

      // Log request
      if (logRequests) {
        loggers.logRequest(method, endpoint, session?.user?.email || undefined, {
          ip: clientIp,
        });
      }

      // Create context
      const context: ApiContext = {
        session,
        userId: session?.user?.id,
        userEmail: session?.user?.email || undefined,
        clientIp,
        startTime,
      };

      // Execute handler
      const response = await handler(request, context);

      // Log response
      const duration = Date.now() - startTime;
      if (logRequests) {
        loggers.logResponse(method, endpoint, response.status, duration);
      }

      await trackApiCall(
        endpoint,
        method,
        response.status,
        duration,
        session?.user?.email || undefined
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      loggers.logError(error as Error, { endpoint, method, ip: clientIp });
      
      await trackApiCall(
        endpoint,
        method,
        500,
        duration,
        undefined,
        errorMessage
      );

      return NextResponse.json(
        {
          success: false,
          error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : errorMessage,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Check if email is an admin (customize based on your requirements)
 */
function isAdminEmail(email: string): boolean {
  // Add your admin email check logic here
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * Helper to create standardized JSON responses
 */
export function jsonResponse<T = unknown>(
  data: T,
  status: number = 200,
  headers?: Record<string, string>
): NextResponse {
  const response = NextResponse.json(data, { status });
  
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

/**
 * Helper to create standardized error responses
 */
export function errorResponse(
  error: string | Error,
  status: number = 500,
  details?: Record<string, unknown>
): NextResponse {
  const message = error instanceof Error ? error.message : error;
  
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...details,
    },
    { status }
  );
}

/**
 * Helper to create standardized success responses
 */
export function successResponse<T = unknown>(
  data: T,
  message?: string
): NextResponse {
  return NextResponse.json({
    success: true,
    ...(message && { message }),
    ...(typeof data === 'object' && data !== null ? data : { data }),
  });
}
