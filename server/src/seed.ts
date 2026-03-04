/**
 * Seed script – adds test auctions to Firestore.
 * Run with:  node --loader ts-node/esm src/seed.ts
 */
import { v4 as uuid } from 'uuid';
import { db } from './config/firebase.js';

const auctionsCol = db.collection('auctions');

interface SeedAuction {
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  sellerId: string;
  bids: never[];
  createdAt: string;
  endsAt: string;
}

const now = Date.now();
const hour = 60 * 60 * 1000;

const testAuctions: SeedAuction[] = [
  {
    title: 'Vintage Mechanical Keyboard',
    description: 'A fully restored IBM Model M keyboard from 1989. Buckling spring switches, original keycaps, cleaned and tested.',
    startingPrice: 120,
    currentPrice: 120,
    sellerId: 'seed-seller-1',
    bids: [],
    createdAt: new Date(now).toISOString(),
    endsAt: new Date(now + 48 * hour).toISOString(),
  },
  {
    title: 'Signed First-Edition Novel',
    description: 'First-edition hardcover of "The Name of the Wind" by Patrick Rothfuss, signed by the author. Excellent condition with dust jacket.',
    startingPrice: 250,
    currentPrice: 250,
    sellerId: 'seed-seller-1',
    bids: [],
    createdAt: new Date(now - 1 * hour).toISOString(),
    endsAt: new Date(now + 72 * hour).toISOString(),
  },
  {
    title: 'Professional DSLR Camera Bundle',
    description: 'Canon EOS 5D Mark IV body with 24-70mm f/2.8L lens, two batteries, charger, and carrying case. Low shutter count.',
    startingPrice: 1500,
    currentPrice: 1500,
    sellerId: 'seed-seller-2',
    bids: [],
    createdAt: new Date(now - 2 * hour).toISOString(),
    endsAt: new Date(now + 96 * hour).toISOString(),
  },
  {
    title: 'Handmade Leather Messenger Bag',
    description: 'Full-grain Italian leather messenger bag, hand-stitched with brass hardware. Fits a 15-inch laptop. Brand new.',
    startingPrice: 180,
    currentPrice: 180,
    sellerId: 'seed-seller-2',
    bids: [],
    createdAt: new Date(now - 3 * hour).toISOString(),
    endsAt: new Date(now + 24 * hour).toISOString(),
  },
  {
    title: 'Antique Pocket Watch',
    description: 'Gold-plated Elgin pocket watch from 1920. Fully working mechanical movement, recently serviced. Includes original chain.',
    startingPrice: 350,
    currentPrice: 350,
    sellerId: 'seed-seller-1',
    bids: [],
    createdAt: new Date(now - 4 * hour).toISOString(),
    endsAt: new Date(now + 120 * hour).toISOString(),
  },
  {
    title: 'Gaming PC – RTX 4070 Ti Build',
    description: 'Custom gaming desktop: Ryzen 7 7800X3D, RTX 4070 Ti, 32 GB DDR5, 1 TB NVMe SSD, 750 W PSU, NZXT H5 case.',
    startingPrice: 1100,
    currentPrice: 1100,
    sellerId: 'seed-seller-2',
    bids: [],
    createdAt: new Date(now - 5 * hour).toISOString(),
    endsAt: new Date(now + 168 * hour).toISOString(),
  },
];

async function seed() {
  console.log(`Seeding ${testAuctions.length} test auctions …`);

  const batch = db.batch();

  for (const auction of testAuctions) {
    const id = uuid();
    batch.set(auctionsCol.doc(id), auction);
    console.log(`  + ${auction.title}  (${id})`);
  }

  await batch.commit();
  console.log('Done – all test auctions written to Firestore.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
