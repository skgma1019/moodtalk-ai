import { GoogleGenAI } from '@google/genai';

let client;

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing required environment variable: GEMINI_API_KEY');
  }

  if (!client) {
    client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return client;
}

export async function summarizeEmotion({ emotion, note, tags }) {
  try {
    const ai = getClient();
    const prompt = `
너는 사용자의 감정을 공감하며 정리해 주는 따뜻한 AI다.
아래 감정 기록을 바탕으로 한국어로 답변해라.

감정: ${emotion}
메모: ${note}
태그: ${(tags || []).join(', ') || '없음'}

규칙:
- 마크다운 문법을 쓰지 마라.
- 제목형 문장을 쓰지 마라.
- 먼저 감정을 공감하고, 그 다음에 원인을 부드럽게 짚어라.
- 마지막에는 짧지만 진심 어린 한마디를 덧붙여라.
- 답변은 3문단 이내로 작성하라.
`.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return sanitizeAiText(response.text);
  } catch {
    return `${emotion}이라는 감정이 오늘 꽤 크게 남아 있는 것 같아요. 메모를 보면 ${note.slice(0, 90)}${note.length > 90 ? '...' : ''} 같은 상황이 마음에 오래 남은 듯해요.

지금 느끼는 감정을 너무 빨리 정리하려 하기보다, 왜 이런 마음이 올라왔는지 천천히 바라보는 것만으로도 충분히 의미가 있어요.`;
  }
}

export async function classifyEmotionCategory({ emotion, note, tags }) {
  try {
    const ai = getClient();
    const prompt = `
너는 감정 기록을 하나의 큰 카테고리로 분류하는 역할만 한다.

가능한 카테고리:
기쁨
슬픔
화남
불안
평온
지침
혼란
기타

감정: ${emotion}
메모: ${note}
태그: ${(tags || []).join(', ') || '없음'}

규칙:
- 위 8개 중 하나만 출력해라.
- 설명하지 마라.
- 따옴표와 마침표 없이 카테고리 단어만 출력해라.
`.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return normalizeCategory(response.text);
  } catch {
    return inferCategoryFromText({ emotion, note, tags });
  }
}

export async function parseSpokenEmotionEntry(transcript) {
  try {
    const ai = getClient();
    const prompt = `
너는 사용자가 자유롭게 말한 하루 이야기를 감정 기록 데이터로 구조화하는 역할을 한다.

사용자 발화:
${transcript}

반드시 아래 JSON 형식으로만 답해라.
{
  "emotion": "대표 감정 한 단어",
  "category": "기쁨/슬픔/화남/불안/평온/지침/혼란/기타 중 하나",
  "note": "사용자 말을 자연스럽게 정리한 1~2문장",
  "tags": ["핵심 태그1", "핵심 태그2", "핵심 태그3"]
}

규칙:
- JSON 외의 텍스트를 쓰지 마라.
- emotion은 너무 길지 않은 대표 감정으로 작성해라.
- category는 지정된 8개 중 하나만 사용해라.
- note는 사용자의 의미를 보존하면서 자연스럽게 정리해라.
- tags는 최대 4개까지 넣어라.
`.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return normalizeParsedEntry(parseJsonBlock(response.text), transcript);
  } catch {
    return buildFallbackParsedEntry(transcript);
  }
}

export async function summarizeTodayEmotion({ nickname, logs }) {
  try {
    const ai = getClient();
    const formattedLogs = logs
      .map(
        (log, index) =>
          `${index + 1}. 감정: ${log.emotion}, 카테고리: ${log.emotion_category}, 강도: ${log.intensity ?? '미입력'}, 메모: ${log.note}, 태그: ${(log.tags || []).join(', ') || '없음'}`,
      )
      .join('\n');

    const prompt = `
너는 사용자의 하루 감정을 정리해 주는 다정한 AI다.
사용자 닉네임은 ${nickname}이다.

아래는 오늘 하루 동안 쌓인 감정 기록이다.
${formattedLogs}

이 기록들을 종합해서 오늘의 감정을 총정리해라.

규칙:
- 한국어로 답하라.
- 마크다운 문법을 쓰지 마라.
- 기계적인 분석 보고서처럼 쓰지 마라.
- 먼저 오늘 하루 전체 분위기를 짚고, 반복된 감정 패턴을 설명해라.
- 마지막에는 내일을 위한 짧고 따뜻한 한마디를 덧붙여라.
- 4문단 이내로 작성하라.
`.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return sanitizeAiText(response.text);
  } catch {
    return buildTodayFallbackSummary({ nickname, logs });
  }
}

