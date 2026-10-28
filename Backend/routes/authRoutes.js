import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

export const authRouter = Router();

// Registration & Sign-in Endpoints with rate limiting protection
authRouter.post('/register', authLimiter, AuthController.register);
authRouter.post('/login', authLimiter, AuthController.login);
authRouter.post('/logout', AuthController.logout);

// Authenticated session status endpoint
authRouter.get('/me', authMiddleware, AuthController.me);

// Profile location-radius settings updates
authRouter.post('/profile/update', authMiddleware, AuthController.updateProfile);

// Permanently delete user account
authRouter.delete('/profile/delete', authMiddleware, AuthController.deleteAccount);

// Reputation log points additions
authRouter.post('/reputation/add', authMiddleware, AuthController.addReputation);
