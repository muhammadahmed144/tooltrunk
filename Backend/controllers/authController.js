import crypto from 'crypto';
import { UserModel } from '../models/userModel.js';
import { signJwt } from '../utils/jwt.js';
import { emailService } from '../services/emailService.js';

function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  if (res.cookie) {
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }
}

function clearAuthCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';
  if (res.clearCookie) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });
  }
}

export class AuthController {
  /**
   * POST: /api/auth/register
   * Creates a brand new neighbor account and hashes their credentials.
   */
  static async register(req, res) {
    const { fullName, email, password, postalCode, role } = req.body;

    // Direct, user-friendly field validations
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Please enter a valid full name (minimum 2 characters).' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }
    if (!postalCode || typeof postalCode !== 'string' || postalCode.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Please enter a valid postal code (minimum 3 characters).' });
    }

    try {
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'An account with this email address is already registered.' });
      }

      const passwordHash = UserModel.hashPassword(password);
      const newUser = await UserModel.create({
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        postalCode: postalCode.toUpperCase().trim(),
        role: role || 'borrower',
        locationSettings: {
          homeAddress: '',
          maxDistance: 10, // Default search radius
          publicLocation: false,
        },
      });

      const token = signJwt({ userId: newUser.id, email: newUser.email, role: newUser.role || 'borrower' });
      setAuthCookie(res, token);

      const { passwordHash: _, ...userResponse } = newUser;

      // Send welcome email asynchronously
      emailService.sendWelcomeEmail({ email: newUser.email, name: newUser.fullName }).catch(() => {});

      return res.status(201).json({
        success: true,
        message: 'Registration successful! Welcome to ToolTrunk.',
        token,
        user: userResponse,
      });
    } catch (err) {
      console.error('Registration controller error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Internal server error during registration.' });
    }
  }

  /**
   * POST: /api/auth/login
   * Validates passwords against scrypt hashes and signs sessions.
   */
  static async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please specify both email and password.' });
    }

    try {
      const user = await UserModel.findByEmail(email);
      if (!user || !UserModel.verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ success: false, error: 'Invalid email address or incorrect password.' });
      }

      const token = signJwt({ userId: user.id, email: user.email, role: user.role || 'borrower' });
      setAuthCookie(res, token);

      const { passwordHash: _, ...userResponse } = user;

      return res.status(200).json({
        success: true,
        message: 'Signed in successfully!',
        token,
        user: userResponse,
      });
    } catch (err) {
      console.error('Login controller error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Internal server error during login.' });
    }
  }

  /**
   * POST: /api/auth/logout
   * Clears the HTTP-only cookie and ends session.
   */
  static async logout(req, res) {
    clearAuthCookie(res);
    return res.status(200).json({
      success: true,
      message: 'Signed out successfully.',
    });
  }

  /**
   * GET: /api/auth/me
   * Fetches the current user profile metadata safely.
   */
  static async me(req, res) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unidentified credentials session.' });
    }

    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User profile not found.' });
      }

      const { passwordHash: _, ...userResponse } = user;
      return res.status(200).json({ success: true, user: userResponse });
    } catch (err) {
      console.error('Me controller error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Internal server error fetching user profile.' });
    }
  }

  /**
   * POST: /api/profile/update
   * Allows updates to name, postal code, and centralized radius configurations.
   */
  static async updateProfile(req, res) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unidentified credentials session.' });
    }

    const { fullName, postalCode, locationSettings, avatarUrl, newPassword } = req.body;

    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User profile not found.' });
      }

      const updates = {};

      if (fullName && typeof fullName === 'string' && fullName.trim().length >= 2) {
        updates.fullName = fullName.trim();
      }

      if (postalCode && typeof postalCode === 'string' && postalCode.trim().length >= 3) {
        updates.postalCode = postalCode.toUpperCase().trim();
      }

      if (typeof avatarUrl === 'string') {
        updates.avatarUrl = avatarUrl;
      }

      if (newPassword && typeof newPassword === 'string') {
        if (newPassword.length < 6) {
          return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
        }
        updates.passwordHash = UserModel.hashPassword(newPassword);
      }

      if (locationSettings) {
        updates.locationSettings = {
          homeAddress: typeof locationSettings.homeAddress === 'string' ? locationSettings.homeAddress : user.locationSettings.homeAddress,
          maxDistance: typeof locationSettings.maxDistance === 'number' ? locationSettings.maxDistance : user.locationSettings.maxDistance,
          publicLocation: typeof locationSettings.publicLocation === 'boolean' ? locationSettings.publicLocation : user.locationSettings.publicLocation,
        };
      }

      const updatedUser = await UserModel.update(userId, updates);
      if (!updatedUser) {
        return res.status(500).json({ success: false, error: 'Unable to write database updates.' });
      }

      const { passwordHash: _, ...userResponse } = updatedUser;
      return res.status(200).json({
        success: true,
        message: 'Profile settings updated successfully!',
        user: userResponse,
      });
    } catch (err) {
      console.error('Update profile controller error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Internal server error during profile update.' });
    }
  }

  /**
   * POST: /api/reputation/add
   * Increments community reputation and writes an entry on the ledger logs.
   */
  static async addReputation(req, res) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unidentified credentials session.' });
    }

    const { description, points } = req.body;
    if (!description || typeof description !== 'string' || typeof points !== 'number') {
      return res.status(400).json({ success: false, error: 'Description must be text and points must be a number.' });
    }

    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User profile not found.' });
      }

      const updatedReputation = user.reputation + points;
      const updatedHistory = [
        {
          id: crypto.randomUUID(),
          description,
          points,
          timestamp: new Date().toISOString(),
        },
        ...user.reputationHistory,
      ];

      const updatedUser = await UserModel.update(userId, {
        reputation: updatedReputation,
        reputationHistory: updatedHistory,
      });

      if (!updatedUser) {
        return res.status(500).json({ success: false, error: 'Failed to record reputation.' });
      }

      const { passwordHash: _, ...userResponse } = updatedUser;
      return res.status(200).json({
        success: true,
        message: `Reputation updated! added ${points} points.`,
        user: userResponse,
      });
    } catch (err) {
      console.error('Add reputation controller error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Internal server error logging reputation.' });
    }
  }

  /**
   * DELETE: /api/auth/profile/delete
   * Permanently deletes the current user account and all associated data.
   */
  static async deleteAccount(req, res) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unidentified credentials session.' });
    }

    try {
      const deleted = await UserModel.delete(userId);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'User account not found or already deleted.' });
      }

      clearAuthCookie(res);

      return res.status(200).json({
        success: true,
        message: 'Account permanently deleted. We are sad to see you go!',
      });
    } catch (err) {
      console.error('Delete account controller error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Internal server error deleting account.' });
    }
  }
}
