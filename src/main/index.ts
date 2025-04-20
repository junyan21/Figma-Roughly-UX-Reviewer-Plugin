import { once, showUI } from "@create-figma-plugin/utilities";
import { MessageReceivedHandler, SendMessageHandler } from "../utils/types";

export default function () {
  console.log("🔍 Figmaプラグイン: 初期化開始");

  // UIを表示
  showUI({
    width: 450,
    height: 650,
  });
  console.log("🔍 Figmaプラグイン: UIを表示しました");

  // UIからのメッセージを処理
  once<SendMessageHandler>("SEND_MESSAGE", function (data) {
    console.log("🔍 Figmaプラグイン: UIからメッセージを受信しました", data);
    console.log("🔍 Figmaプラグイン: メッセージタイプ: SEND_MESSAGE");
    console.log("🔍 Figmaプラグイン: メッセージの完全な内容:", JSON.stringify(data));

    // メッセージの受信時刻を記録（デバッグ用）
    console.log("🔍 Figmaプラグイン: メッセージ受信時刻:", new Date().toISOString());

    // 受信したメッセージに対する応答を送信
    try {
      figma.ui.postMessage({
        type: "debug", // デバッグ用のタイプを追加
        originalType: "SEND_MESSAGE",
        timestamp: new Date().toISOString(),
        message: "メッセージを正常に受信しました",
      });
      console.log("🔍 Figmaプラグイン: 応答メッセージを送信しました");
    } catch (error) {
      console.error("❌ Figmaプラグイン: 応答メッセージの送信に失敗しました", error);
    }
  });

  console.log("🔍 Figmaプラグイン: 初期化完了");
}
