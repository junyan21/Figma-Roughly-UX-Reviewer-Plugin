import { getSelectedNodesInfo } from "./figma-utils";
import { PluginMessage } from "./figma-types";
// グローバル宣言を使用するため、figmaと__html__のインポートは不要

// UIを表示
console.log("🔍 Figmaプラグイン: 初期化開始");
figma.showUI(__html__, { width: 450, height: 650 });
console.log("🔍 Figmaプラグイン: UIを表示しました");

// UIからのメッセージを処理
figma.ui.onmessage = async (msg) => {
  console.log("🔍 Figmaプラグイン: UIからメッセージを受信しました", msg);

  try {
    switch (msg.type) {
      case "start-review":
        console.log("🔍 Figmaプラグイン: レビュー開始メッセージを受信しました");

        // 選択されたノードの情報を取得
        try {
          console.log("🔍 Figmaプラグイン: 選択されたノードの情報を取得します");
          const selectedNodesInfo = getSelectedNodesInfo();
          console.log(
            "🔍 Figmaプラグイン: ノード情報取得成功",
            selectedNodesInfo.length + "個のノード"
          );

          // UIにレイヤー情報を送信
          console.log("🔍 Figmaプラグイン: UIにレイヤー情報を送信します");
          figma.ui.postMessage({
            type: "review-data",
            layerInfo: selectedNodesInfo,
          });
          console.log("🔍 Figmaプラグイン: レイヤー情報送信完了");
        } catch (error) {
          console.error("❌ Figmaプラグイン: レイヤー情報取得エラー", error);
          figma.ui.postMessage({
            type: "error",
            error: error instanceof Error ? error.message : "レイヤーの情報取得に失敗しました",
          });
        }
        break;

      case "cancel":
        console.log("🔍 Figmaプラグイン: キャンセルメッセージを受信しました");
        // プラグインを閉じる
        figma.closePlugin();
        break;
    }
  } catch (error) {
    console.error("❌ Figmaプラグイン: 不明なエラーが発生しました", error);
    // エラーをUIに送信
    figma.ui.postMessage({
      type: "error",
      error: error instanceof Error ? error.message : "不明なエラーが発生しました",
    });
  }
};

console.log("🔍 Figmaプラグイン: 初期化完了");
