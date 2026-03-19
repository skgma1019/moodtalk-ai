import { useState } from 'react';

export default function EmotionRecordForm({ onSubmit, saving }) {
  const [intensity, setIntensity] = useState(5);

  const handleSubmit = (event) => {
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

  return (
    <section className="card">
      <div className="section-head">
        <div>
          <p className="section-kicker">Write</p>
          <h2>감정 기록</h2>
        </div>
        <span className="badge">Record Page</span>
      </div>
      <form className="emotion-form" onSubmit={handleSubmit}>
        <label>
          감정
          <input type="text" name="emotion" placeholder="예: 불안, 기쁨, 답답함" required />
        </label>
        <label>
          강도
          <input type="range" name="intensity" min="1" max="10" defaultValue="5" onChange={(event) => setIntensity(Number(event.target.value))} />
          <span>{intensity} / 10</span>
        </label>
        <label>
          태그
          <input type="text" name="tags" placeholder="쉼표로 구분: 일, 관계, 피로" />
        </label>
        <label>
          메모
          <textarea name="note" rows="6" placeholder="오늘 어떤 일이 있었는지 적어보세요." required />
        </label>
        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? '저장 중...' : '기록 저장'}
        </button>
      </form>
    </section>
  );
}
