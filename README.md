# AuctionPlat

A full-stack auction platform with a **React Native** (Expo) mobile client and an **Express + Firebase** backend. Users can register as buyers or sellers, create timed auctions, and place bids in real time.

---

## Tech Stack

| Layer      | Technology                                          |
| ---------- | --------------------------------------------------- |
| Mobile App | React Native 0.81, Expo 54, Expo Router, TypeScript |
| Backend    | Express 5, TypeScript, Zod validation               |
| Auth       | Firebase Authentication (ID tokens + custom claims)  |
| Database   | Cloud Firestore (Firebase Admin SDK)                |

---

## Project Structure

```
├── app/                  # Expo Router screens (file-based routing)
│   ├── (tabs)/           # Tab navigation (Home, Auctions, Explore)
│   └── _layout.tsx       # Root layout
├── components/           # Reusable UI components
├── config/               # Client-side Firebase config
├── constants/            # Theme & design tokens
├── hooks/                # Custom React hooks
├── services/
│   └── api.ts            # API client – auth, auctions, bids
├── server/
│   └── src/
│       ├── index.ts      # Express entry point
│       ├── routes/       # /api/auth, /api/auctions
│       ├── controllers/  # Request handlers
│       ├── schemas/      # Zod request validation
│       ├── middleware/    # Firebase token auth, error handler
│       ├── config/       # env vars, Firebase Admin init
│       ├── data/         # In-memory data store
│       └── types/        # Shared TypeScript interfaces
└── assets/               # Images, icons, splash screen
```

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** (or yarn/pnpm)
- A **Firebase** project with Authentication and Firestore enabled
- Firebase Admin SDK service-account JSON file (placed at project root)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npx expo`)

---

## Getting Started

### 1. Clone & install

```bash
git clone <repo-url>
cd AuctionPlat

# Client dependencies
npm install

# Server dependencies
cd server
npm install
cd ..
```

### 2. Configure environment

Create `server/.env`:

```env
PORT=3000
NODE_ENV=development
# Optional – path or JSON string of your service-account key
FIREBASE_SERVICE_ACCOUNT=
```

Make sure your Firebase service-account JSON (`auctionplat-*-firebase-adminsdk-*.json`) is in the project root, or set the env variable above.

Create a root `.env` (for Expo client):

```env
# Use deployed backend in production/web builds.
# Local fallback remains localhost/10.0.2.2 if this is omitted.
EXPO_PUBLIC_API_URL=https://auction-plat-backend--auctionplat-58ded.us-central1.hosted.app
```

### 3. Start the server

```bash
cd server
npm run dev          # starts with ts-node in watch mode on port 3000
```

### 4. Start the mobile app

```bash
# From project root
npx expo start
```

Then open the app on:
- **Android emulator** — press `a`
- **iOS simulator** — press `i`
- **Expo Go** — scan the QR code

> The API client automatically resolves `localhost` vs `10.0.2.2` based on the platform.

---

## API Reference

All routes are prefixed with `/api`. Protected routes require a `Bearer <Firebase ID Token>` header.

### Auth

| Method | Endpoint         | Auth | Description                      |
| ------ | ---------------- | ---- | -------------------------------- |
| POST   | `/auth/register` | No   | Create account (buyer or seller) |
| GET    | `/auth/me`       | Yes  | Get current user profile         |

### Auctions

| Method | Endpoint                | Auth | Description                       |
| ------ | ----------------------- | ---- | --------------------------------- |
| GET    | `/auctions`             | No   | List all auctions (newest first)  |
| GET    | `/auctions/auction/:id` | No   | Get a single auction by ID        |
| POST   | `/auctions/auction/`    | Yes  | Create an auction (sellers only)  |
| POST   | `/auctions/auction/:id/bid` | Yes | Place a bid on an auction     |

### Health Check

```
GET /health  →  { "status": "ok", "timestamp": "..." }
```

---

## Data Models

### User

| Field       | Type                  |
| ----------- | --------------------- |
| id          | `string` (Firebase UID) |
| email       | `string`              |
| role        | `'buyer' \| 'seller'` |
| createdAt   | `string` (ISO 8601)   |

### Auction

| Field         | Type             |
| ------------- | ---------------- |
| id            | `string` (UUID)  |
| title         | `string`         |
| description   | `string`         |
| startingPrice | `number`         |
| currentPrice  | `number`         |
| sellerId      | `string`         |
| bids          | `AuctionBid[]`   |
| endsAt        | `string` (ISO)   |
| createdAt     | `string` (ISO)   |

### AuctionBid

| Field     | Type            |
| --------- | --------------- |
| id        | `string` (UUID) |
| bidderId  | `string`        |
| amount    | `number`        |
| createdAt | `string` (ISO)  |

---

## Available Scripts

### Client (project root)

| Script              | Description                        |
| ------------------- | ---------------------------------- |
| `npm start`         | Start Expo dev server              |
| `npm run android`   | Start on Android emulator          |
| `npm run ios`       | Start on iOS simulator             |
| `npm run web`       | Start in browser                   |
| `npm run build:web` | Export static web app to `dist/`   |
| `npm run deploy:web`| Build and deploy frontend hosting  |
| `npm run lint`      | Run ESLint                         |

### Server (`server/`)

| Script           | Description                            |
| ---------------- | -------------------------------------- |
| `npm run dev`    | Start in dev mode (ts-node + watch)    |
| `npm run build`  | Compile TypeScript to `dist/`          |
| `npm start`      | Run compiled JS from `dist/`           |
| `npm run seed`   | Seed Firestore with sample data        |
| `npm run lint`   | Type-check without emitting            |

---

## Deployment (Clean Split)

- Backend API: Firebase App Hosting (already configured in `server/`)
- Frontend web: Firebase Hosting (root `firebase.json`, deploys `dist/`)

Deploy frontend only:

```bash
npm run deploy:web
```

This does not redeploy your backend.

---

## License

MIT
