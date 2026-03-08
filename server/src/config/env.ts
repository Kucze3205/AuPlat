import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
  /** Optional: JSON-stringified Firebase service account key for production */
  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT ?? '',
};
