import { backfillEmotionCategories } from '../services/emotionService.js';
import { getCategoryStats, getDailyTrendStats, getEmotionFrequencyStats } from '../services/statsService.js';

export async function getDashboardStats(req, res, next) {
  try {
    const frequencyDays = req.query.frequencyDays ?? 30;
    const trendDays = req.query.trendDays ?? 7;

    await backfillEmotionCategories({
      userId: req.user.id,
    });

    const [frequency, trend, categories] = await Promise.all([
      getEmotionFrequencyStats({ userId: req.user.id, days: frequencyDays }),
      getDailyTrendStats({ userId: req.user.id, days: trendDays }),
      getCategoryStats({ userId: req.user.id, days: frequencyDays }),
    ]);

    return res.json({
      frequency,
      trend,
      categories,
    });
  } catch (error) {
    return next(error);
  }
}
