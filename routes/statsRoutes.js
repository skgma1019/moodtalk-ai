import { Router } from 'express';
import { getDashboardStats } from '../controllers/statsController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', getDashboardStats);

export default router;
