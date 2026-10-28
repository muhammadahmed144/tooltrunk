import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dns from "dns";
import swaggerUi from "swagger-ui-express";

import { authRouter } from "./routes/authRoutes.js";
import { toolRouter } from "./routes/toolRoutes.js";
import { bookingRouter } from "./routes/bookingRoutes.js";
import { paymentRouter } from "./routes/paymentRoutes.js";
import { uploadRouter } from "./routes/uploadRoutes.js";
import { initMongo } from "./utils/mongo.js"; // 👈 Sirf MongoDB import rakho
import { initSentry } from "./utils/sentry.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";
import { swaggerDocument } from "./docs/swagger.js";

// Use Google DNS for reliable cloud connectivity
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

app.set("trust proxy", 1);

app.get("/", (req, res) => {
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px; padding: 20px;">
      <h1 style="color: #2e7d32; font-size: 2.5rem;">🚀 ToolTrunk Backend is Running Successfully!</h1>
      <p style="font-size: 1.2rem; color: #555;">Your SaaS Production API is up, connected to MongoDB & Redis, and ready for action.</p>
      <div style="margin-top: 30px;">
        <a href="/api/health" style="margin-right: 20px; padding: 10px 20px; background: #2e7d32; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Health Check</a>
        <a href="/api-docs" style="padding: 10px 20px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">API Documentation</a>
      </div>
    </div>
  `);
});

async function startServer() {
  try {
    // 🚀 Initialize Cloud MongoDB Connection
    await initMongo();
    console.log("✅ MongoDB connection verified for server startup.");
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
  }

  // Initialize Sentry Monitoring
  const sentry = initSentry(app);
  app.use(sentry.requestHandler);

  // Security Middleware
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Cookie Parser
  app.use(cookieParser());

  // CORS Configuration
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5000",
    process.env.CLIENT_URL,
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
    }),
  );

  // Body Parsers
  app.use(
    express.json({
      limit: "10mb",
      verify: (req, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // General Rate Limiting
  app.use("/api", apiLimiter);

  // Interactive Swagger Documentation
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customSiteTitle: "ToolTrunk REST API Documentation",
    }),
  );

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "ToolTrunk SaaS Production API",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routers
  app.use("/api/auth", authRouter);
  app.use("/api", authRouter);
  app.use("/api/tools", toolRouter);
  app.use("/api/bookings", bookingRouter);
  app.use("/api/payments", paymentRouter);
  app.use("/api/upload", uploadRouter);

  // Sentry Error Handler
  app.use(sentry.errorHandler);

  // Centralized Global Error Handler
  app.use(errorHandler);

  const PORT = process.env.PORT || 5000;

  // Local development ke liye app.listen (Vercel serverless mein automatic handle hota hai)
  if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
      console.log(
        `🚀 ToolTrunk backend server running on http://localhost:${PORT}`,
      );
      console.log(
        `📖 API Documentation available at http://localhost:${PORT}/api-docs`,
      );
      console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    });
  }
}

startServer().catch((err) => {
  console.error("Failed to start ToolTrunk server:", err);
  process.exit(1);
});

// Vercel serverless function ke liye app export karna zaroori hai
export default app;
