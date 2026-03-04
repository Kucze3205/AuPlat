import { z } from 'zod';

export const createAuctionSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  startingPrice: z.number().positive(),
  durationHours: z.number().int().min(1).max(240),
});

export const placeBidSchema = z.object({
  amount: z.number().positive(),
});
