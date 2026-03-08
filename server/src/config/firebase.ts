import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, readFileSync } from 'fs';
import { env } from './env.js';

const PROJECT_ID = 'auctionplat-58ded';

if (getApps().length === 0) {
  if (env.firebaseServiceAccount) {
    // Production: use service account JSON string from env
    const serviceAccount = JSON.parse(env.firebaseServiceAccount);
    initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID });
  } else if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  ) {
    // Development: load key file from GOOGLE_APPLICATION_CREDENTIALS path
    const serviceAccount = JSON.parse(
      readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf-8'),
    );
    initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID });
  } else {
    // Fallback for Cloud Run/App Hosting ADC or local runs without key file
    initializeApp({ projectId: PROJECT_ID });
  }
}

export const adminAuth = getAuth();
export const db = getFirestore();
