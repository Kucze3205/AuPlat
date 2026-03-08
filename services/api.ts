import { auth, storage } from '@/config/firebase';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Platform } from 'react-native';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const DEFAULT_DEPLOYED_API_URL = 'https://auction-plat-backend--auctionplat-58ded.us-central1.hosted.app';

const withApiSuffix = (url: string): string => {
  const withoutTrailingSlash = url.replace(/\/+$/, '');
  return withoutTrailingSlash.endsWith('/api')
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
};

// Prefer explicit env config. Fallback to deployed backend for reliability
// on real devices and when Expo does not pick up local env changes yet.
const BASE_URL = withApiSuffix(configuredApiUrl ?? DEFAULT_DEPLOYED_API_URL);

// ── Error helpers ───────────────────────────────────

/** Map Firebase Auth error codes to user-friendly messages. */
const firebaseErrorMessage = (code: string): string => {
  const map: Record<string, string> = {
    'auth/invalid-email': 'The email address is not valid.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/unauthorized-domain': 'This domain is not authorized for Firebase Auth. Add your hosting domain in Firebase Auth settings.',
    'auth/popup-blocked': 'Popup was blocked by the browser. Allow popups and try again.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed before completing login.',
    'auth/cancelled-popup-request': 'Another sign-in popup is already open.',
  };
  return map[code] ?? `Authentication error (${code}).`;
};

/** Parse any error into a user-friendly message string. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof TypeError && error.message === 'Network request failed') {
    return `Cannot reach the server at ${BASE_URL}.`;
  }
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    if (code.startsWith('auth/')) {
      return firebaseErrorMessage(code);
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Format an API error response into a readable message.
 * If the response contains field-level validation errors (from Zod),
 * they are included as bullet points.
 */
function formatApiError(body: { message?: string; errors?: { path: string; message: string }[] }, fallback: string): string {
  const msg = body.message ?? fallback;
  if (body.errors && body.errors.length > 0) {
    const details = body.errors.map((e) => `• ${e.path}: ${e.message}`).join('\n');
    return `${msg}\n\n${details}`;
  }
  return msg;
}

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
  imageUrl?: string;
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
  imageUrl?: string;
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
  profilePicture?: string;
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

/**
 * Ensure the backend profile exists after Google/Firebase social sign-in.
 */
export async function syncGoogleProfile(role?: 'buyer' | 'seller'): Promise<UserProfile> {
  const res = await fetch(`${BASE_URL}/auth/google-login`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify(role ? { role } : {}),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Google login failed');
  }
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

/** Upload a profile picture to Firebase Storage and save the URL to the server. */
export async function uploadProfilePicture(uri: string): Promise<UserProfile> {
  const downloadUrl = await uploadToStorage(uri, 'profiles');

  const res = await fetch(`${BASE_URL}/auth/me/profile-picture`, {
    method: 'PUT',
    headers: await headers(),
    body: JSON.stringify({ profilePicture: downloadUrl }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Failed to update profile picture');
  }
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

// ── Uploads ─────────────────────────────────────────

async function uriToBlob(uri: string): Promise<Blob> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return response.blob();
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('Failed to load image'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

async function uploadToStorage(uri: string, folder: string): Promise<string> {
  const blob = await uriToBlob(uri);
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

// ── Auctions ────────────────────────────────────────

export async function uploadAuctionImage(uri: string): Promise<string> {
  return uploadToStorage(uri, 'auctions');
}

export async function fetchMyAuctions(): Promise<{ selling: Auction[]; bidding: Auction[] }> {
  const res = await fetch(`${BASE_URL}/auctions/my`, { headers: await headers() });
  if (!res.ok) throw new Error('Failed to fetch your auctions');
  return res.json();
}

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
    throw new Error(formatApiError(err, 'Failed to create auction'));
  }
  const data = await res.json();
  return data.auction;
}

export interface UpdateAuctionPayload {
  title?: string;
  description?: string;
  imageUrl?: string;
}

export async function updateAuction(id: string, payload: UpdateAuctionPayload): Promise<Auction> {
  const res = await fetch(`${BASE_URL}/auctions/auction/${id}`, {
    method: 'PUT',
    headers: await headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(formatApiError(err, 'Failed to update auction'));
  }
  const data = await res.json();
  return data.auction;
}

export async function deleteAuction(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auctions/auction/${id}`, {
    method: 'DELETE',
    headers: await headers(),
  });

  if (!res.ok) {
    let err: { message?: string; errors?: { path: string; message: string }[] } | null = null;
    try {
      err = await res.json();
    } catch {
      err = null;
    }
    throw new Error(formatApiError(err ?? {}, 'Failed to delete auction'));
  }
}

export async function placeBid(auctionId: string, amount: number): Promise<Auction> {
  const res = await fetch(`${BASE_URL}/auctions/auction/${auctionId}/bid`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(formatApiError(err, 'Failed to place bid'));
  }
  const data = await res.json();
  return data.auction;
}
