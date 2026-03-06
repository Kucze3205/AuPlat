import { Router } from 'express';
import { googleLogin, me, register, updateProfilePicture } from '../controllers/auth-controller.js';
import { requireAuth } from '../middleware/auth.js';


const router = Router();

router.post('/register', register);
router.post('/google-login', requireAuth, googleLogin);
router.get('/me', requireAuth, me);
router.put('/me/profile-picture', requireAuth, updateProfilePicture);

export default router;
