const TOKEN_KEY = 'moodtalk_token';

const state = {
  token: localStorage.getItem(TOKEN_KEY),
  user: null,
  emotions: [],
  selectedEmotionId: null,
};

const authSection = document.querySelector('#authSection');
const appSection = document.querySelector('#appSection');
const signupForm = document.querySelector('#signupForm');
const loginForm = document.querySelector('#loginForm');
const logoutButton = document.querySelector('#logoutButton');
const userNickname = document.querySelector('#userNickname');
const userEmail = document.querySelector('#userEmail');
const todaySummary = document.querySelector('#todaySummary');
const refreshTodayButton = document.querySelector('#refreshTodayButton');
const emotionForm = document.querySelector('#emotionForm');
const resetFormButton = document.querySelector('#resetFormButton');
const intensityInput = document.querySelector('input[name="intensity"]');
const intensityValue = document.querySelector('#intensityValue');
const emotionList = document.querySelector('#emotionList');
const selectedEmotion = document.querySelector('#selectedEmotion');
const summaryOutput = document.querySelector('#summaryOutput');
const generateSummaryButton = document.querySelector('#generateSummaryButton');
const refreshButton = document.querySelector('#refreshButton');
const logCount = document.querySelector('#logCount');
const summaryCount = document.querySelector('#summaryCount');
const toast = document.querySelector('#toast');
const categoryChartCanvas = document.querySelector('#categoryChart');
const frequencyChartCanvas = document.querySelector('#frequencyChart');
const ratioChartCanvas = document.querySelector('#ratioChart');
const trendChartCanvas = document.querySelector('#trendChart');

let categoryChart;
let frequencyChart;
let ratioChart;
let trendChart;

signupForm.addEventListener('submit', handleSignup);
loginForm.addEventListener('submit', handleLogin);
logoutButton.addEventListener('click', handleLogout);
refreshTodayButton.addEventListener('click', loadTodaySummary);
emotionForm.addEventListener('submit', handleEmotionSubmit);
resetFormButton.addEventListener('click', () => {
  emotionForm.reset();
  intensityInput.value = '5';
  updateIntensityLabel();
});
intensityInput.addEventListener('input', updateIntensityLabel);
generateSummaryButton.addEventListener('click', handleGenerateSummary);
refreshButton.addEventListener('click', () => loadDashboard());

updateIntensityLabel();
initialize();

async function initialize() {
  if (!state.token) {
    renderAuthState();
    return;
  }

  try {
    const response = await request('/api/auth/me');
    state.user = response.user;
    renderAuthState();
    await loadDashboard();
  } catch {
    clearAuth();
    renderAuthState();
  }
}

function renderAuthState() {
  const isLoggedIn = Boolean(state.user && state.token);
  authSection.classList.toggle('hidden', isLoggedIn);
  appSection.classList.toggle('hidden', !isLoggedIn);

  if (isLoggedIn) {
    userNickname.textContent = state.user.nickname;
    userEmail.textContent = state.user.email;
  }
}

async function handleSignup(event) {
  event.preventDefault();
  const formData = new FormData(signupForm);

  try {
    const auth = await request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        nickname: formData.get('nickname')?.toString().trim(),
        email: formData.get('email')?.toString().trim(),
        password: formData.get('password')?.toString(),
      }),
    });

    setAuth(auth);
    signupForm.reset();
    renderAuthState();
    showToast('회원가입이 완료되었습니다.');
    await loadDashboard();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(loginForm);

  try {
    const auth = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: formData.get('email')?.toString().trim(),
        password: formData.get('password')?.toString(),
      }),
    });

    setAuth(auth);
    loginForm.reset();
    renderAuthState();
    showToast('로그인되었습니다.');
    await loadDashboard();
  } catch (error) {
    showToast(error.message, true);
  }
}

function handleLogout() {
  clearAuth();
  state.emotions = [];
  state.selectedEmotionId = null;
  destroyCharts();
  resetDashboardView();
  renderAuthState();
  showToast('로그아웃되었습니다.');
}

async function loadDashboard(preferredId) {
  await Promise.all([loadEmotions(preferredId), loadStats(), loadTodaySummary()]);
}

