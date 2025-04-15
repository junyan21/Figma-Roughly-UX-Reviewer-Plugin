import { sendQuestionRequest } from "../utils/api";

// チャット履歴の型定義
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// チャット履歴
let chatHistory: ChatMessage[] = [];

// デバッグ用のログ関数
function log(message: string) {
  const logArea = document.getElementById("log-area") as HTMLTextAreaElement;
  if (logArea) {
    logArea.value += message + "\n";
    console.log(message);
  }
}

// チャットメッセージを表示する関数
function displayChatMessage(message: ChatMessage) {
  try {
    log(`🔍 UI: チャットメッセージを表示します: ${JSON.stringify(message)}`);

    const chatHistoryElement = document.getElementById("chat-history");
    if (!chatHistoryElement) {
      log(`❌ UI: チャット履歴要素が見つかりません`);
      return;
    }

    // メッセージ要素を作成
    log(`🔍 UI: メッセージ要素を作成します`);
    const messageElement = document.createElement("div");
    messageElement.style.marginBottom = "10px";
    messageElement.style.padding = "8px";
    messageElement.style.borderRadius = "5px";
    messageElement.style.maxWidth = "80%";
    messageElement.style.wordBreak = "break-word";

    // ユーザーとアシスタントでスタイルを変える
    if (message.role === "user") {
      messageElement.style.backgroundColor = "#e1f5fe";
      messageElement.style.marginLeft = "auto";
    } else {
      messageElement.style.backgroundColor = "#f5f5f5";
      messageElement.style.marginRight = "auto";
    }

    // メッセージ内容
    const contentElement = document.createElement("div");
    contentElement.textContent = message.content;
    messageElement.appendChild(contentElement);

    // タイムスタンプ
    const timestampElement = document.createElement("div");
    timestampElement.style.fontSize = "0.8em";
    timestampElement.style.color = "#888";
    timestampElement.textContent = message.timestamp.toLocaleTimeString();
    messageElement.appendChild(timestampElement);

    // チャット履歴に追加
    log(`🔍 UI: チャット履歴にメッセージを追加します`);
    chatHistoryElement.appendChild(messageElement);

    // 自動スクロール
    chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;

    log(`🔍 UI: チャットメッセージの表示が完了しました`);
  } catch (error) {
    log(
      `❌ UI: チャットメッセージ表示エラー: ${
        error instanceof Error ? error.message : "不明なエラー"
      }`
    );
    console.error("チャットメッセージ表示エラー:", error);
  }
}

