import "./styles/main.css";
import { ReviewResult, Settings } from "../plugin/types";
import { loadSettings, saveSettings, getDefaultSettings, validateSettings } from "../utils/storage";
import { checkServerStatus, sendReviewRequest, sendQuestionRequest } from "../utils/api";
import { showError, showSuccess, showLoading, hideLoading } from "../utils/error-handling";

// DOM要素
const startReviewButton = document.getElementById("start-review-button") as HTMLButtonElement;
const reviewResultSection = document.getElementById("review-result-section") as HTMLDivElement;
const reviewResultElement = document.getElementById("review-result") as HTMLDivElement;
const copyResultButton = document.getElementById("copy-result-button") as HTMLButtonElement;
const chatSection = document.getElementById("chat-section") as HTMLDivElement;
const chatMessages = document.getElementById("chat-messages") as HTMLDivElement;
const chatInput = document.getElementById("chat-input") as HTMLInputElement;
const chatSendButton = document.getElementById("chat-send-button") as HTMLButtonElement;
const serverStatus = document.getElementById("server-status") as HTMLDivElement;
const serverStatusText = document.getElementById("server-status-text") as HTMLSpanElement;
const settingsButton = document.getElementById("settings-button") as HTMLButtonElement;
const settingsModal = document.getElementById("settings-modal") as HTMLDivElement;
const settingsForm = document.getElementById("settings-form") as HTMLFormElement;
const serverUrlInput = document.getElementById("server-url") as HTMLInputElement;
const serverPortInput = document.getElementById("server-port") as HTMLInputElement;
const modelSelect = document.getElementById("model") as HTMLSelectElement;
const settingsCloseButton = document.getElementById("settings-close") as HTMLButtonElement;
const settingsCancelButton = document.getElementById("settings-cancel") as HTMLButtonElement;
const helpModal = document.getElementById("help-modal") as HTMLDivElement;
const helpCloseButton = document.getElementById("help-close") as HTMLButtonElement;

// 状態
let currentSettings: Settings = getDefaultSettings();
let currentReviewResult: ReviewResult | null = null;
let chatHistory: { role: "user" | "assistant"; content: string }[] = [];
let loadingIndicator: HTMLElement | null = null;

// 初期化
function init() {
  // 設定の読み込み
  const savedSettings = loadSettings();
  if (savedSettings) {
    currentSettings = savedSettings;
    updateSettingsForm();
  }

  // サーバー接続状態の確認
  checkServerConnection();

  // イベントリスナーの設定
  setupEventListeners();
}

// サーバー接続状態の確認
async function checkServerConnection() {
  try {
    const response = await checkServerStatus(currentSettings);
    if (response.success) {
      updateServerStatus(true, "サーバーに接続されています");
    } else {
      updateServerStatus(false, "サーバーに接続できません");
    }
  } catch (error) {
    updateServerStatus(false, "サーバーに接続できません");
  }
}

// サーバー接続状態の更新
function updateServerStatus(connected: boolean, message: string) {
  serverStatus.className = connected
    ? "server-status server-status-connected"
    : "server-status server-status-disconnected";
  serverStatusText.textContent = message;
}

// イベントリスナーの設定
function setupEventListeners() {
  // レビュー開始ボタン
  startReviewButton.addEventListener("click", handleStartReview);

  // 結果コピーボタン
  copyResultButton.addEventListener("click", handleCopyResult);

  // チャット送信ボタン
  chatSendButton.addEventListener("click", handleSendQuestion);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSendQuestion();
    }
  });

  // 設定ボタン
  settingsButton.addEventListener("click", () => {
    settingsModal.classList.remove("hidden");
  });

  // 設定フォーム
  settingsForm.addEventListener("submit", handleSaveSettings);
  settingsCloseButton.addEventListener("click", () => {
    settingsModal.classList.add("hidden");
  });
  settingsCancelButton.addEventListener("click", () => {
    updateSettingsForm();
    settingsModal.classList.add("hidden");
  });

  // ヘルプモーダル
  helpCloseButton?.addEventListener("click", () => {
    helpModal.classList.add("hidden");
  });
}

// レビュー開始処理
async function handleStartReview() {
  // ローディングインジケーターの表示
  loadingIndicator = showLoading(
    "レビュー中...",
    document.querySelector(".content") as HTMLElement
  );
  startReviewButton.disabled = true;

  // Figmaプラグインにレビュー開始メッセージを送信
  parent.postMessage({ pluginMessage: { type: "start-review" } }, "*");
}

// レビュー結果の表示
function displayReviewResult(result: ReviewResult) {
  currentReviewResult = result;

  // レビュー結果のHTML生成
  let html = `
    <div class="review-result-summary">${result.summary}</div>
    
    <div class="review-result-section">
      <h3 class="review-result-section-title">良い点</h3>
      <ul class="review-result-list">
        ${result.goodPoints
          .map((point) => `<li class="review-result-list-item">${point}</li>`)
          .join("")}
      </ul>
    </div>
    
    <div class="review-result-section">
      <h3 class="review-result-section-title">改善点</h3>
      <ul class="review-result-list">
        ${result.badPoints
          .map((point) => `<li class="review-result-list-item">${point}</li>`)
          .join("")}
      </ul>
    </div>
    
    <div class="review-result-section">
      <h3 class="review-result-section-title">詳細分析</h3>
      ${Object.entries(result.detailedAnalysis)
        .map(
          ([principle, analysis]) => `
        <div class="review-result-detail">
          <h4 class="review-result-detail-title">${principle}</h4>
          <div class="review-result-detail-content">${analysis}</div>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  // レビュー結果の表示
  reviewResultElement.innerHTML = html;
  reviewResultSection.classList.remove("hidden");
  chatSection.classList.remove("hidden");

  // ローディングインジケーターの非表示
  if (loadingIndicator) {
    hideLoading(loadingIndicator);
    loadingIndicator = null;
  }

  startReviewButton.disabled = false;
}

