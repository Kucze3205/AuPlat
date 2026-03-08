import dotenv from 'dotenv';

// Cloud Run/App Hosting provides environment variables directly.
// Load .env only for local development.
if (!process.env.K_SERVICE) {
  dotenv.config();
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
  /** Optional: JSON-stringified Firebase service account key for production */
  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT ?? '',
};
