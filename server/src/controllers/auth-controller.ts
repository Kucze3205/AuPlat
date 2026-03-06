import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { adminAuth, db } from '../config/firebase.js';
import { HttpError } from '../middleware/error-handler.js';
import { googleLoginSchema, registerSchema } from '../schemas/auth.js';
import { UserRole } from '../types/index.js';

const updateProfilePictureSchema = z.object({
  profilePicture: z.string().url(),
});

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

/**
 * Sync profile for Google/Firebase social login.
 * Requires a valid Firebase ID token and creates profile on first login.
 */
export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const data = googleLoginSchema.parse(req.body ?? {});
    const userId = req.user.userId;
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return res.json({
        user: {
          id: userId,
          ...userDoc.data(),
        },
      });
    }

    const firebaseUser = await adminAuth.getUser(userId);
    const role: UserRole = data.role ?? 'buyer';
    const createdAt = new Date().toISOString();

    await userRef.set({
      email: firebaseUser.email ?? '',
      role,
      createdAt,
    });

    await adminAuth.setCustomUserClaims(userId, { role });

    return res.status(201).json({
      user: {
        id: userId,
        email: firebaseUser.email ?? '',
        role,
        createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile picture URL.
 */
export const updateProfilePicture = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }
    const data = updateProfilePictureSchema.parse(req.body);
    const userRef = db.collection('users').doc(req.user.userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      throw new HttpError(404, 'User profile not found');
    }
    await userRef.update({ profilePicture: data.profilePicture });
    return res.json({
      user: {
        id: req.user.userId,
        ...userDoc.data(),
        profilePicture: data.profilePicture,
      },
    });
  } catch (error) {
    next(error);
  }
};
