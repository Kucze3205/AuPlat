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
  imageUrl?: string;
  startingPrice: number;
  currentPrice: number;
  sellerId: string;
  bids: never[];
  createdAt: string;
  endsAt: string;
}

const now = Date.now();
const hour = 60 * 60 * 1000;

const image = (seed: string) => `https://picsum.photos/seed/${seed}/1200/800`;

const testAuctions: SeedAuction[] = [
  {
    title: 'Vintage Mechanical Keyboard',
    description: 'A fully restored IBM Model M keyboard from 1989. Buckling spring switches, original keycaps, cleaned and tested.',
    imageUrl: image('ibm-model-m-keyboard'),
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
    imageUrl: image('signed-first-edition-book'),
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
    imageUrl: image('canon-dslr-bundle'),
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
    imageUrl: image('leather-messenger-bag'),
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
    imageUrl: image('antique-pocket-watch'),
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
    imageUrl: image('gaming-pc-rtx-build'),
    startingPrice: 1100,
    currentPrice: 1100,
    sellerId: 'seed-seller-2',
    bids: [],
    createdAt: new Date(now - 5 * hour).toISOString(),
    endsAt: new Date(now + 168 * hour).toISOString(),
  },
  {
    title: 'DJI Mini Drone Combo',
    description: 'DJI Mini 3 combo with controller, three batteries, carrying case, and ND filter kit. Great condition and fully tested.',
    imageUrl: image('dji-mini-drone-combo'),
    startingPrice: 520,
    currentPrice: 520,
    sellerId: 'seed-seller-2',
    bids: [],
    createdAt: new Date(now - 6 * hour).toISOString(),
    endsAt: new Date(now + 96 * hour).toISOString(),
  },
  {
    title: 'Acoustic Guitar - Solid Spruce Top',
    description: 'Beautiful dreadnought acoustic guitar with solid spruce top and mahogany back and sides. Includes hard shell case.',
    imageUrl: image('acoustic-guitar-spruce'),
    startingPrice: 390,
    currentPrice: 390,
    sellerId: 'seed-seller-1',
    bids: [],
    createdAt: new Date(now - 7 * hour).toISOString(),
    endsAt: new Date(now + 60 * hour).toISOString(),
  },
  {
    title: 'Espresso Machine with Grinder',
    description: 'Semi-automatic espresso machine paired with a burr grinder. Freshly descaled, cleaned, and ready to pull shots.',
    imageUrl: image('espresso-machine-grinder'),
    startingPrice: 640,
    currentPrice: 640,
    sellerId: 'seed-seller-2',
    bids: [],
    createdAt: new Date(now - 8 * hour).toISOString(),
    endsAt: new Date(now + 84 * hour).toISOString(),
  },
  {
    title: 'LEGO UCS Starship Display Set',
    description: 'Collector-grade UCS style starship display set, complete with box, manuals, and spare parts. Adult-owned, smoke-free home.',
    imageUrl: image('lego-ucs-starship-set'),
    startingPrice: 330,
    currentPrice: 330,
    sellerId: 'seed-seller-1',
    bids: [],
    createdAt: new Date(now - 9 * hour).toISOString(),
    endsAt: new Date(now + 132 * hour).toISOString(),
  },
  {
    title: 'Road Bike - Carbon Frame',
    description: 'Lightweight carbon road bike with Shimano 105 groupset, 54 cm frame, and recently serviced drivetrain. Ready to ride.',
    imageUrl: image('carbon-road-bike'),
    startingPrice: 980,
    currentPrice: 980,
    sellerId: 'seed-seller-2',
    bids: [],
    createdAt: new Date(now - 10 * hour).toISOString(),
    endsAt: new Date(now + 110 * hour).toISOString(),
  },
  {
    title: 'High-End Office Chair',
    description: 'Ergonomic office chair with fully adjustable lumbar support, 4D armrests, and mesh back. Excellent working condition.',
    imageUrl: image('ergonomic-office-chair'),
    startingPrice: 310,
    currentPrice: 310,
    sellerId: 'seed-seller-1',
    bids: [],
    createdAt: new Date(now - 11 * hour).toISOString(),
    endsAt: new Date(now + 50 * hour).toISOString(),
  },
  {
    title: 'Rare Vinyl Collection (25 LPs)',
    description: 'Curated bundle of 25 classic rock and jazz LPs. Records stored upright and cleaned. Includes protective inner sleeves.',
    imageUrl: image('rare-vinyl-collection'),
    startingPrice: 270,
    currentPrice: 270,
    sellerId: 'seed-seller-2',
    bids: [],
    createdAt: new Date(now - 12 * hour).toISOString(),
    endsAt: new Date(now + 76 * hour).toISOString(),
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
