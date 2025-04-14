// Figmaプラグインの型定義
// 注意: このファイルはFigma Plugin APIの型定義を簡略化したものです

// Figma APIの型定義
export interface PluginMessage {
  type: string;
  [key: string]: any;
}

// グローバル宣言
// これらの型はFigmaプラグイン環境で自動的に利用可能になります
