import express from 'express';
import fs from 'fs';
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
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');

app.use(express.json());
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

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

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  const indexPath = path.join(frontendDistPath, 'index.html');

  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  return res.status(200).send('React frontend is not built yet. Run "npm run frontend:dev" or "npm run frontend:build".');
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
