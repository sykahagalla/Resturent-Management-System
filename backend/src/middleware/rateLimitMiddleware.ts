import rateLimit from 'express-rate-limit';
import { config } from '../config/index';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 15 minutes
  max: config.rateLimitMaxRequests,   // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.nodeEnv === 'development',
});

// Auth routes rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 attempts per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.nodeEnv === 'development',
});

// Order creation rate limiter
export const orderLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  max: 10,                    // 10 orders per window
  message: {
    success: false,
    error: 'Too many orders placed, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.nodeEnv === 'development',
});

// Verification attempt rate limiter
export const verificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  max: 15,                    // 15 verification attempts per window
  message: {
    success: false,
    error: 'Too many verification attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.nodeEnv === 'development',
});
