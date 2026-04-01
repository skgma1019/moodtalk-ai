import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import EmotionRecordForm from '../components/record/EmotionRecordForm.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useEmotionDashboard } from '../hooks/useEmotionDashboard.js';

export default function RecordPage() {
  const { token } = useAuth();
  const {
    createEmotion,
    transcribeAudio,
    analyzeEntry,
    emotions,
    selectedEmotion,
    setSelectedEmotionId,
    summarizeEmotion,
    loading,
  } = useEmotionDashboard();
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

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
      <section className="page-header card">
        <div>
          <p className="section-kicker">Record</p>
          <h2>감정 기록 화면</h2>
        </div>
        <p className="page-description">
          내 감정을 기록하고, 최근 기록과 AI 요약까지 한 화면에서 바로 확인할 수 있습니다.
        </p>
      </section>

      <EmotionRecordForm
        onSubmit={handleCreate}
        onTranscribeAudio={transcribeAudio}
        onAnalyzeSpeech={analyzeEntry}
        saving={saving}
      />

      <section className="card selected-card">
        <div className="section-head">
          <div>
            <p className="section-kicker">Reflect</p>
            <h2>선택한 기록 보기</h2>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={handleSummarize}
            disabled={!selectedEmotion || summarizing}
          >
            {summarizing ? '정리 중...' : 'AI 요약 저장'}
          </button>
        </div>

        <div className={`summary-output ${selectedEmotion ? '' : 'muted-box'}`}>
          {selectedEmotion ? (
            <>
              <strong>{selectedEmotion.emotion}</strong>
              {'\n'}
              카테고리: {selectedEmotion.emotion_category}
              {'\n'}
              강도: {selectedEmotion.intensity ?? '-'}
              {'\n\n'}
              {selectedEmotion.note}
              {'\n\n'}
              {selectedEmotion.ai_summary || '아직 저장된 AI 요약이 없습니다. 위 버튼으로 생성할 수 있어요.'}
            </>
          ) : (
            '아래 기록 목록에서 하나를 선택하면 상세 내용과 AI 요약을 볼 수 있습니다.'
          )}
        </div>
      </section>

      <section className="card full-span">
        <div className="section-head">
          <div>
            <p className="section-kicker">History</p>
            <h2>최근 감정 기록 목록</h2>
          </div>
          <span className="badge">{emotions.length}개의 기록</span>
        </div>

        {loading ? (
          <div className="empty-state">기록을 불러오는 중...</div>
        ) : emotions.length === 0 ? (
          <div className="empty-state">아직 기록이 없습니다. 오늘의 감정을 먼저 남겨보세요.</div>
        ) : (
          <div className="emotion-list compact-list">
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
                    <div className="emotion-meta">
                      {emotion.emotion_category} · 강도 {emotion.intensity ?? '-'}
                    </div>
                  </div>
                  {emotion.ai_summary ? <span className="summary-chip">요약 있음</span> : null}
                </div>
                <div className="emotion-note">{emotion.note}</div>
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
