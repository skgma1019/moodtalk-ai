import { Router } from 'express';
import { createEmotion, getEmotion, listEmotions } from '../controllers/emotionController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', listEmotions);
router.get('/:id', getEmotion);
router.post('/', createEmotion);

export default router;
