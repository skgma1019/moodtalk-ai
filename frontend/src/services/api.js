async function request(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || '요청 처리 중 오류가 발생했습니다.');
  }

  return data;
}

async function requestFormData(path, { formData, token } = {}) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || '요청 처리 중 오류가 발생했습니다.');
  }

  return data;
}

export const authApi = {
  signup: (body) => request('/api/auth/signup', { method: 'POST', body }),
  login: (body) => request('/api/auth/login', { method: 'POST', body }),
  me: (token) => request('/api/auth/me', { token }),
};

export const emotionApi = {
  create: (body, token) => request('/api/emotions', { method: 'POST', body, token }),
  list: (token) => request('/api/emotions?limit=50', { token }),
  transcribeAudio: (audioBlob, token) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    return requestFormData('/api/ai/transcribe-audio', { formData, token });
  },
  analyzeEntry: (transcript, token) =>
    request('/api/ai/analyze-entry', { method: 'POST', body: { transcript }, token }),
  summarizeOne: (emotionLogId, token) =>
    request('/api/ai/summary', { method: 'POST', body: { emotionLogId }, token }),
  summarizeToday: (token) => request('/api/ai/today-summary', { token }),
  stats: (token) => request('/api/stats?frequencyDays=30&trendDays=7', { token }),
};
