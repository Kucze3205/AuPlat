# AuctionPlat

AuctionPlat is a full-stack auction app built with Expo (React Native + web) and an Express/Firebase backend. Users can register as buyers or sellers, create auctions, place bids, and manage their own listings.

## Stack

- Client: Expo 54, React Native 0.81, Expo Router, TypeScript
- Backend: Express 5, TypeScript, Zod
- Auth: Firebase Authentication (ID tokens)
- Data: Firestore (Firebase Admin SDK)
- Hosting (frontend): Firebase Hosting
- Hosting (backend): Firebase App Hosting

## Monorepo Layout

```text
AuctionPlat/
	app/                 Expo Router screens
	components/          Reusable UI components/modals/cards
	hooks/               Client hooks (auth, cart, search, theme)
	services/api.ts      Client API layer
	config/firebase.ts   Client Firebase SDK setup
	server/
		src/
			index.ts         Express entry point
			routes/          API routes (/api/auth, /api/auctions)
			controllers/     Route handlers
			middleware/      Auth + error handling
			schemas/         Zod validation
			config/env.ts    Environment parsing
```

## Prerequisites

- Node.js 18+
- npm
- Firebase project with Auth + Firestore enabled
- Service account credentials for backend/local server use

## Setup

1. Install dependencies.

```bash
npm install
cd server && npm install
```

2. Create `server/.env` for local backend development.

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=dev-jwt-secret-change-me
# Optional in cloud: local helper for Admin SDK
FIREBASE_SERVICE_ACCOUNT=
```

3. Create root `.env` for client config.

```env
EXPO_PUBLIC_API_URL=https://auction-plat-backend--auctionplat-58ded.us-central1.hosted.app
```

Notes:
- If `EXPO_PUBLIC_API_URL` is omitted, `services/api.ts` falls back to the deployed backend URL.
- In local backend runs, `dotenv` is loaded unless `K_SERVICE` is set (cloud runtime).

## Run Locally

1. Start backend (terminal 1).

```bash
cd server
npm run dev
```

2. Start Expo app (terminal 2, project root).

```bash
npm start
```

Useful Expo shortcuts:
- `a`: Android emulator
- `i`: iOS simulator (macOS)
- `w`: web

## Scripts

### Root scripts

- `npm start`: Expo dev server
- `npm run android`: Open Android dev target
- `npm run ios`: Open iOS dev target
- `npm run web`: Start Expo web
- `npm run lint`: Run Expo lint
- `npm run build:web`: Export static web app to `dist/`
- `npm run deploy:web`: Build and deploy frontend to Firebase Hosting

### Server scripts (`server/`)

- `npm run dev`: Run API in watch mode (`ts-node/esm`)
- `npm run build`: Compile TypeScript to `server/dist`
- `npm start`: Start compiled server (`dist/index.js`)
- `npm run seed`: Seed script
- `npm run lint`: Type-check (`tsc --noEmit`)

## API Overview

Base path: `/api`

Health check:
- `GET /health`

Auth routes:
- `POST /api/auth/register`
- `POST /api/auth/google-login` (requires Bearer token)
- `GET /api/auth/me` (requires Bearer token)
- `PUT /api/auth/me/profile-picture` (requires Bearer token)

Auction routes:
- `GET /api/auctions`
- `GET /api/auctions/my` (requires Bearer token)
- `GET /api/auctions/auction/:id`
- `POST /api/auctions/auction/` (requires Bearer token)
- `PUT /api/auctions/auction/:id` (requires Bearer token)
- `DELETE /api/auctions/auction/:id` (requires Bearer token)
- `POST /api/auctions/auction/:id/bid` (requires Bearer token)

## Deployment

Frontend (Firebase Hosting):

```bash
npm run deploy:web
```

Backend (Firebase App Hosting):

1. Build backend first.

```bash
cd server
npm run build
```

2. Ensure required App Hosting secrets/env are set, especially `JWT_SECRET`.

3. Create rollout (from repo root, example backend id):

```bash
firebase apphosting:rollouts:create auction-plat-backend --project auctionplat-58ded
```

`server/apphosting.yaml` runs:

```yaml
scripts:
	runCommand: node dist/index.js
```

## Security: Service Account Credential Rotation

If a service account key is leaked or disabled, rotate immediately.

1. Re-enable or recreate the service account (in Cloud Console or Cloud Shell).
2. Create a new key.
3. Update runtime secret/env to use the new key.
4. Delete old keys.
5. Remove old key files from git tracking and add ignore rules.

Example commands (Cloud Shell with `gcloud`):

```bash
PROJECT_ID=auctionplat-58ded
SA_EMAIL=firebase-adminsdk-fbsvc@auctionplat-58ded.iam.gserviceaccount.com

# optional: if the service account is disabled
gcloud iam service-accounts enable "$SA_EMAIL" --project "$PROJECT_ID"

# create a replacement key
gcloud iam service-accounts keys create ./new-service-account.json \
	--iam-account "$SA_EMAIL" \
	--project "$PROJECT_ID"

# list keys and delete old/compromised key(s)
gcloud iam service-accounts keys list \
	--iam-account "$SA_EMAIL" \
	--project "$PROJECT_ID"

gcloud iam service-accounts keys delete OLD_KEY_ID \
	--iam-account "$SA_EMAIL" \
	--project "$PROJECT_ID" --quiet
```

Recommended: use App Hosting runtime identity (ADC) in production and avoid storing JSON key files in the repository.

## License

MIT