function sanitizeAiText(text) {
  return String(text ?? '')
    .replace(/\*\*/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .trim();
}

function normalizeCategory(text) {
  const normalized = String(text ?? '').replace(/\s+/g, '').trim();
  const allowed = new Set(['기쁨', '슬픔', '화남', '불안', '평온', '지침', '혼란', '기타']);

  return allowed.has(normalized) ? normalized : '기타';
}

function inferCategoryFromText({ emotion, note, tags }) {
  const combined = `${emotion} ${note} ${(tags || []).join(' ')}`.toLowerCase();

  if (hasAny(combined, ['행복', '기쁨', '신남', '즐거', '뿌듯', '설렘'])) return '기쁨';
  if (hasAny(combined, ['슬픔', '우울', '눈물', '허무', '상실', '서운'])) return '슬픔';
  if (hasAny(combined, ['화남', '짜증', '분노', '열받', '억울', '빡침'])) return '화남';
  if (hasAny(combined, ['불안', '걱정', '초조', '긴장', '조급', '무서'])) return '불안';
  if (hasAny(combined, ['평온', '차분', '편안', '안정', '잔잔'])) return '평온';
  if (hasAny(combined, ['지침', '피곤', '지쳤', '무기력', '힘들', '잠'])) return '지침';
  if (hasAny(combined, ['혼란', '복잡', '헷갈', '모르겠', '혼란스'])) return '혼란';

  return '기타';
}

function buildTodayFallbackSummary({ nickname, logs }) {
  const count = logs.length;
  const categoryCounts = new Map();

  for (const log of logs) {
    const key = log.emotion_category || '기타';
    categoryCounts.set(key, (categoryCounts.get(key) || 0) + 1);
  }

  const [topCategory = '기타'] = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0] || [];
  const intense = [...logs]
    .filter((log) => Number(log.intensity) > 0)
    .sort((a, b) => Number(b.intensity) - Number(a.intensity))[0];

  const firstParagraph = `${nickname}님의 오늘은 총 ${count}개의 감정 기록이 쌓였고, 전체적으로는 ${topCategory} 쪽의 마음이 가장 자주 드러난 하루였어요.`;
  const secondParagraph = intense
    ? `특히 가장 강하게 남은 감정은 ${intense.emotion}이었어요. ${intense.note.slice(0, 110)}${intense.note.length > 110 ? '...' : ''} 같은 일이 오늘 마음의 무게를 크게 만든 것 같아요.`
    : '오늘 남긴 기록들을 보면 여러 감정이 조금씩 쌓이면서 하루의 분위기를 만든 것 같아요.';
  const thirdParagraph = '오늘의 감정을 완벽하게 정리하려 하기보다, 이렇게 기록으로 남긴 것 자체가 이미 큰 정리의 시작이에요.';

  return `${firstParagraph}\n\n${secondParagraph}\n\n${thirdParagraph}`;
}

function parseJsonBlock(text) {
  const raw = String(text ?? '').trim();
  const match = raw.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error('No JSON object found');
  }

  return JSON.parse(match[0]);
}

function normalizeParsedEntry(parsed, transcript) {
  const emotion = String(parsed?.emotion || '').trim() || inferEmotionFromText(transcript);
  const category = normalizeCategory(parsed?.category);
  const note = String(parsed?.note || '').trim() || transcript.trim();
  const tags = Array.isArray(parsed?.tags)
    ? parsed.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 4)
    : [];

  return {
    emotion,
    category,
    note,
    tags,
  };
}

function buildFallbackParsedEntry(transcript) {
  const emotion = inferEmotionFromText(transcript);
  const category = inferCategoryFromText({
    emotion,
    note: transcript,
    tags: [],
  });

  return {
    emotion,
    category,
    note: transcript.trim(),
    tags: inferTagsFromText(transcript),
  };
}

function inferEmotionFromText(text) {
  const normalized = String(text || '').toLowerCase();

  if (hasAny(normalized, ['행복', '기뻐', '좋아', '신나', '즐거'])) return '기쁨';
  if (hasAny(normalized, ['슬퍼', '우울', '눈물', '허무'])) return '슬픔';
  if (hasAny(normalized, ['짜증', '화나', '분노', '열받'])) return '화남';
  if (hasAny(normalized, ['불안', '걱정', '초조', '긴장'])) return '불안';
  if (hasAny(normalized, ['편안', '차분', '평온'])) return '평온';
  if (hasAny(normalized, ['피곤', '지쳤', '힘들', '졸려'])) return '지침';
  if (hasAny(normalized, ['혼란', '헷갈', '복잡'])) return '혼란';

  return '복잡한 마음';
}

function inferTagsFromText(text) {
  const normalized = String(text || '');
  const keywords = ['학교', '공부', '시험', '회사', '일', '가족', '친구', '연애', '수면', '건강', '스트레스'];
  return keywords.filter((keyword) => normalized.includes(keyword)).slice(0, 4);
}

function hasAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}
