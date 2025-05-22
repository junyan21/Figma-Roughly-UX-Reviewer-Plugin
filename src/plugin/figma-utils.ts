import { LayerInfo } from "./types";
// グローバル宣言を使用するため、figmaとSceneNodeのインポートは不要

/**
 * 選択されたノードからレイヤー情報を抽出する
 */
// ファイルURLの情報を保持するグローバル変数
let cachedFileId: string | null = null;
let pendingUrlRequests: Map<string, ((url: string) => void)[]> = new Map();

// URLを生成する共通関数
function generateFigmaUrl(fileId: string, fileName: string, nodeId: string): string {
  const encodedFileName = encodeURIComponent(fileName).replace(/%20/g, "-");
  const nodeIdForUrl = nodeId.replace(/:/g, "-");
  return `https://www.figma.com/file/${fileId}/${encodedFileName}?node-id=${nodeIdForUrl}`;
}

// UIからのメッセージを処理するハンドラーを設定
figma.ui.onmessage = (msg) => {
  if (msg.type === "FILE_URL_INFO") {
    // キャッシュを更新
    cachedFileId = msg.fileId;

    // このノードIDに対する保留中のリクエストがあれば解決
    const nodeId = msg.nodeId;
    if (pendingUrlRequests.has(nodeId)) {
      const callbacks = pendingUrlRequests.get(nodeId) || [];
      const url = generateFigmaUrl(msg.fileId, msg.fileName, nodeId);
      callbacks.forEach((callback) => callback(url));
      pendingUrlRequests.delete(nodeId);
    }
  }
};

/**
 * ノードのURLを取得する
 */
export async function getNodeUrl(nodeId: string): Promise<string> {
  try {
    // キャッシュされたファイルIDがあれば使用
    if (cachedFileId) {
      // ファイル名は直接figmaから取得
      const fileName = figma.root.name;
      return generateFigmaUrl(cachedFileId, fileName, nodeId);
    } else {
      // キャッシュがない場合は新しいリクエストを作成
      return new Promise((resolve) => {
        pendingUrlRequests.set(nodeId, [resolve]);
        figma.ui.postMessage({
          type: "GET_FILE_URL_INFO",
          nodeId,
        });
      });
    }
  } catch (error) {
    console.error("URL取得エラー:", error);
    return "";
  }
}

export function extractLayerInfo(node: SceneNode): LayerInfo {
  // 基本情報
  let url = "";

  try {
    // キャッシュされたファイルIDがあれば使用
    if (cachedFileId) {
      const fileName = figma.root.name;
      url = generateFigmaUrl(cachedFileId, fileName, node.id);
    } else {
      // UIにファイルIDリクエストを送信
      figma.ui.postMessage({
        type: "GET_FILE_ID",
        nodeId: node.id,
      });

      // 一時的なURLを設定（後でUIからの応答で更新される）
      url = `https://www.figma.com/file/unknown/Untitled?node-id=${node.id.replace(/:/g, "-")}`;

      // このノードIDに対する保留中のリクエストを登録
      if (!pendingUrlRequests.has(node.id)) {
        pendingUrlRequests.set(node.id, []);
      }
    }
  } catch (error) {
    // エラー時のフォールバック
    url = `https://www.figma.com/file/unknown/Untitled?node-id=${node.id.replace(/:/g, "-")}`;
  }

  const info: LayerInfo = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
    locked: node.locked,
    x: "x" in node ? node.x : undefined,
    y: "y" in node ? node.y : undefined,
    width: "width" in node ? node.width : undefined,
    height: "height" in node ? node.height : undefined,
    url: url,
  };

  // 塗りの情報
  if ("fills" in node && node.fills) {
    info.fills = JSON.parse(JSON.stringify(node.fills));
  }

  // ストロークの情報
  if ("strokes" in node && node.strokes) {
    info.strokes = JSON.parse(JSON.stringify(node.strokes));
  }

  // エフェクトの情報
  if ("effects" in node && node.effects) {
    info.effects = JSON.parse(JSON.stringify(node.effects));
  }

  // テキスト情報
  if (node.type === "TEXT") {
    info.characters = node.characters;
    info.fontSize = node.fontSize as any;
    info.fontName = JSON.parse(JSON.stringify(node.fontName));
  }

  // 子ノードの情報
  if ("children" in node && node.children) {
    info.children = node.children.map((child) => extractLayerInfo(child));
  }

  return info;
}

/**
 * 選択されたノードの情報を取得する
 */
export function getSelectedNodesInfo(): LayerInfo[] {
  const selectedNodes = figma.currentPage.selection;
  return selectedNodes.map((node) => extractLayerInfo(node));
}

/**
 * 選択されたノードのスクリーンショットを取得する（将来的な拡張用）
 */
export async function getNodeScreenshot(node: SceneNode): Promise<Uint8Array | null> {
  if ("exportAsync" in node) {
    try {
      const result = await node.exportAsync({
        format: "PNG",
        constraint: { type: "SCALE", value: 2 },
      });
      return result;
    } catch (error) {
      return null;
    }
  }
  return null;
}
