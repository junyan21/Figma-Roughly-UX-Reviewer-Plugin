// UIを表示
console.log("🔍 Figmaプラグイン: 初期化開始");
figma.showUI(__html__, { width: 450, height: 650 });
console.log("🔍 Figmaプラグイン: UIを表示しました");

// UIからのメッセージを処理するハンドラーを設定
console.log("🔍 Figmaプラグイン: figma.ui.onmessageイベントリスナーを設定します");

// UIからのメッセージを処理
figma.ui.onmessage = (msg) => {
  console.log("🔍 Figmaプラグイン: UIからメッセージを受信しました", msg);
  console.log("🔍 Figmaプラグイン: メッセージタイプ:", msg.type);
  console.log("🔍 Figmaプラグイン: メッセージの完全な内容:", JSON.stringify(msg));

  // メッセージの受信時刻を記録（デバッグ用）
  console.log("🔍 Figmaプラグイン: メッセージ受信時刻:", new Date().toISOString());

  // 受信したメッセージに対する応答を送信
  try {
    figma.ui.postMessage({
      type: "message-received",
      originalType: msg.type,
      timestamp: new Date().toISOString(),
      message: "メッセージを正常に受信しました",
    });
    console.log("🔍 Figmaプラグイン: 応答メッセージを送信しました");
  } catch (error) {
    console.error("❌ Figmaプラグイン: 応答メッセージの送信に失敗しました", error);
  }
};

console.log("🔍 Figmaプラグイン: 初期化完了");
