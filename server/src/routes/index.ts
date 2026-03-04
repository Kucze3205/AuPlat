import { Router } from 'express';
import auctionRoutes from './auctions.js';
import authRoutes from './auth.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/auctions', auctionRoutes);

export default router;
