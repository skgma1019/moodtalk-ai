import { useEffect, useRef, useState } from 'react';
import { showErrorAlert } from '../../utils/alerts.js';

function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function EmotionRecordForm({
  onSubmit,
  onAnalyzeSpeech,
  saving,
}) {
  const [mode, setMode] = useState('text');
  const [intensity, setIntensity] = useState(5);
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedEntry, setParsedEntry] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const stopRequestedRef = useRef(false);

  useEffect(() => {
    setSpeechSupported(Boolean(getSpeechRecognition()));

    return () => {
      stopRequestedRef.current = true;
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  const handleTextSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      emotion: formData.get('emotion')?.toString().trim(),
      note: formData.get('note')?.toString().trim(),
      intensity: Number(formData.get('intensity')),
      tags: formData
        .get('tags')
        ?.toString()
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    });

    event.currentTarget.reset();
    setIntensity(5);
  };

  const startRecording = async () => {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      showErrorAlert('이 브라우저는 실시간 음성 인식을 지원하지 않습니다. Chrome 브라우저에서 다시 시도해 주세요.');
      return;
    }

    finalTranscriptRef.current = '';
    stopRequestedRef.current = false;
    setTranscript('');
    setParsedEntry(null);

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setRecording(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0]?.transcript || '';

        if (result.isFinal) {
          finalTranscriptRef.current = `${finalTranscriptRef.current} ${text}`.trim();
        } else {
          interimTranscript += text;
        }
      }

      const combinedTranscript = `${finalTranscriptRef.current} ${interimTranscript}`.trim();
      setTranscript(combinedTranscript);
    };

    recognition.onerror = (event) => {
      setRecording(false);

      if (event.error === 'not-allowed') {
        showErrorAlert('마이크 권한이 필요합니다. 브라우저에서 마이크 접근을 허용해 주세요.');
        return;
      }

      if (event.error === 'no-speech') {
        showErrorAlert('음성이 감지되지 않았습니다. 조금 더 또렷하게 말씀해 주세요.');
        return;
      }

      showErrorAlert(`음성 인식 중 오류가 발생했습니다. (${event.error})`);
    };

    recognition.onend = () => {
      setRecording(false);

      if (!stopRequestedRef.current) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    stopRequestedRef.current = true;
    recognitionRef.current?.stop();
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      showErrorAlert('먼저 음성 또는 텍스트 내용을 준비해 주세요.');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await onAnalyzeSpeech(transcript.trim());
      setParsedEntry(result);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveParsedEntry = () => {
    if (!parsedEntry) {
      showErrorAlert('먼저 AI 분석을 진행해 주세요.');
      return;
    }

    onSubmit({
      emotion: parsedEntry.emotion,
      note: parsedEntry.note,
      intensity,
      tags: parsedEntry.tags,
    });

    setTranscript('');
    setParsedEntry(null);
    setIntensity(5);
    finalTranscriptRef.current = '';
  };

  return (
    <section className="card">
      <div className="section-head">
        <div>
          <p className="section-kicker">Write</p>
          <h2>감정 기록</h2>
          <p className="helper-text">
            직접 적어도 되고, 말하는 동안 실시간으로 문장을 띄울 수도 있어요.
          </p>
        </div>
        <span className="badge">Record Page</span>
      </div>

      <div className="mode-switch">
        <button type="button" className={`switch-chip ${mode === 'text' ? 'active' : ''}`} onClick={() => setMode('text')}>
          텍스트 입력
        </button>
        <button type="button" className={`switch-chip ${mode === 'voice' ? 'active' : ''}`} onClick={() => setMode('voice')}>
          음성 입력
        </button>
      </div>

      {mode === 'text' ? (
        <form className="emotion-form" onSubmit={handleTextSubmit}>
          <label>
            감정
            <input type="text" name="emotion" placeholder="예: 불안, 기쁨, 답답함" required />
          </label>
          <label>
            강도
            <input
              type="range"
              name="intensity"
              min="1"
              max="10"
              defaultValue="5"
              onChange={(event) => setIntensity(Number(event.target.value))}
            />
            <span>{intensity} / 10</span>
          </label>
          <label>
            태그
            <input type="text" name="tags" placeholder="쉼표로 구분: 학교, 관계, 피로" />
          </label>
          <label>
            메모
            <textarea name="note" rows="6" placeholder="오늘 어떤 일이 있었는지 적어보세요." required />
          </label>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? '저장 중...' : '기록 저장'}
          </button>
        </form>
      ) : (
        <div className="voice-panel">
          {!speechSupported ? (
            <div className="summary-output muted-box">
              현재 브라우저에서는 실시간 음성 인식을 지원하지 않습니다. Chrome에서 접속해 주세요.
            </div>
          ) : null}

          <div className="voice-actions">
            <button type="button" className="primary-button" onClick={startRecording} disabled={recording || !speechSupported}>
              {recording ? '듣는 중...' : '실시간 음성 시작'}
            </button>
            <button type="button" className="ghost-button" onClick={stopRecording} disabled={!recording}>
              음성 멈추기
            </button>
            <button type="button" className="ghost-button" onClick={handleAnalyze} disabled={!transcript.trim() || analyzing}>
              {analyzing ? '분석 중...' : 'AI 분석'}
            </button>
          </div>

          <label>
            실시간 인식 문장
            <textarea
              rows="5"
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="음성 시작을 누르고 말하면 문장이 실시간으로 여기에 표시됩니다."
            />
          </label>

          <label>
            강도
            <input type="range" min="1" max="10" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} />
            <span>{intensity} / 10</span>
          </label>

          <div className={`summary-output ${parsedEntry ? '' : 'muted-box'}`}>
            {parsedEntry ? (
              <>
                <strong>감정: {parsedEntry.emotion}</strong>
                {'\n'}
                카테고리: {parsedEntry.category}
                {'\n'}
                태그: {parsedEntry.tags?.join(', ') || '없음'}
                {'\n\n'}
                내용 정리:
                {'\n'}
                {parsedEntry.note}
              </>
            ) : (
              '실시간으로 인식된 문장을 확인한 뒤 AI 분석을 누르면 감정과 카테고리를 정리해줍니다.'
            )}
          </div>

          <button type="button" className="primary-button" onClick={handleSaveParsedEntry} disabled={saving || !parsedEntry}>
            {saving ? '저장 중...' : '분석 결과로 저장'}
          </button>
        </div>
      )}
    </section>
  );
}
