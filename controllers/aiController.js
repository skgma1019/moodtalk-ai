import { summarizeEmotion, summarizeTodayEmotion } from '../services/geminiService.js';
import { getEmotionLogById, getTodayEmotionLogs, saveEmotionSummary } from '../services/emotionService.js';

export async function summarizeEmotionLog(req, res, next) {
  try {
    const { emotionLogId, emotion, note, tags } = req.body;

    if (emotionLogId) {
      const emotionLog = await getEmotionLogById({
        id: emotionLogId,
        userId: req.user.id,
      });

      if (!emotionLog) {
        return res.status(404).json({
          message: '감정 기록을 찾을 수 없습니다.',
        });
      }

      const summary = await summarizeEmotion({
        emotion: emotionLog.emotion,
        note: emotionLog.note,
        tags: emotionLog.tags,
      });

      const updatedEmotionLog = await saveEmotionSummary({
        id: emotionLog.id,
        userId: req.user.id,
        summary,
      });

      return res.json({
        saved: true,
        emotionLog: updatedEmotionLog,
      });
    }

    if (!emotion || !note) {
      return res.status(400).json({
        message: 'emotionLogId 또는 emotion과 note가 필요합니다.',
      });
    }

    const summary = await summarizeEmotion({
      emotion,
      note,
      tags: Array.isArray(tags) ? tags : [],
    });

    return res.json({
      saved: false,
      summary,
    });
  } catch (error) {
    return next(error);
  }
}

export async function summarizeToday(req, res, next) {
  try {
    const logs = await getTodayEmotionLogs(req.user.id);

    if (logs.length === 0) {
      return res.json({
        summary: '오늘 기록된 감정이 아직 없어요. 짧은 한 줄이라도 남기면 하루의 흐름을 함께 정리해드릴게요.',
        count: 0,
      });
    }

    const summary = await summarizeTodayEmotion({
      nickname: req.user.nickname,
      logs,
    });

    return res.json({
      summary,
      count: logs.length,
    });
  } catch (error) {
    return next(error);
  }
}
