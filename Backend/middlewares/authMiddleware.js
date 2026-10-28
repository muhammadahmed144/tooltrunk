import { verifyJwt } from '../utils/jwt.js';

/**
 * Extracts JWT token from either HTTP-only cookie or Authorization Bearer header.
 */
export function extractToken(req) {
  // Check HTTP-only cookie first
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * JWT Authentication Middleware.
 * Validates token from cookie or Authorization header and attaches decoded user to request.
 */
export function authMiddleware(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authorization token is missing or malformed.',
      message: 'Authorization token is missing or malformed.',
    });
  }

  const decoded = verifyJwt(token);
  if (!decoded || !decoded.userId) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token.',
      message: 'Invalid or expired authentication token.',
    });
  }

  req.user = {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role || 'borrower',
  };

  next();
}

/**
 * Optional Authentication Middleware.
 * Identifies authenticated users without rejecting unauthenticated guests.
 */
export function optionalAuthMiddleware(req, res, next) {
  const token = extractToken(req);
  if (token) {
    const decoded = verifyJwt(token);
    if (decoded && decoded.userId) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role || 'borrower',
      };
    }
  }
  next();
}

/**
 * Role-Based Access Control Middleware.
 * Allows access if the user's role is in allowedRoles or if the user is an admin.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required for this action.',
        message: 'Authentication required for this action.',
      });
    }

    const userRole = req.user.role || 'borrower';
    if (userRole === 'admin' || allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Forbidden. You do not have permission to access this resource.',
      message: 'Forbidden. You do not have permission to access this resource.',
    });
  };
}
