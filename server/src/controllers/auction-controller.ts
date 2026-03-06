import { NextFunction, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../config/firebase.js';
import { HttpError } from '../middleware/error-handler.js';
import { createAuctionSchema, placeBidSchema, updateAuctionSchema } from '../schemas/auction.js';

const auctionsCol = db.collection('auctions');

const ensureAuction = async (id: string) => {
  const doc = await auctionsCol.doc(id).get();
  if (!doc.exists) {
    throw new HttpError(404, 'Auction not found');
  }
  return { id: doc.id, ...doc.data() };
};

export const listAuctions = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const snapshot = await auctionsCol.orderBy('createdAt', 'desc').get();
    const auctions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json({ auctions });
  } catch (error) {
    next(error);
  }
};

export const getAuction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.params.id) {
      throw new HttpError(400, 'Auction id is required');
    }
    const auction = await ensureAuction(req.params.id as string);
    return res.json({ auction });
  } catch (error) {
    next(error);
  }
};

export const createAuction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }
    if (req.user.role !== 'seller') {
      throw new HttpError(403, 'Only sellers can create auctions');
    }

    const data = createAuctionSchema.parse(req.body);
    const now = new Date();
    const id = uuid();

    const auction: Record<string, any> = {
      title: data.title,
      description: data.description,
      startingPrice: data.startingPrice,
      currentPrice: data.startingPrice,
      sellerId: req.user.userId,
      bids: [],
      createdAt: now.toISOString(),
      endsAt: new Date(now.getTime() + data.durationHours * 60 * 60 * 1000).toISOString(),
    };

    if (data.imageUrl) {
      auction.imageUrl = data.imageUrl;
    }

    await auctionsCol.doc(id).set(auction);
    return res.status(201).json({ auction: { id, ...auction } });
  } catch (error) {
    next(error);
  }
};

export const updateAuction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }
    if (!req.params.id) {
      throw new HttpError(400, 'Auction id is required');
    }

    const auction = await ensureAuction(req.params.id as string);

    if ((auction as any).sellerId !== req.user.userId) {
      throw new HttpError(403, 'You can only edit your own auctions');
    }

    const data = updateAuctionSchema.parse(req.body);
    const updates: Record<string, any> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl;

    if (Object.keys(updates).length === 0) {
      return res.json({ auction });
    }

    await auctionsCol.doc(req.params.id as string).update(updates);
    return res.json({ auction: { ...auction, ...updates } });
  } catch (error) {
    next(error);
  }
};

export const myAuctions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }
    const userId = req.user.userId;

    // Auctions created by this user
    const sellingSnap = await auctionsCol.where('sellerId', '==', userId).get();
    const selling = sellingSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Auctions where this user has placed bids (check all auctions)
    const allSnap = await auctionsCol.orderBy('createdAt', 'desc').get();
    const bidding = allSnap.docs
      .filter((doc) => {
        const data = doc.data();
        return (data.bids ?? []).some((b: any) => b.bidderId === userId);
      })
      .map((doc) => ({ id: doc.id, ...doc.data() }));

    return res.json({ selling, bidding });
  } catch (error) {
    next(error);
  }
};

export const placeBid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }
    if (!req.params.id) {
      throw new HttpError(400, 'Auction id is required');
    }
    const data = placeBidSchema.parse(req.body);
    const auctionRef = auctionsCol.doc(req.params.id as string);

    // Run inside a transaction for concurrency safety
    const updatedAuction = await db.runTransaction(async (tx) => {
      const doc = await tx.get(auctionRef);
      if (!doc.exists) {
        throw new HttpError(404, 'Auction not found');
      }
      const auction = doc.data()!;

      if (auction.sellerId === req.user!.userId) {
        throw new HttpError(403, 'Sellers cannot bid on their auctions');
      }

      if (new Date(auction.endsAt).getTime() < Date.now()) {
        throw new HttpError(400, 'Auction has ended');
      }

      if (data.amount <= auction.currentPrice) {
        throw new HttpError(400, 'Bid must be higher than current price');
      }

      const newBid = {
        id: uuid(),
        bidderId: req.user!.userId,
        amount: data.amount,
        createdAt: new Date().toISOString(),
      };

      const bids = [...(auction.bids ?? []), newBid];

      tx.update(auctionRef, {
        currentPrice: data.amount,
        bids,
      });

      return { id: doc.id, ...auction, currentPrice: data.amount, bids };
    });

    return res.json({ auction: updatedAuction });
  } catch (error) {
    next(error);
  }
};
