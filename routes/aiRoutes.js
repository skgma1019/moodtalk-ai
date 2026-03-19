import { Router } from 'express';
import { summarizeEmotionLog, summarizeToday } from '../controllers/aiController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(requireAuth);
router.post('/summary', summarizeEmotionLog);
router.get('/today-summary', summarizeToday);

export default router;
