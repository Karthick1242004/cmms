import { NextRequest } from 'next/server';

// Simple in-memory rate limiting (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
}

export function rateLimit(options: RateLimitOptions) {
  return {
    check: (request: NextRequest, token: string): { success: boolean; limit: number; remaining: number; reset: Date } => {
      const tokenKey = `${token}_${Math.floor(Date.now() / options.interval)}`;
      const now = Date.now();
      const resetTime = Math.ceil(now / options.interval) * options.interval;
      
      const record = rateLimitMap.get(tokenKey) || { count: 0, resetTime };
      
      if (now > record.resetTime) {
        // Reset counter for new time window
        record.count = 0;
        record.resetTime = resetTime;
      }
      
      record.count++;
      rateLimitMap.set(tokenKey, record);
      
      // Clean up old entries (optional, prevents memory leak)
      for (const [key, value] of rateLimitMap.entries()) {
        if (value.resetTime < now - options.interval) {
          rateLimitMap.delete(key);
        }
      }
      
      const success = record.count <= options.uniqueTokenPerInterval;
      
      return {
        success,
        limit: options.uniqueTokenPerInterval,
        remaining: Math.max(0, options.uniqueTokenPerInterval - record.count),
        reset: new Date(resetTime)
      };
    }
  };
}

// Rate limit configurations for different endpoints
export const overtimeRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 10, // 10 requests per minute per user
});

export const generalApiRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100, // 100 requests per minute per user
});
