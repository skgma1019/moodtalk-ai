import { createEmotionLog, getEmotionLogById, getEmotionLogs } from '../services/emotionService.js';

export async function createEmotion(req, res, next) {
  try {
    const { emotion, note, intensity, tags, loggedAt } = req.body;

    if (!emotion || !note) {
      return res.status(400).json({
        message: 'emotion과 note가 필요합니다.',
      });
    }

    if (intensity !== undefined && (Number(intensity) < 1 || Number(intensity) > 10)) {
      return res.status(400).json({
        message: 'intensity는 1에서 10 사이여야 합니다.',
      });
    }

    const created = await createEmotionLog({
      userId: req.user.id,
      emotion,
      note,
      intensity: intensity !== undefined ? Number(intensity) : null,
      tags: Array.isArray(tags) ? tags : [],
      loggedAt,
    });

    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
}

export async function listEmotions(req, res, next) {
  try {
    const emotions = await getEmotionLogs({
      userId: req.user.id,
      limit: req.query.limit,
    });

    return res.json(emotions);
  } catch (error) {
    return next(error);
  }
}

export async function getEmotion(req, res, next) {
  try {
    const emotion = await getEmotionLogById({
      id: req.params.id,
      userId: req.user.id,
    });

    if (!emotion) {
      return res.status(404).json({
        message: '감정 기록을 찾을 수 없습니다.',
      });
    }

    return res.json(emotion);
  } catch (error) {
    return next(error);
  }
}
