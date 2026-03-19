import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import emotionRoutes from './routes/emotionRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({
    message: 'MoodTalk AI server is running.',
    timestamp: new Date().toISOString(),
  });
});

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.use('/api/auth', authRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stats', statsRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
