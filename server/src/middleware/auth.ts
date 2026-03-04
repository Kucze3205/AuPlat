import { NextFunction, Request, Response } from 'express';
import { adminAuth, db } from '../config/firebase.js';
import { AuthTokenPayload, UserRole } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    const idToken = header.slice(7);
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Fetch the user's role from Firestore
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const role: UserRole = (userDoc.data()?.role as UserRole) ?? 'buyer';

    req.user = { userId: decoded.uid, role };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
