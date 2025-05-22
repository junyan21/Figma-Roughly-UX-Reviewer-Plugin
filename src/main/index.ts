import { once, on, showUI } from "@create-figma-plugin/utilities";
import { MessageReceivedHandler, SendMessageHandler, StartReviewHandler } from "../utils/types";
import { getSelectedNodesInfo } from "../plugin/figma-utils";

export default function () {
  // リサイズイベントのハンドラーを設定
  on("RESIZE_WINDOW", function (windowSize: { width: number; height: number }) {
    const { width, height } = windowSize;
    figma.ui.resize(width, height);
  });

  // UIを表示
  showUI({
    width: 450,
    height: 650,
  });

  // 選択されたレイヤー情報を取得してUIに送信
  try {
    const selectedNodes = figma.currentPage.selection;
    if (selectedNodes.length > 0) {
      const selectedLayers = getSelectedNodesInfo();

      // UIに選択されたレイヤー情報を送信
      figma.ui.postMessage({
        type: "SELECTED_LAYERS",
        layers: selectedLayers,
      });
    } else {
      // 選択されたノードがない場合も通知
      figma.ui.postMessage({
        type: "SELECTED_LAYERS",
        layers: [],
      });
    }
  } catch (error) {
    // エラーメッセージをUIに送信
    figma.ui.postMessage({
      type: "SELECTED_LAYERS_ERROR",
      message: error instanceof Error ? error.message : "レイヤー情報の取得に失敗しました",
    });
  }

  // レイヤー選択変更イベントのハンドラーを設定
  figma.on("selectionchange", function () {
    try {
      const selectedLayers = getSelectedNodesInfo();

      // UIに選択されたレイヤー情報を送信
      figma.ui.postMessage({
        type: "SELECTED_LAYERS",
        layers: selectedLayers,
      });
    } catch (error) {
      // エラーメッセージをUIに送信
      figma.ui.postMessage({
        type: "SELECTED_LAYERS_ERROR",
        message: error instanceof Error ? error.message : "レイヤー情報の取得に失敗しました",
      });
    }
  });

  // レビュー開始イベントのハンドラーを設定
  on<StartReviewHandler>("START_REVIEW", function () {
    try {
      const selectedLayers = getSelectedNodesInfo();

      // UIにレビュー用のレイヤー情報を送信
      figma.ui.postMessage({
        type: "REVIEW_LAYERS",
        layers: selectedLayers,
      });
    } catch (error) {
      // エラーメッセージをUIに送信
      figma.ui.postMessage({
        type: "REVIEW_LAYERS_ERROR",
        message: error instanceof Error ? error.message : "レイヤー情報の取得に失敗しました",
      });
    }
  });

  // UIからのメッセージを処理
  on<SendMessageHandler>("SEND_MESSAGE", function (data) {
    // 受信したメッセージに対する応答を送信
    try {
      figma.ui.postMessage({
        type: "debug",
        originalType: "SEND_MESSAGE",
        timestamp: new Date().toISOString(),
        message: "メッセージを正常に受信しました",
      });
    } catch (error) {
      // エラー時は何もしない
    }
  });
}
