import { NextFunction, Request, Response } from 'express';
import { adminAuth, db } from '../config/firebase.js';
import { HttpError } from '../middleware/error-handler.js';
import { registerSchema } from '../schemas/auth.js';
import { UserRole } from '../types/index.js';

/**
 * Register — creates a Firebase Auth user and stores the role in Firestore.
 * The client should then call Firebase signInWithEmailAndPassword to get the ID token.
 * But for convenience we also return a custom token the client can exchange.
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    // Create the Firebase Auth user
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.createUser({
        email: data.email,
        password: data.password,
      });
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        throw new HttpError(409, 'Email already registered');
      }
      throw err;
    }

    const role: UserRole = data.role;

    // Store role & profile in Firestore
    await db.collection('users').doc(firebaseUser.uid).set({
      email: data.email,
      role,
      createdAt: new Date().toISOString(),
    });

    // Set custom claims so the role is also in the token (optional)
    await adminAuth.setCustomUserClaims(firebaseUser.uid, { role });

    return res.status(201).json({
      user: {
        id: firebaseUser.uid,
        email: data.email,
        role,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile (called after Firebase client-side login).
 * The client sends the Firebase ID token; the requireAuth middleware
 * already verified it and populated req.user.
 */
export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }
    const userDoc = await db.collection('users').doc(req.user.userId).get();
    if (!userDoc.exists) {
      throw new HttpError(404, 'User profile not found');
    }
    return res.json({
      user: {
        id: req.user.userId,
        ...userDoc.data(),
      },
    });
  } catch (error) {
    next(error);
  }
};