// チャットメッセージを送信する関数
async function sendChatMessage(content: string) {
  try {
    log(`🔍 UI: チャットメッセージ送信開始: ${content}`);

    if (!content.trim()) {
      log(`❌ UI: 空のメッセージは送信できません`);
      return;
    }

    // ユーザーメッセージをチャット履歴に追加
    const userMessage: ChatMessage = {
      role: "user",
      content,
      timestamp: new Date(),
    };

    log(`🔍 UI: ユーザーメッセージをチャット履歴に追加します`);
    chatHistory.push(userMessage);

    // ユーザーメッセージを表示
    log(`🔍 UI: ユーザーメッセージを表示します`);
    try {
      displayChatMessage(userMessage);
    } catch (displayError) {
      log(
        `❌ UI: ユーザーメッセージ表示エラー: ${
          displayError instanceof Error ? displayError.message : "不明なエラー"
        }`
      );
      console.error("ユーザーメッセージ表示エラー:", displayError);
    }

    // 送信中の表示
    const chatInput = document.getElementById("chat-input") as HTMLTextAreaElement;
    const sendButton = document.getElementById("send-button") as HTMLButtonElement;

    if (!chatInput || !sendButton) {
      log(`❌ UI: チャット入力または送信ボタンの取得に失敗しました`);
      return;
    }

    log(`🔍 UI: 送信中の表示に更新します`);
    chatInput.disabled = true;
    sendButton.disabled = true;
    sendButton.textContent = "送信中...";

    try {
      // サーバーにリクエスト送信
      log(`🔍 UI: サーバーにリクエストを送信します: ${content}`);
      const response = await sendQuestionRequest(content, { chatHistory }, undefined);
      log(`🔍 UI: サーバーからのレスポンス: ${JSON.stringify(response)}`);

      // 入力欄と送信ボタンを元に戻す
      log(`🔍 UI: 入力欄と送信ボタンを元に戻します`);
      chatInput.disabled = false;
      sendButton.disabled = false;
      sendButton.textContent = "送信";
      chatInput.value = "";
      chatInput.focus();

      if (response.success && response.data) {
        // アシスタントの応答をチャット履歴に追加
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response.data.answer,
          timestamp: new Date(),
        };

        log(`🔍 UI: アシスタントメッセージをチャット履歴に追加します`);
        chatHistory.push(assistantMessage);

        // アシスタントメッセージを表示
        log(`🔍 UI: アシスタントメッセージを表示します`);
        try {
          displayChatMessage(assistantMessage);
        } catch (displayError) {
          log(
            `❌ UI: アシスタントメッセージ表示エラー: ${
              displayError instanceof Error ? displayError.message : "不明なエラー"
            }`
          );
          console.error("アシスタントメッセージ表示エラー:", displayError);
        }

        log(`🔍 UI: アシスタント応答受信: ${response.data.answer}`);
      } else {
        // エラーメッセージをチャット履歴に追加
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: `エラーが発生しました: ${response.error || "不明なエラー"}`,
          timestamp: new Date(),
        };

        log(`🔍 UI: エラーメッセージをチャット履歴に追加します`);
        chatHistory.push(errorMessage);

        // エラーメッセージを表示
        log(`🔍 UI: エラーメッセージを表示します`);
        try {
          displayChatMessage(errorMessage);
        } catch (displayError) {
          log(
            `❌ UI: エラーメッセージ表示エラー: ${
              displayError instanceof Error ? displayError.message : "不明なエラー"
            }`
          );
          console.error("エラーメッセージ表示エラー:", displayError);
        }

        log(`❌ UI: チャットリクエストエラー: ${response.error}`);
      }
    } catch (requestError) {
      log(
        `❌ UI: チャットリクエスト例外: ${
          requestError instanceof Error ? requestError.message : "不明なエラー"
        }`
      );
      console.error("チャットリクエスト例外:", requestError);

      // エラーメッセージをチャット履歴に追加
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: `エラーが発生しました: ${
          requestError instanceof Error ? requestError.message : "不明なエラー"
        }`,
        timestamp: new Date(),
      };

      log(`🔍 UI: エラーメッセージをチャット履歴に追加します`);
      chatHistory.push(errorMessage);

      // エラーメッセージを表示
      log(`🔍 UI: エラーメッセージを表示します`);
      try {
        displayChatMessage(errorMessage);
      } catch (displayError) {
        log(
          `❌ UI: エラーメッセージ表示エラー: ${
            displayError instanceof Error ? displayError.message : "不明なエラー"
          }`
        );
        console.error("エラーメッセージ表示エラー:", displayError);
      }

      // 入力欄と送信ボタンを元に戻す
      chatInput.disabled = false;
      sendButton.disabled = false;
      sendButton.textContent = "送信";
    }
  } catch (error) {
    log(
      `❌ UI: チャットメッセージ送信関数でエラーが発生しました: ${
        error instanceof Error ? error.message : "不明なエラー"
      }`
    );
    console.error("チャットメッセージ送信関数でエラーが発生しました:", error);
  }
}

// スクリプトが読み込まれたことをログに記録
log("🔍 UI: スクリプトが読み込まれました");

// チャット入力と送信ボタンのイベントリスナー設定
const chatInput = document.getElementById("chat-input") as HTMLTextAreaElement;
const sendButton = document.getElementById("send-button") as HTMLButtonElement;

