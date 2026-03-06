import { Router } from 'express';
import { createAuction, getAuction, listAuctions, myAuctions, placeBid, updateAuction } from '../controllers/auction-controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', listAuctions);
router.get('/my', requireAuth, myAuctions);
router.get('/auction/:id', getAuction);
router.post('/auction/', requireAuth, createAuction);
router.put('/auction/:id', requireAuth, updateAuction);
router.post('/auction/:id/bid', requireAuth, placeBid);

export default router;