async function handleEmotionSubmit(event) {
  event.preventDefault();
  const formData = new FormData(emotionForm);

  try {
    const created = await request('/api/emotions', {
      method: 'POST',
      body: JSON.stringify({
        emotion: formData.get('emotion')?.toString().trim(),
        note: formData.get('note')?.toString().trim(),
        intensity: Number(formData.get('intensity')),
        tags: formData
          .get('tags')
          ?.toString()
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    });

    emotionForm.reset();
    intensityInput.value = '5';
    updateIntensityLabel();
    showToast('감정 기록이 저장되었습니다.');
    await loadDashboard(created.id);
  } catch (error) {
    showToast(error.message, true);
  }
}

async function handleGenerateSummary() {
  const selected = getSelectedEmotion();

  if (!selected) {
    showToast('먼저 감정 기록을 선택해 주세요.', true);
    return;
  }

  generateSummaryButton.disabled = true;
  generateSummaryButton.textContent = 'AI가 정리 중...';

  try {
    const response = await request('/api/ai/summary', {
      method: 'POST',
      body: JSON.stringify({
        emotionLogId: selected.id,
      }),
    });

    showToast('AI 요약이 저장되었습니다.');
    await loadDashboard(response.emotionLog.id);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    generateSummaryButton.disabled = false;
    generateSummaryButton.textContent = '선택 기록 AI 요약 저장';
  }
}

async function loadEmotions(preferredId) {
  const emotions = await request('/api/emotions?limit=50');
  state.emotions = emotions;
  updateStats();

  if (preferredId) {
    state.selectedEmotionId = preferredId;
  } else if (!state.selectedEmotionId && emotions.length > 0) {
    state.selectedEmotionId = emotions[0].id;
  } else if (!emotions.some((emotion) => emotion.id === state.selectedEmotionId)) {
    state.selectedEmotionId = emotions[0]?.id ?? null;
  }

  renderEmotionList();
  renderSelectedEmotion();
}

async function loadStats() {
  const stats = await request('/api/stats?frequencyDays=30&trendDays=7');
  renderCategoryChart(stats.categories);
  renderFrequencyChart(stats.frequency);
  renderRatioChart(stats.frequency);
  renderTrendChart(stats.trend);
}

async function loadTodaySummary() {
  todaySummary.classList.add('empty');
  todaySummary.textContent = '오늘의 감정을 정리하고 있어요...';

  try {
    const response = await request('/api/ai/today-summary');
    todaySummary.classList.remove('empty');
    todaySummary.textContent = response.summary;
  } catch (error) {
    todaySummary.classList.add('empty');
    todaySummary.textContent = '오늘 감정 요약을 불러오지 못했어요.';
    showToast(error.message, true);
  }
}

function renderEmotionList() {
  if (state.emotions.length === 0) {
    emotionList.innerHTML = `
      <div class="empty-state">
        아직 저장된 감정 기록이 없습니다. 첫 기록을 남겨보세요.
      </div>
    `;
    return;
  }

  emotionList.innerHTML = state.emotions
    .map((emotion) => {
      const isActive = emotion.id === state.selectedEmotionId;
      const tags = Array.isArray(emotion.tags) ? emotion.tags : [];

      return `
        <button class="emotion-item ${isActive ? 'active' : ''}" data-id="${emotion.id}" type="button">
          <div class="emotion-item-top">
            <div>
              <div class="emotion-name">${escapeHtml(emotion.emotion)}</div>
              <div class="emotion-meta">${formatDate(emotion.logged_at)} · 카테고리 ${escapeHtml(emotion.emotion_category)} · 강도 ${emotion.intensity ?? '-'}</div>
            </div>
            ${emotion.ai_summary ? '<span class="summary-chip">AI 요약 저장됨</span>' : ''}
          </div>
          <div class="emotion-note">${escapeHtml(emotion.note)}</div>
          <div class="tag-row">
            ${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </button>
      `;
    })
    .join('');

  document.querySelectorAll('.emotion-item').forEach((item) => {
    item.addEventListener('click', () => {
      state.selectedEmotionId = Number(item.dataset.id);
      renderEmotionList();
      renderSelectedEmotion();
    });
  });
}

function renderSelectedEmotion() {
  const selected = getSelectedEmotion();

  if (!selected) {
    selectedEmotion.classList.add('empty');
    selectedEmotion.textContent = '아직 선택된 기록이 없습니다. 아래 목록에서 기록을 선택해 주세요.';
    summaryOutput.classList.add('empty');
    summaryOutput.textContent = '아직 생성된 AI 요약이 없습니다.';
    generateSummaryButton.disabled = true;
    return;
  }

  selectedEmotion.classList.remove('empty');
  selectedEmotion.innerHTML = `
    <strong>${escapeHtml(selected.emotion)}</strong>
    ${escapeHtml(selected.note)}
  `;

  if (selected.ai_summary) {
    summaryOutput.classList.remove('empty');
    summaryOutput.textContent = selected.ai_summary;
  } else {
    summaryOutput.classList.add('empty');
    summaryOutput.textContent = '이 기록에는 아직 AI 요약이 없습니다.';
  }

  generateSummaryButton.disabled = false;
}

function updateStats() {
  logCount.textContent = state.emotions.length.toString();
  summaryCount.textContent = state.emotions.filter((emotion) => emotion.ai_summary).length.toString();
}

function updateIntensityLabel() {
  intensityValue.textContent = `${intensityInput.value} / 10`;
}

function getSelectedEmotion() {
  return state.emotions.find((emotion) => emotion.id === state.selectedEmotionId) ?? null;
}

function setAuth(auth) {
  state.token = auth.token;
  state.user = auth.user;
  localStorage.setItem(TOKEN_KEY, auth.token);
}

function clearAuth() {
  state.token = null;
  state.user = null;
  localStorage.removeItem(TOKEN_KEY);
}

function resetDashboardView() {
  emotionList.innerHTML = '';
  selectedEmotion.textContent = '로그인 후 감정 기록을 선택할 수 있어요.';
  summaryOutput.textContent = '로그인 후 AI 요약을 사용할 수 있어요.';
  todaySummary.textContent = '로그인 후 오늘의 감정 총정리를 확인할 수 있어요.';
  logCount.textContent = '0';
  summaryCount.textContent = '0';
}

function destroyCharts() {
  [categoryChart, frequencyChart, ratioChart, trendChart].forEach((chart) => {
    if (chart) {
      chart.destroy();
    }
  });

  categoryChart = null;
  frequencyChart = null;
  ratioChart = null;
  trendChart = null;
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearAuth();
    renderAuthState();
  }

  if (!response.ok) {
    throw new Error(data.message || '요청 처리 중 오류가 발생했습니다.');
  }

  return data;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function renderCategoryChart(data) {
  const labels = data.map((item) => item.category);
  const values = data.map((item) => item.count);
  const detailMap = data.map((item) => item.emotions);

  if (categoryChart) {
    categoryChart.destroy();
  }

  categoryChart = new Chart(categoryChartCanvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: '카테고리별 기록 수',
          data: values,
          backgroundColor: ['#c35e32', '#355070', '#e56b6f', '#6d597a', '#6c8a52', '#bc6c25', '#7f5539', '#9c9c9c'],
          borderRadius: 14,
        },
      ],
    },
    options: baseChartOptions({
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterBody(items) {
              const index = items[0]?.dataIndex ?? 0;
              const details = detailMap[index] || [];
              return details.length > 0 ? [`세부 감정: ${details.join(', ')}`] : ['세부 감정: 없음'];
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
    }),
  });
}

