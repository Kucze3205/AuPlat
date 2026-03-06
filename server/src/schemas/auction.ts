import { z } from 'zod';

export const createAuctionSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  startingPrice: z.number().positive(),
  durationHours: z.number().int().min(1).max(240),
  imageUrl: z.string().url().optional(),
});

export const updateAuctionSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  imageUrl: z.string().url().optional(),
});

export const placeBidSchema = z.object({
  amount: z.number().positive(),
});
