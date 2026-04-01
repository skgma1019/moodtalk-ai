import { useRef, useState } from 'react';

export default function EmotionRecordForm({
  onSubmit,
  onTranscribeAudio,
  onAnalyzeSpeech,
  saving,
}) {
  const [mode, setMode] = useState('text');
  const [intensity, setIntensity] = useState(5);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedEntry, setParsedEntry] = useState(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioBlobRef = useRef(null);

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

  const transcribeBlob = async (audioBlob) => {
    if (!audioBlob) {
      return;
    }

    setTranscribing(true);
    try {
      const result = await onTranscribeAudio(audioBlob);
      setTranscript(result.transcript || '');
    } finally {
      setTranscribing(false);
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];
    audioBlobRef.current = null;
    setTranscript('');
    setParsedEntry(null);

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      const recordedBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      audioBlobRef.current = recordedBlob;
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setRecording(false);
      await transcribeBlob(recordedBlob);
    };

    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleTranscribe = async () => {
    await transcribeBlob(audioBlobRef.current);
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
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
    audioBlobRef.current = null;
  };

  return (
    <section className="card">
      <div className="section-head">
        <div>
          <p className="section-kicker">Write</p>
          <h2>감정 기록</h2>
          <p className="helper-text">
            직접 적어도 되고, 그냥 말해도 됩니다. AI가 감정과 내용을 정리해줄 수 있어요.
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
          <div className="voice-actions">
            <button type="button" className="primary-button" onClick={startRecording} disabled={recording}>
              {recording ? '녹음 중...' : '녹음 시작'}
            </button>
            <button type="button" className="ghost-button" onClick={stopRecording} disabled={!recording}>
              녹음 중지
            </button>
            <button type="button" className="ghost-button" onClick={handleTranscribe} disabled={recording || !audioBlobRef.current || transcribing}>
              {transcribing ? '전사 중...' : '전사 다시하기'}
            </button>
            <button type="button" className="ghost-button" onClick={handleAnalyze} disabled={!transcript.trim() || analyzing}>
              {analyzing ? '분석 중...' : 'AI 분석'}
            </button>
          </div>

          <label>
            전사된 문장
            <textarea
              rows="5"
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="녹음을 멈추면 자동으로 전사된 텍스트가 여기에 바로 표시됩니다."
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
              '음성을 전사한 뒤 AI 분석을 누르면 감정, 카테고리, 태그, 내용 정리가 자동으로 표시됩니다.'
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