function renderFrequencyChart(data) {
  const labels = data.map((item) => item.emotion);
  const values = data.map((item) => item.count);

  if (frequencyChart) {
    frequencyChart.destroy();
  }

  frequencyChart = new Chart(frequencyChartCanvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: '감정 횟수',
          data: values,
          backgroundColor: ['#c35e32', '#264653', '#e9c46a', '#6c8a52', '#b56576', '#457b9d'],
          borderRadius: 12,
        },
      ],
    },
    options: baseChartOptions({
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
    }),
  });
}

function renderRatioChart(data) {
  const labels = data.map((item) => `${item.emotion} ${item.percentage}%`);
  const values = data.map((item) => item.count);

  if (ratioChart) {
    ratioChart.destroy();
  }

  ratioChart = new Chart(ratioChartCanvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: ['#c35e32', '#264653', '#e9c46a', '#6c8a52', '#b56576', '#457b9d'],
          borderWidth: 0,
        },
      ],
    },
    options: baseChartOptions({
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    }),
  });
}

function renderTrendChart(data) {
  const labels = data.map((item) => formatShortDate(item.date));
  const countValues = data.map((item) => item.count);
  const intensityValues = data.map((item) => item.averageIntensity);

  if (trendChart) {
    trendChart.destroy();
  }

  trendChart = new Chart(trendChartCanvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '기록 수',
          data: countValues,
          borderColor: '#c35e32',
          backgroundColor: 'rgba(195, 94, 50, 0.16)',
          fill: true,
          tension: 0.35,
          yAxisID: 'y',
        },
        {
          label: '평균 강도',
          data: intensityValues,
          borderColor: '#264653',
          backgroundColor: 'rgba(38, 70, 83, 0.12)',
          fill: false,
          tension: 0.35,
          yAxisID: 'y1',
        },
      ],
    },
    options: baseChartOptions({
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        y: {
          beginAtZero: true,
          position: 'left',
          ticks: { precision: 0 },
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          max: 10,
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    }),
  });
}

function baseChartOptions(extraOptions = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#26170d',
          font: {
            family: 'IBM Plex Sans KR',
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#6c5746' },
        grid: { display: false },
      },
      y: {
        ticks: { color: '#6c5746' },
        grid: { color: 'rgba(77, 49, 28, 0.08)' },
      },
    },
    ...extraOptions,
  };
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.remove('hidden', 'error');

  if (isError) {
    toast.classList.add('error');
  }

  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.add('hidden');
  }, 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
