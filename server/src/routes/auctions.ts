import { Router } from 'express';
import { createAuction, getAuction, listAuctions, placeBid } from '../controllers/auction-controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', listAuctions);
router.get('/auction/:id', getAuction);
router.post('/auction/', requireAuth, createAuction);
router.post('/auction/:id/bid', requireAuth, placeBid);

export default router;
