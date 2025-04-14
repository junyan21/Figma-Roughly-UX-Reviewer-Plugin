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
  console.log("🔍 figma-utils: 選択されたノードの情報を取得します");

  const selectedNodes = figma.currentPage.selection;
  console.log("🔍 figma-utils: 選択されたノード数", selectedNodes.length);

  if (selectedNodes.length === 0) {
    console.error("❌ figma-utils: レイヤーが選択されていません");
    throw new Error("レイヤーが選択されていません");
  }

  console.log("🔍 figma-utils: 選択されたノードの詳細情報を抽出します");
  const result = selectedNodes.map((node) => {
    console.log(`🔍 figma-utils: ノード「${node.name}」(${node.type})の情報を抽出中`);
    return extractLayerInfo(node);
  });

  console.log("🔍 figma-utils: ノード情報抽出完了", result.length + "個のノード情報");
  return result;
}

/**
 * 選択されたノードのスクリーンショットを取得する（将来的な拡張用）
 */
export async function getNodeScreenshot(node: SceneNode): Promise<Uint8Array | null> {
  console.log(`🔍 figma-utils: ノード「${node.name}」のスクリーンショットを取得します`);

  if ("exportAsync" in node) {
    try {
      console.log("🔍 figma-utils: exportAsyncを実行します");
      const result = await node.exportAsync({
        format: "PNG",
        constraint: { type: "SCALE", value: 2 },
      });
      console.log("🔍 figma-utils: スクリーンショット取得成功", result.byteLength + "バイト");
      return result;
    } catch (error) {
      console.error("❌ figma-utils: スクリーンショットの取得に失敗しました:", error);
      return null;
    }
  }
  console.log("❌ figma-utils: このノードはexportAsyncをサポートしていません");
  return null;
}
