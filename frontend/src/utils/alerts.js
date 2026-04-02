export function showErrorAlert(error, fallbackMessage = '요청 처리 중 오류가 발생했습니다.') {
  const message =
    error instanceof Error && error.message
      ? error.message
      : typeof error === 'string' && error.trim()
        ? error
        : fallbackMessage;

  window.alert(message);
}
