import { Router } from 'express';
import multer from 'multer';
import { analyzeSpeechEntry, summarizeEmotionLog, summarizeToday, transcribeAudio } from '../controllers/aiController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);
router.post('/transcribe-audio', upload.single('audio'), transcribeAudio);
router.post('/analyze-entry', analyzeSpeechEntry);
router.post('/summary', summarizeEmotionLog);
router.get('/today-summary', summarizeToday);

export default router;
