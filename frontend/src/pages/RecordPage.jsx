import { useState } from 'react';
import EmotionRecordForm from '../components/record/EmotionRecordForm.jsx';
import { useEmotionDashboard } from '../hooks/useEmotionDashboard.js';

export default function RecordPage() {
  const { createEmotion, emotions, selectedEmotion, setSelectedEmotionId, summarizeEmotion, loading } = useEmotionDashboard();
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await createEmotion(payload);
    } finally {
      setSaving(false);
    }
  };

  const handleSummarize = async () => {
    if (!selectedEmotion) return;
    setSummarizing(true);
    try {
      await summarizeEmotion(selectedEmotion.id);
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <>
      <EmotionRecordForm onSubmit={handleCreate} saving={saving} />
      <section className="card">
        <div className="section-head">
          <div>
            <p className="section-kicker">History</p>
            <h2>감정 기록 목록</h2>
          </div>
        </div>
        {loading ? (
          <div className="empty-state">불러오는 중...</div>
        ) : (
          <div className="emotion-list">
            {emotions.map((emotion) => (
              <button
                key={emotion.id}
                type="button"
                className={`emotion-item ${selectedEmotion?.id === emotion.id ? 'active' : ''}`}
                onClick={() => setSelectedEmotionId(emotion.id)}
              >
                <div className="emotion-item-top">
                  <div>
                    <div className="emotion-name">{emotion.emotion}</div>
                    <div className="emotion-meta">{emotion.emotion_category} · 강도 {emotion.intensity ?? '-'}</div>
                  </div>
                  {emotion.ai_summary ? <span className="summary-chip">AI 요약 저장됨</span> : null}
                </div>
                <div className="emotion-note">{emotion.note}</div>
              </button>
            ))}
          </div>
        )}
      </section>
      <section className="card">
        <div className="section-head">
          <div>
            <p className="section-kicker">Reflect</p>
            <h2>선택 기록 요약</h2>
          </div>
        </div>
        <div className="summary-output">
          {selectedEmotion?.ai_summary || '기록을 선택한 뒤 AI 요약 저장을 눌러보세요.'}
        </div>
        <div className="summary-actions">
          <button type="button" className="primary-button" onClick={handleSummarize} disabled={!selectedEmotion || summarizing}>
            {summarizing ? '정리 중...' : '선택 기록 AI 요약 저장'}
          </button>
        </div>
      </section>
    </>
  );
}
