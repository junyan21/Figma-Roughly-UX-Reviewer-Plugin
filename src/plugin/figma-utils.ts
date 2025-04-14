import { LayerInfo } from "./types";
// グローバル宣言を使用するため、figmaとSceneNodeのインポートは不要

/**
 * 選択されたノードからレイヤー情報を抽出する
 */
export function extractLayerInfo(node: SceneNode): LayerInfo {
  // 基本情報
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
  if (selectedNodes.length === 0) {
    throw new Error("レイヤーが選択されていません");
  }

  return selectedNodes.map((node) => extractLayerInfo(node));
}

/**
 * 選択されたノードのスクリーンショットを取得する（将来的な拡張用）
 */
export async function getNodeScreenshot(node: SceneNode): Promise<Uint8Array | null> {
  if ("exportAsync" in node) {
    try {
      return await node.exportAsync({
        format: "PNG",
        constraint: { type: "SCALE", value: 2 },
      });
    } catch (error) {
      console.error("スクリーンショットの取得に失敗しました:", error);
      return null;
    }
  }
  return null;
}
