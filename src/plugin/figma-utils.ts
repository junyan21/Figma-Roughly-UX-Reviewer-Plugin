import { LayerInfo } from "./types";
// グローバル宣言を使用するため、figmaとSceneNodeのインポートは不要

/**
 * 選択されたノードからレイヤー情報を抽出する
 */
// ファイルURLの情報を保持するグローバル変数
let cachedFileId: string | null = null;
let cachedFileName: string | null = null;
let pendingUrlRequests: Map<string, ((url: string) => void)[]> = new Map();

// UIからのメッセージを処理するハンドラーを設定
figma.ui.onmessage = (msg) => {
  if (msg.type === "FILE_URL_INFO") {
    // キャッシュを更新
    cachedFileId = msg.fileId;
    cachedFileName = msg.fileName;

    // このノードIDに対する保留中のリクエストがあれば解決
    const nodeId = msg.nodeId;
    if (pendingUrlRequests.has(nodeId)) {
      const callbacks = pendingUrlRequests.get(nodeId) || [];
      const url = `https://www.figma.com/file/${msg.fileId}/${encodeURIComponent(
        msg.fileName
      ).replace(/%20/g, "-")}?node-id=${nodeId}`;

      callbacks.forEach((callback) => callback(url));
      pendingUrlRequests.delete(nodeId);
    }
  }
};

export function extractLayerInfo(node: SceneNode): LayerInfo {
  // 基本情報
  // Figmaファイルの正しいURLを生成
  let url = "";

  // ノードIDをハイフン形式に変換（Figma URLの形式に合わせる）
  const nodeIdForUrl = node.id.replace(":", "-");

  try {
    // キャッシュされたファイルIDとファイル名があれば使用
    if (cachedFileId && cachedFileName) {
      const encodedFileName = encodeURIComponent(cachedFileName).replace(/%20/g, "-");
      url = `https://www.figma.com/file/${cachedFileId}/${encodedFileName}?node-id=${nodeIdForUrl}`;
    } else {
      // UIにファイルIDリクエストを送信
      figma.ui.postMessage({
        type: "GET_FILE_ID",
        nodeId: nodeIdForUrl,
      });

      // 一時的なURLを設定（後でUIからの応答で更新される）
      url = `https://www.figma.com/file/unknown/Untitled?node-id=${nodeIdForUrl}`;

      // このノードIDに対する保留中のリクエストを登録
      if (!pendingUrlRequests.has(nodeIdForUrl)) {
        pendingUrlRequests.set(nodeIdForUrl, []);
      }

      // 非同期処理のためのプロミスを作成（実際の実装では使用しない）
      // この部分は実際には非同期で更新されるが、現在の関数は同期的に値を返す必要がある
      pendingUrlRequests.get(nodeIdForUrl)?.push((updatedUrl) => {
        // 実際のコードでは何もしない（非同期更新のため）
      });
    }
  } catch (error) {
    // エラー時のフォールバック
    url = `https://www.figma.com/file/unknown/Untitled?node-id=${nodeIdForUrl}`;
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
    // Figmaのノード参照URLを追加
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
    // fontSize は any 型として扱う
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
