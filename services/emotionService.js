import { getDb } from './databaseService.js';
import { classifyEmotionCategory } from './geminiService.js';

export async function createEmotionLog({ userId, emotion, note, intensity, tags, loggedAt }) {
  const db = await getDb();
  const emotionCategory = await getEmotionCategorySafely({ emotion, note, tags });
  const [result] = await db.execute(
    `
      INSERT INTO emotion_logs (user_id, emotion, emotion_category, note, intensity, tags, logged_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      emotion,
      emotionCategory,
      note,
      intensity ?? null,
      tags ? JSON.stringify(tags) : null,
      loggedAt ?? new Date(),
    ],
  );

  return getEmotionLogById({ id: result.insertId, userId });
}

export async function getEmotionLogs({ userId, limit = 20 }) {
  const db = await getDb();
  const parsedLimit = Number(limit);
  const safeLimit = Number.isNaN(parsedLimit) ? 20 : Math.min(Math.max(parsedLimit, 1), 100);
  const [rows] = await db.query(
    `
      SELECT id, user_id, emotion, emotion_category, note, intensity, tags, ai_summary, ai_summary_created_at, logged_at, created_at, updated_at
      FROM emotion_logs
      WHERE user_id = ${Number(userId)}
      ORDER BY logged_at DESC
      LIMIT ${safeLimit}
    `,
  );

  return rows.map(normalizeEmotionRow);
}

export async function getEmotionLogById({ id, userId }) {
  const db = await getDb();
  const [rows] = await db.execute(
    `
      SELECT id, user_id, emotion, emotion_category, note, intensity, tags, ai_summary, ai_summary_created_at, logged_at, created_at, updated_at
      FROM emotion_logs
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
    [id, userId],
  );

  return rows[0] ? normalizeEmotionRow(rows[0]) : null;
}

export async function saveEmotionSummary({ id, userId, summary }) {
  const db = await getDb();

  await db.execute(
    `
      UPDATE emotion_logs
      SET ai_summary = ?, ai_summary_created_at = NOW()
      WHERE id = ? AND user_id = ?
    `,
    [summary, id, userId],
  );

  return getEmotionLogById({ id, userId });
}

export async function getTodayEmotionLogs(userId) {
  const db = await getDb();
  const [rows] = await db.execute(
    `
      SELECT id, emotion, emotion_category, note, intensity, tags, logged_at
      FROM emotion_logs
      WHERE user_id = ?
        AND DATE(logged_at) = CURDATE()
      ORDER BY logged_at ASC
    `,
    [userId],
  );

  return rows.map(normalizeEmotionRow);
}

export async function backfillEmotionCategories({ userId, limit = 20 }) {
  const db = await getDb();
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const [rows] = await db.query(
    `
      SELECT id, emotion, note, tags
      FROM emotion_logs
      WHERE user_id = ${Number(userId)}
        AND (emotion_category IS NULL OR emotion_category = '')
      ORDER BY id ASC
      LIMIT ${safeLimit}
    `,
  );

  for (const row of rows) {
    const category = await getEmotionCategorySafely({
      emotion: row.emotion,
      note: row.note,
      tags: parseJson(row.tags),
    });

    await db.execute(
      `
        UPDATE emotion_logs
        SET emotion_category = ?
        WHERE id = ? AND user_id = ?
      `,
      [category, row.id, userId],
    );
  }
}

async function getEmotionCategorySafely({ emotion, note, tags }) {
  try {
    return await classifyEmotionCategory({ emotion, note, tags });
  } catch {
    return '기타';
  }
}

function normalizeEmotionRow(row) {
  return {
    ...row,
    tags: parseJson(row.tags),
    emotion_category: row.emotion_category || '기타',
  };
}

function parseJson(value) {
  if (!value) {
    return [];
  }

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}
