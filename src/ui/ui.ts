// デバッグ用のログ関数
function log(message: string) {
  const logArea = document.getElementById("log-area") as HTMLTextAreaElement;
  if (logArea) {
    logArea.value += message + "\n";
    console.log(message);
  }
}

// スクリプトが読み込まれたことをログに記録
log("🔍 UI: スクリプトが読み込まれました");

// テストボタンの取得
const testButton = document.getElementById("test-button");
log("🔍 UI: テストボタンを取得しました: " + (testButton ? "成功" : "失敗"));

// ボタンクリックイベントリスナーの設定
if (testButton) {
  testButton.addEventListener("click", () => {
    log("🔍 UI: テストボタンがクリックされました");

    try {
      const message = { pluginMessage: { type: "test-message" } };
      log(`🔍 UI: 送信するメッセージ: ${JSON.stringify(message)}`);

      // Figmaプラグイン環境でのメッセージ送信
      parent.postMessage(message, "*");
      log("🔍 UI: parent.postMessageを使用してメッセージ送信完了");
    } catch (error) {
      log(`❌ UI: メッセージ送信エラー: ${error}`);
    }
  });
} else {
  log("❌ UI: テストボタンが見つかりません");
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

log("🔍 UI: UIの初期化が完了しました");
