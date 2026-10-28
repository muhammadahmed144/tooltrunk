import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { paymentLimiter } from '../middlewares/rateLimiter.js';

export const paymentRouter = Router();

// Create Checkout Session (Authenticated borrower)
paymentRouter.post('/create-checkout-session', authMiddleware, paymentLimiter, PaymentController.createCheckoutSession);

// Webhook endpoint (Requires raw body for Stripe signature verification)
paymentRouter.post('/webhook', PaymentController.handleWebhook);

// Check payment status
paymentRouter.get('/status/:bookingId', authMiddleware, PaymentController.getPaymentStatus);