// 結果コピー処理
function handleCopyResult() {
  if (!currentReviewResult) return;

  const text = `
# UXレビュー結果

## 全体サマリー
${currentReviewResult.summary}

## 良い点
${currentReviewResult.goodPoints.map((point) => `- ${point}`).join("\n")}

## 改善点
${currentReviewResult.badPoints.map((point) => `- ${point}`).join("\n")}

## 詳細分析
${Object.entries(currentReviewResult.detailedAnalysis)
  .map(
    ([principle, analysis]) => `
### ${principle}
${analysis}
`
  )
  .join("\n")}
  `;

  navigator.clipboard
    .writeText(text)
    .then(() => {
      showSuccess(
        "レビュー結果をクリップボードにコピーしました",
        document.querySelector(".content") as HTMLElement
      );
    })
    .catch((err) => {
      showError("コピーに失敗しました", document.querySelector(".content") as HTMLElement);
    });
}

// 質問送信処理
async function handleSendQuestion() {
  const question = chatInput.value.trim();
  if (!question) return;

  // 質問の表示
  addChatMessage("user", question);
  chatInput.value = "";

  // ローディングインジケーターの表示
  loadingIndicator = showLoading("回答を生成中...", chatMessages);
  chatSendButton.disabled = true;

  try {
    // 質問の送信
    const context = {
      reviewResult: currentReviewResult,
      chatHistory,
    };

    const response = await sendQuestionRequest(question, context, currentSettings);

    if (response.success && response.data) {
      // 回答の表示
      addChatMessage("assistant", response.data.answer);
      chatHistory.push({ role: "user", content: question });
      chatHistory.push({ role: "assistant", content: response.data.answer });
    } else {
      showError(response.error || "質問の送信に失敗しました", chatMessages);
    }
  } catch (error) {
    showError("質問の送信に失敗しました", chatMessages);
  } finally {
    // ローディングインジケーターの非表示
    if (loadingIndicator) {
      hideLoading(loadingIndicator);
      loadingIndicator = null;
    }

    chatSendButton.disabled = false;

    // チャットメッセージエリアのスクロール
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// チャットメッセージの追加
function addChatMessage(role: "user" | "assistant", content: string) {
  const messageElement = document.createElement("div");
  messageElement.className = `chat-message chat-message-${role}`;
  messageElement.textContent = content;

  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 設定保存処理
function handleSaveSettings(e: Event) {
  e.preventDefault();

  const newSettings: Settings = {
    apiKey: "", // APIキーはサーバー側で管理
    serverUrl: serverUrlInput.value,
    port: parseInt(serverPortInput.value),
    model: modelSelect.value,
  };

  const validation = validateSettings(newSettings);
  if (!validation.valid) {
    showError(validation.errors.join("\n"), settingsForm);
    return;
  }

  currentSettings = newSettings;
  saveSettings(currentSettings);

  settingsModal.classList.add("hidden");
  showSuccess("設定を保存しました", document.querySelector(".content") as HTMLElement);

  // サーバー接続状態の再確認
  checkServerConnection();
}

// 設定フォームの更新
function updateSettingsForm() {
  serverUrlInput.value = currentSettings.serverUrl;
  serverPortInput.value = currentSettings.port.toString();
  modelSelect.value = currentSettings.model;
}

// Figmaプラグインからのメッセージ処理
window.onmessage = async (event) => {
  const message = event.data.pluginMessage;
  if (!message) return;

  switch (message.type) {
    case "review-data":
      try {
        // レビューリクエストの送信
        const response = await sendReviewRequest(message.layerInfo, currentSettings);

        if (response.success && response.data) {
          displayReviewResult(response.data);
        } else {
          showError(
            response.error || "レビューの取得に失敗しました",
            document.querySelector(".content") as HTMLElement
          );
          if (loadingIndicator) {
            hideLoading(loadingIndicator);
            loadingIndicator = null;
          }
          startReviewButton.disabled = false;
        }
      } catch (error) {
        showError(
          "レビューの取得に失敗しました",
          document.querySelector(".content") as HTMLElement
        );
        if (loadingIndicator) {
          hideLoading(loadingIndicator);
          loadingIndicator = null;
        }
        startReviewButton.disabled = false;
      }
      break;

    case "error":
      showError(message.error, document.querySelector(".content") as HTMLElement);
      if (loadingIndicator) {
        hideLoading(loadingIndicator);
        loadingIndicator = null;
      }
      startReviewButton.disabled = false;
      break;
  }
};

// 初期化
init();
