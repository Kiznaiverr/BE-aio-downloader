import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200
};

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const securityMiddleware = [
  cors(corsOptions),
  helmet(),
  limiter
];

export default securityMiddleware;