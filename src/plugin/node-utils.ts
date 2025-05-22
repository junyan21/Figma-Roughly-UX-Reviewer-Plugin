import { LayerInfo } from "../utils/types";

export function extractLayerInfo(node: SceneNode): LayerInfo {
  const info: LayerInfo = {
    id: node.id,
    name: node.name,
    type: node.type,
    url: node.getPluginData("url") || "",
    visible: node.visible,
    locked: node.locked,
    properties: {},
  };

  // ノードタイプに応じてプロパティを抽出
  switch (node.type) {
    case "FRAME":
    case "GROUP":
    case "COMPONENT":
    case "INSTANCE":
      info.properties = {
        width: node.width,
        height: node.height,
        x: node.x,
        y: node.y,
        rotation: node.rotation,
        opacity: node.opacity,
        visible: node.visible,
        locked: node.locked,
        blendMode: node.blendMode,
        layoutMode: "layoutMode" in node ? node.layoutMode : undefined,
        primaryAxisSizingMode:
          "primaryAxisSizingMode" in node ? node.primaryAxisSizingMode : undefined,
        counterAxisSizingMode:
          "counterAxisSizingMode" in node ? node.counterAxisSizingMode : undefined,
        paddingLeft: "paddingLeft" in node ? node.paddingLeft : undefined,
        paddingRight: "paddingRight" in node ? node.paddingRight : undefined,
        paddingTop: "paddingTop" in node ? node.paddingTop : undefined,
        paddingBottom: "paddingBottom" in node ? node.paddingBottom : undefined,
        itemSpacing: "itemSpacing" in node ? node.itemSpacing : undefined,
        layoutWrap: "layoutWrap" in node ? node.layoutWrap : undefined,
        layoutAlign: "layoutAlign" in node ? node.layoutAlign : undefined,
        primaryAxisAlignItems:
          "primaryAxisAlignItems" in node ? node.primaryAxisAlignItems : undefined,
        counterAxisAlignItems:
          "counterAxisAlignItems" in node ? node.counterAxisAlignItems : undefined,
      };
      break;

    case "TEXT":
      info.properties = {
        width: node.width,
        height: node.height,
        x: node.x,
        y: node.y,
        rotation: node.rotation,
        opacity: node.opacity,
        visible: node.visible,
        locked: node.locked,
        blendMode: node.blendMode,
        characters: node.characters,
        fontSize: node.fontSize,
        fontName: node.fontName,
        textAlignHorizontal: node.textAlignHorizontal,
        textAlignVertical: node.textAlignVertical,
        letterSpacing: node.letterSpacing,
        lineHeight: node.lineHeight,
        textCase: node.textCase,
        textDecoration: node.textDecoration,
      };
      break;

    case "RECTANGLE":
    case "ELLIPSE":
    case "POLYGON":
    case "STAR":
    case "VECTOR":
    case "LINE":
      info.properties = {
        width: node.width,
        height: node.height,
        x: node.x,
        y: node.y,
        rotation: node.rotation,
        opacity: node.opacity,
        visible: node.visible,
        locked: node.locked,
        blendMode: node.blendMode,
        fills: "fills" in node ? node.fills : undefined,
        strokes: "strokes" in node ? node.strokes : undefined,
        strokeWeight: "strokeWeight" in node ? node.strokeWeight : undefined,
        strokeAlign: "strokeAlign" in node ? node.strokeAlign : undefined,
        strokeCap: "strokeCap" in node ? node.strokeCap : undefined,
        strokeJoin: "strokeJoin" in node ? node.strokeJoin : undefined,
        strokeMiterLimit: "strokeMiterLimit" in node ? node.strokeMiterLimit : undefined,
        dashPattern: "dashPattern" in node ? node.dashPattern : undefined,
      };
      break;
  }

  return info;
}
