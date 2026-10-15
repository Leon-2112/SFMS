import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool.ts';

export interface AuthenticatedUser {
  user_id: number;
  full_name: string;
  email: string;
  role: 'MEMBER' | 'ADMIN' | 'MAINTENANCE_STAFF';
  account_status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  department?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Authentication middleware: verifies user session/bearer token against database
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const userIdHeader = req.headers['x-user-id'];

    let userId: number | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        if (decoded && decoded.user_id) {
          userId = Number(decoded.user_id);
        }
      } catch {
        // If not base64 JSON, try direct numeric token
        if (/^\d+$/.test(token)) {
          userId = Number(token);
        }
      }
    } else if (userIdHeader) {
      userId = Number(userIdHeader);
    }

    if (!userId || isNaN(userId)) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Valid authentication session or bearer token required.',
        },
      });
      return;
    }

    // Query MySQL for current active user record
    const rows = await query<AuthenticatedUser[]>(
      'SELECT user_id, full_name, email, role, account_status, department FROM users WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (!rows || rows.length === 0) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'User account not found.',
        },
      });
      return;
    }

    const user = rows[0];
    if (user.account_status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: `User account is currently ${user.account_status}. Please contact athletics administration.`,
        },
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_AUTH_ERROR',
        message: 'Authentication processing failed.',
      },
    });
  }
}

/**
 * Role-Based Access Control (RBAC) middleware
 */
export function authorize(...allowedRoles: Array<'MEMBER' | 'ADMIN' | 'MAINTENANCE_STAFF'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required before checking permissions.',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Endpoint requires role: [${allowedRoles.join(', ')}], current role is: ${req.user.role}`,
        },
      });
      return;
    }

    next();
  };
}
