import { Router } from 'express';
import { getMe, signIn, signUp } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/signup', signUp);
router.post('/login', signIn);
router.get('/me', requireAuth, getMe);

export default router;
