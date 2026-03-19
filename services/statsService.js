import { getDb } from './databaseService.js';

export async function getEmotionFrequencyStats({ userId, days = 30 } = {}) {
  const db = await getDb();
  const safeDays = normalizeDays(days);
  const [rows] = await db.query(
    `
      SELECT emotion, COUNT(*) AS count
      FROM emotion_logs
      WHERE user_id = ${Number(userId)}
        AND logged_at >= DATE_SUB(NOW(), INTERVAL ${safeDays} DAY)
      GROUP BY emotion
      ORDER BY count DESC, emotion ASC
    `,
  );

  const total = rows.reduce((sum, row) => sum + Number(row.count), 0);

  return rows.map((row) => ({
    emotion: row.emotion,
    count: Number(row.count),
    percentage: total === 0 ? 0 : Number(((Number(row.count) / total) * 100).toFixed(1)),
  }));
}

export async function getDailyTrendStats({ userId, days = 7 } = {}) {
  const db = await getDb();
  const safeDays = normalizeDays(days, 7, 1, 90);
  const [rows] = await db.query(
    `
      SELECT
        DATE(logged_at) AS date,
        COUNT(*) AS count,
        ROUND(AVG(COALESCE(intensity, 0)), 1) AS averageIntensity
      FROM emotion_logs
      WHERE user_id = ${Number(userId)}
        AND logged_at >= DATE_SUB(CURDATE(), INTERVAL ${safeDays - 1} DAY)
      GROUP BY DATE(logged_at)
      ORDER BY DATE(logged_at) ASC
    `,
  );

  return fillMissingDates(rows, safeDays);
}

export async function getCategoryStats({ userId, days = 30 } = {}) {
  const db = await getDb();
  const safeDays = normalizeDays(days);
  const [rows] = await db.query(
    `
      SELECT
        COALESCE(emotion_category, '기타') AS category,
        COUNT(*) AS count,
        GROUP_CONCAT(DISTINCT emotion ORDER BY emotion SEPARATOR '|||') AS emotions
      FROM emotion_logs
      WHERE user_id = ${Number(userId)}
        AND logged_at >= DATE_SUB(NOW(), INTERVAL ${safeDays} DAY)
      GROUP BY COALESCE(emotion_category, '기타')
      ORDER BY count DESC, category ASC
    `,
  );

  const total = rows.reduce((sum, row) => sum + Number(row.count), 0);

  return rows.map((row) => ({
    category: row.category,
    count: Number(row.count),
    percentage: total === 0 ? 0 : Number(((Number(row.count) / total) * 100).toFixed(1)),
    emotions: row.emotions ? row.emotions.split('|||') : [],
  }));
}

function normalizeDays(value, fallback = 30, min = 1, max = 365) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(Math.floor(parsed), min), max);
}

function fillMissingDates(rows, days) {
  const byDate = new Map(
    rows.map((row) => [
      formatDateKey(row.date),
      {
        date: formatDateKey(row.date),
        count: Number(row.count),
        averageIntensity: Number(row.averageIntensity),
      },
    ]),
  );

  const result = [];
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  current.setDate(current.getDate() - (days - 1));

  for (let i = 0; i < days; i += 1) {
    const key = formatDateKey(current);
    result.push(
      byDate.get(key) ?? {
        date: key,
        count: 0,
        averageIntensity: 0,
      },
    );

    current.setDate(current.getDate() + 1);
  }

  return result;
}

function formatDateKey(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