if (chatInput && sendButton) {
  log("🔍 UI: チャット入力と送信ボタンを取得しました");

  // 送信ボタンクリック時
  sendButton.addEventListener("click", () => {
    log("🔍 UI: 送信ボタンがクリックされました");
    try {
      sendChatMessage(chatInput.value);
    } catch (error) {
      log(
        `❌ UI: 送信ボタンクリックエラー: ${
          error instanceof Error ? error.message : "不明なエラー"
        }`
      );
      console.error("送信ボタンクリックエラー:", error);
    }
  });

  // Enterキー押下時（Shift+Enterは改行）
  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      log("🔍 UI: Enterキーが押されました");
      event.preventDefault();
      try {
        sendChatMessage(chatInput.value);
      } catch (error) {
        log(
          `❌ UI: Enterキー押下エラー: ${error instanceof Error ? error.message : "不明なエラー"}`
        );
        console.error("Enterキー押下エラー:", error);
      }
    }
  });
} else {
  log("❌ UI: チャット入力または送信ボタンの取得に失敗しました");
}

// メッセージ受信イベントリスナーの設定
window.onmessage = (event) => {
  log("🔍 UI: メッセージイベントを受信しました");
  log(`🔍 UI: event.data: ${JSON.stringify(event.data)}`);

  // Figmaプラグインからのメッセージかどうかを確認
  if (!event.data.pluginMessage) {
    log("❌ UI: Figmaプラグインからのメッセージではありません");
    return;
  }

  const message = event.data.pluginMessage;
  log(`🔍 UI: pluginMessage: ${JSON.stringify(message)}`);
  log(`🔍 UI: メッセージタイプ: ${message.type}`);
};

// サーバー接続状態の確認関数
async function checkServerConnection() {
  const indicator = document.getElementById("server-status-indicator");
  const statusText = document.getElementById("server-status-text");

  if (!indicator || !statusText) return;

  // ステータスインジケーターのクラスをリセット
  indicator.classList.remove("status-connected", "status-disconnected", "status-checking");
  indicator.classList.add("status-checking");
  statusText.textContent = "サーバー接続状態: 確認中...";

  log("🔍 UI: サーバー接続状態を確認しています...");

  try {
    const response = await fetch("http://localhost:3000/status", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      mode: "cors",
      cache: "no-cache",
    });

    if (response.ok) {
      const data = await response.json();
      log(`🔍 UI: サーバー接続成功: ${JSON.stringify(data)}`);
      indicator.classList.add("status-connected");
      statusText.textContent = "サーバー接続状態: 接続済み";
      return true;
    } else {
      log(`❌ UI: サーバー接続エラー: ${response.status} ${response.statusText}`);
      indicator.classList.add("status-disconnected");
      statusText.textContent = `サーバー接続状態: 未接続 (${response.status} ${response.statusText})`;
      return false;
    }
  } catch (error) {
    log(`❌ UI: サーバー接続エラー: ${error instanceof Error ? error.message : "不明なエラー"}`);

    // 接続拒否エラーの場合、サーバー起動方法を表示
    const errorMessage = error instanceof Error ? error.message : "不明なエラー";
    if (errorMessage.includes("Connection refused") || errorMessage.includes("Failed to fetch")) {
      log("❌ UI: サーバーが起動していません。以下のコマンドでサーバーを起動してください：");
      log("🔧 UI: cd server && npm start -- --api-key=YOUR_API_KEY");
      indicator.classList.add("status-disconnected");
      statusText.textContent = "サーバー接続状態: 未接続 (サーバーが起動していません)";
    } else {
      indicator.classList.add("status-disconnected");
      statusText.textContent = `サーバー接続状態: 未接続 (${errorMessage})`;
    }

    return false;
  }
}

// 定期的にサーバー接続状態を確認
function startServerStatusCheck() {
  // 初回確認
  checkServerConnection();

  // 10秒ごとに確認
  setInterval(checkServerConnection, 10000);
}

// サーバー接続状態の確認を開始
startServerStatusCheck();

log("🔍 UI: UIの初期化が完了しました");
