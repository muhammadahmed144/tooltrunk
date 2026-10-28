import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dns from 'dns';
import swaggerUi from 'swagger-ui-express';

import { authRouter } from './routes/authRoutes.js';
import { toolRouter } from './routes/toolRoutes.js';
import { bookingRouter } from './routes/bookingRoutes.js';
import { paymentRouter } from './routes/paymentRoutes.js';
import { uploadRouter } from './routes/uploadRoutes.js';
import { initDb } from './models/userModel.js';
import { initMongo } from './utils/mongo.js';
import { initSentry } from './utils/sentry.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { swaggerDocument } from './docs/swagger.js';

// Use Google DNS for reliable cloud connectivity
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function startServer() {
  // Initialize primary relational database (SQLite with WAL mode and foreign key integrity)
  await initDb();

  // Concurrently attempt cloud MongoDB connection if configured
  initMongo().catch((err) => {
    console.warn('MongoDB initialization notice:', err.message);
  });

  const app = express();

  // Initialize Sentry Monitoring
  const sentry = initSentry(app);
  app.use(sentry.requestHandler);

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Allows Swagger UI and local development embedding
    crossOriginEmbedderPolicy: false,
  }));

  // Cookie Parser
  app.use(cookieParser());

  // CORS Configuration
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    process.env.CLIENT_URL,
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev, or specify strict matching
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  }));

  // Body Parsers: Capture raw buffer on JSON for Stripe webhook signature verification
  app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // General Rate Limiting for all /api endpoints
  app.use('/api', apiLimiter);

  // Interactive Swagger/OpenAPI Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'ToolTrunk REST API Documentation',
  }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'ToolTrunk SaaS Production API',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api', authRouter); // Compatibility mapping for profile/reputation routes
  app.use('/api/tools', toolRouter);
  app.use('/api/bookings', bookingRouter);
  app.use('/api/payments', paymentRouter);
  app.use('/api/upload', uploadRouter);

  // Sentry Error Handler
  app.use(sentry.errorHandler);

  // Centralized Global Error Handler
  app.use(errorHandler);

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`🚀 ToolTrunk backend server running on http://localhost:${PORT}`);
    console.log(`📖 API Documentation available at http://localhost:${PORT}/api-docs`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ToolTrunk server:', err);
  process.exit(1);
});
