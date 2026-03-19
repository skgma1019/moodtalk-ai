import 'dotenv/config';
import app from './app.js';
import { initializeDatabase } from './services/databaseService.js';

const PORT = Number(process.env.PORT) || 3000;

export async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`MoodTalk AI server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server.');
    console.error(error);
    console.error(error.message);
    process.exit(1);
  }
}
