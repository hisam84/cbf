// ==============================================================================
// Authentication & Security Utilities (TypeScript)
// JWT token generation, verification, and bcrypt password hashing
// ==============================================================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthVerificationResult, JWTPayload } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'chavali_blood_foundation_default_jwt_secret_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

/**
 * Hash a plain text password with bcrypt
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainPassword, salt);
}

/**
 * Verify a plain password against a bcrypt hash
 */
export async function comparePassword(plainPassword: string, hashedPassword?: string): Promise<boolean> {
  if (!hashedPassword) return false;
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generate a signed JWT token for an admin user
 */
export function generateToken(payload: {
  id: number | string;
  username: string;
  name?: string;
  role?: string;
  permissions?: string[];
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Next.js Request authentication validator
 */
export function verifyAdminRequest(req: Request | any, requiredPermission?: string): AuthVerificationResult {
  let authHeader: string | null = null;
  let adminKey: string | null = null;

  try {
    if (req?.headers && typeof req.headers.get === 'function') {
      authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
      adminKey = req.headers.get('x-admin-auth');
    } else if (req?.headers) {
      authHeader = req.headers.authorization || req.headers.Authorization || null;
      adminKey = req.headers['x-admin-auth'] || null;
    }
  } catch {
    // ignore header reading error
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        // If permission is required, check if user has permission
        if (requiredPermission && decoded.role !== 'super_admin') {
          const userPerms = decoded.permissions || [];
          if (!userPerms.includes('all') && !userPerms.includes(requiredPermission)) {
            return {
              authenticated: false,
              error: `Forbidden: Missing required permission "${requiredPermission}"`,
            };
          }
        }

        return {
          authenticated: true,
          admin: {
            id: decoded.id,
            username: decoded.username,
            name: decoded.name,
            role: decoded.role,
            permissions: decoded.permissions,
          },
        };
      }
    }
  }

  // Admin secret key check (only if explicit ADMIN_API_SECRET is configured in environment)
  const envAdminSecret = process.env.ADMIN_API_SECRET;
  if (envAdminSecret && adminKey && adminKey === envAdminSecret) {
    return {
      authenticated: true,
      admin: { id: 1, username: 'admin', name: 'Super Admin', role: 'super_admin', permissions: ['all'] },
    };
  }

  return { authenticated: false, error: 'Unauthorized: Invalid or expired token' };
}
