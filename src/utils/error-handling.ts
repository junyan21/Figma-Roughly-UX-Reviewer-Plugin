/**
 * エラーメッセージを表示する
 */
export function showError(message: string, container: HTMLElement): void {
  const errorElement = document.createElement("div");
  errorElement.className = "error-message";
  errorElement.textContent = message;

  // スタイルを設定
  errorElement.style.backgroundColor = "rgba(220, 38, 38, 0.1)";
  errorElement.style.color = "rgb(220, 38, 38)";
  errorElement.style.padding = "8px 12px";
  errorElement.style.borderRadius = "4px";
  errorElement.style.marginBottom = "12px";
  errorElement.style.fontSize = "14px";

  // 既存のエラーメッセージを削除
  const existingErrors = container.querySelectorAll(".error-message");
  existingErrors.forEach((el) => el.remove());

  // 新しいエラーメッセージを追加
  container.prepend(errorElement);

  // 5秒後に自動的に消える
  setTimeout(() => {
    errorElement.style.opacity = "0";
    errorElement.style.transition = "opacity 0.5s ease";

    // アニメーション完了後に要素を削除
    setTimeout(() => {
      errorElement.remove();
    }, 500);
  }, 5000);
}

/**
 * 成功メッセージを表示する
 */
export function showSuccess(message: string, container: HTMLElement): void {
  const successElement = document.createElement("div");
  successElement.className = "success-message";
  successElement.textContent = message;

  // スタイルを設定
  successElement.style.backgroundColor = "rgba(34, 197, 94, 0.1)";
  successElement.style.color = "rgb(34, 197, 94)";
  successElement.style.padding = "8px 12px";
  successElement.style.borderRadius = "4px";
  successElement.style.marginBottom = "12px";
  successElement.style.fontSize = "14px";

  // 既存の成功メッセージを削除
  const existingSuccess = container.querySelectorAll(".success-message");
  existingSuccess.forEach((el) => el.remove());

  // 新しい成功メッセージを追加
  container.prepend(successElement);

  // 3秒後に自動的に消える
  setTimeout(() => {
    successElement.style.opacity = "0";
    successElement.style.transition = "opacity 0.5s ease";

    // アニメーション完了後に要素を削除
    setTimeout(() => {
      successElement.remove();
    }, 500);
  }, 3000);
}

/**
 * ローディングインジケーターを作成する
 */
export function createLoadingIndicator(message: string = "Loading..."): HTMLElement {
  const container = document.createElement("div");
  container.className = "loading-indicator";

  // スタイルを設定
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.gap = "8px";
  container.style.margin = "8px 0";
  container.style.padding = "8px";

  // スピナーを作成
  const spinner = document.createElement("div");
  spinner.className = "spinner";
  spinner.style.width = "24px";
  spinner.style.height = "24px";
  spinner.style.border = "3px solid var(--border, #e5e5e5)";
  spinner.style.borderTop = "3px solid var(--primary, #0070f3)";
  spinner.style.borderRadius = "50%";
  spinner.style.animation = "spin 1s linear infinite";

  // メッセージを作成
  const messageElement = document.createElement("span");
  messageElement.textContent = message;

  // 要素を追加
  container.appendChild(spinner);
  container.appendChild(messageElement);

  // スピナーのアニメーションを定義
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  return container;
}

/**
 * ローディングインジケーターを表示する
 */
export function showLoading(message: string, container: HTMLElement): HTMLElement {
  // 既存のローディングインジケーターを削除
  const existingLoading = container.querySelectorAll(".loading-indicator");
  existingLoading.forEach((el) => el.remove());

  // 新しいローディングインジケーターを作成
  const loadingElement = createLoadingIndicator(message);

  // コンテナに追加
  container.prepend(loadingElement);

  return loadingElement;
}

/**
 * ローディングインジケーターを非表示にする
 */
export function hideLoading(loadingElement: HTMLElement): void {
  if (loadingElement && loadingElement.parentNode) {
    loadingElement.remove();
  }
}
