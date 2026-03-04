import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Replace these with your actual Firebase project config
// You can find this in: Firebase Console → Project Settings → General → Your apps → Web app
const firebaseConfig = {
  apiKey: 'AIzaSyCqqQWXk5wZXN_7TpCXaRjIRPKtPIpG2KI',
  authDomain: 'auctionplat-58ded.firebaseapp.com',
  projectId: 'auctionplat-58ded',
  storageBucket: 'auctionplat-58ded.firebasestorage.app',
  messagingSenderId: '1076427604470',
  appId: '1:1076427604470:android:4004287d509aaaffde47d7',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
