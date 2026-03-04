import { auth } from '@/config/firebase';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host localhost
const BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api'
    : 'http://localhost:3000/api';

// ── Firebase Auth helpers ───────────────────────────

/** Get the current Firebase ID token (auto-refreshed). */
const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
};

const headers = async (): Promise<Record<string, string>> => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = await getIdToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

export interface AuctionBid {
  id: string;
  bidderId: string;
  amount: number;
  createdAt: string;
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  sellerId: string;
  bids: AuctionBid[];
  endsAt: string;
  createdAt: string;
}

export interface CreateAuctionPayload {
  title: string;
  description: string;
  startingPrice: number;
  durationHours: number;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role: 'buyer' | 'seller';
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

// ── Auth ────────────────────────────────────────────

/**
 * Login via Firebase Auth (client-side).
 * After sign-in, the ID token is automatically available via `auth.currentUser`.
 */
export async function login(payload: { email: string; password: string }): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, payload.email, payload.password);
  // Fetch profile from server (which has the role)
  return fetchMe();
}

/**
 * Register: creates the Firebase Auth user client-side, then calls the server
 * to store the role in Firestore and set custom claims.
 */
export async function register(payload: RegisterPayload): Promise<UserProfile> {
  // 1. Create user in Firebase Auth on the server (stores role in Firestore)
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Registration failed');
  }

  // 2. Sign in client-side to get the Firebase ID token
  await signInWithEmailAndPassword(auth, payload.email, payload.password);
  const data = await res.json();
  return data.user;
}

/** Fetch current user profile from the server. */
export async function fetchMe(): Promise<UserProfile> {
  const res = await fetch(`${BASE_URL}/auth/me`, { headers: await headers() });
  if (!res.ok) throw new Error('Could not fetch user profile');
  const data = await res.json();
  return data.user;
}

/** Sign out of Firebase Auth. */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/** Subscribe to Firebase auth state changes. */
export function onAuthChanged(cb: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, cb);
}

// ── Auctions ────────────────────────────────────────

export async function fetchAuctions(): Promise<Auction[]> {
  const res = await fetch(`${BASE_URL}/auctions`, { headers: await headers() });
  if (!res.ok) throw new Error('Failed to fetch auctions');
  const data = await res.json();
  return data.auctions;
}

export async function fetchAuction(id: string): Promise<Auction> {
  const res = await fetch(`${BASE_URL}/auctions/auction/${id}`, { headers: await headers() });
  if (!res.ok) throw new Error('Failed to fetch auction');
  const data = await res.json();
  return data.auction;
}

export async function createAuction(payload: CreateAuctionPayload): Promise<Auction> {
  const res = await fetch(`${BASE_URL}/auctions/auction/`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Failed to create auction');
  }
  const data = await res.json();
  return data.auction;
}

export async function placeBid(auctionId: string, amount: number): Promise<Auction> {
  const res = await fetch(`${BASE_URL}/auctions/auction/${auctionId}/bid`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Failed to place bid');
  }
  const data = await res.json();
  return data.auction;
}
