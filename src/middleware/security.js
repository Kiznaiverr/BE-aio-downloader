import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger from './logger.js';

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200
};

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : (req.ip || req.connection?.remoteAddress || 'unknown');

    try {
      logger.log(req.method, req.originalUrl, 429, 0, ip)
    } catch (e) {
      console.warn('Rate limit exceeded, failed to log details', e.message);
    }

    const retryAfter = Math.ceil((options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')) / 1000);
    res.set('Retry-After', String(retryAfter));

    res.status(429).json({
      success: false,
      code: 429,
      data: null,
      message: 'Too many requests from this IP, please try again later.',
      ip
    });
  }
});

const securityMiddleware = [
  cors(corsOptions),
  helmet(),
  limiter
];

export default securityMiddleware;