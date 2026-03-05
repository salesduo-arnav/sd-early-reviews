import rateLimit from 'express-rate-limit';

/**
 * General-purpose rate limiter for public, unauthenticated endpoints.
 * 60 requests per minute per IP.
 */
export const publicRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    standardHeaders: true,  // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
});

/**
 * Stricter limiter for sensitive endpoints like auth.
 * 10 requests per minute per IP.
 */
export const authRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
});
