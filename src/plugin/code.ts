import { getSelectedNodesInfo } from "./figma-utils";
import { PluginMessage } from "./figma-types";
// グローバル宣言を使用するため、figmaと__html__のインポートは不要

// UIを表示
figma.showUI(__html__, { width: 450, height: 650 });

// UIからのメッセージを処理
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case "start-review":
        // 選択されたノードの情報を取得
        try {
          const selectedNodesInfo = getSelectedNodesInfo();

          // UIにレイヤー情報を送信
          figma.ui.postMessage({
            type: "review-data",
            layerInfo: selectedNodesInfo,
          });
        } catch (error) {
          figma.ui.postMessage({
            type: "error",
            error: error instanceof Error ? error.message : "レイヤーの情報取得に失敗しました",
          });
        }
        break;

      case "cancel":
        // プラグインを閉じる
        figma.closePlugin();
        break;
    }
  } catch (error) {
    // エラーをUIに送信
    figma.ui.postMessage({
      type: "error",
      error: error instanceof Error ? error.message : "不明なエラーが発生しました",
    });
  }
};
