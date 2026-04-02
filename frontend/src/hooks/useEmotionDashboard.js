import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { emotionApi } from '../services/api.js';
import { showErrorAlert } from '../utils/alerts.js';

export function useEmotionDashboard() {
  const { token } = useAuth();
  const [emotions, setEmotions] = useState([]);
  const [stats, setStats] = useState({ frequency: [], categories: [], trend: [] });
  const [todaySummary, setTodaySummary] = useState('');
  const [selectedEmotionId, setSelectedEmotionId] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (preferredId) => {
    if (!token) {
      setEmotions([]);
      setStats({ frequency: [], categories: [], trend: [] });
      setTodaySummary('');
      setSelectedEmotionId(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [emotionList, statsData, todayData] = await Promise.all([
        emotionApi.list(token),
        emotionApi.stats(token),
        emotionApi.summarizeToday(token),
      ]);

      setEmotions(emotionList);
      setStats(statsData);
      setTodaySummary(todayData.summary);
      setSelectedEmotionId((current) => preferredId ?? current ?? emotionList[0]?.id ?? null);
    } catch (error) {
      showErrorAlert(error, '대시보드 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createEmotion = async (payload) => {
    const created = await emotionApi.create(payload, token);
    await refresh(created.id);
  };

  const transcribeAudio = async (audioBlob) => emotionApi.transcribeAudio(audioBlob, token);
  const analyzeEntry = async (transcript) => emotionApi.analyzeEntry(transcript, token);

  const summarizeEmotion = async (emotionLogId) => {
    const result = await emotionApi.summarizeOne(emotionLogId, token);
    await refresh(result.emotionLog.id);
  };

  return {
    emotions,
    stats,
    todaySummary,
    selectedEmotionId,
    selectedEmotion: emotions.find((emotion) => emotion.id === selectedEmotionId) ?? null,
    setSelectedEmotionId,
    loading,
    refresh,
    createEmotion,
    transcribeAudio,
    analyzeEntry,
    summarizeEmotion,
  };
}
