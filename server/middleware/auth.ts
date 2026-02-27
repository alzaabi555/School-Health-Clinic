import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-school-health';

export interface AuthRequest extends Request {
  user?: { id: number; username: string; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  // Bypass authentication for single-user mode
  req.user = { id: 1, username: 'المشرف الصحي', role: 'Admin' };
  next();
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
