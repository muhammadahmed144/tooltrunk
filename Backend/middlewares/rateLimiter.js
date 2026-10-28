import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisService } from '../services/redisService.js';

function createLimiter({ windowMs, max, message }) {
  const store = redisService.isAvailable()
    ? new RedisStore({
        sendCommand: (...args) => redisService.getClient().call(...args),
      })
    : undefined; // Default in-memory store

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message: {
      success: false,
      error: message,
      message,
    },
    handler: (req, res, next, options) => {
      res.status(429).json(options.message);
    },
  });
}

// General API rate limiter
export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: 'Too many requests from this IP. Please try again after 15 minutes.',
});

// Stricter rate limiter for authentication endpoints
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

// Rate limiter for payment creation
export const paymentLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many payment requests. Please try again in 15 minutes.',
});
