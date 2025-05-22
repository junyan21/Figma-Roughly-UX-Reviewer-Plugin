import { EventHandler } from "@create-figma-plugin/utilities";

// プラグインとUI間のメッセージ型
export interface PluginMessage {
  type: string;
  [key: string]: any;
}

// レビュー結果の型
export interface ReviewResult {
  summary: string;
  goodPoints: string[];
  badPoints: string[];
  detailedAnalysis: {
    [principle: string]: string;
  };
}

// 設定の型
export interface Settings {
  apiKey: string;
  serverUrl: string;
  port: number;
  model: string;
}

// レイヤー情報の型
export interface LayerInfo {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  children?: LayerInfo[];
  // 視覚的特性
  fills?: any[];
  strokes?: any[];
  effects?: any[];
  // テキスト特性
  characters?: string;
  fontSize?: number;
  fontName?: any;
  // 位置とサイズ
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // その他のプロパティ
  [key: string]: any;
}

// サーバーステータスの型
export interface ServerStatus {
  connected: boolean;
  message: string;
}

// APIレスポンスの型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// チャットメッセージの型
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// イベントハンドラー型
export interface SendMessageHandler extends EventHandler {
  name: "SEND_MESSAGE";
  data: {
    message: string;
  };
}

export interface MessageReceivedHandler extends EventHandler {
  name: "MESSAGE_RECEIVED";
  data: {
    type: string;
    originalType: string;
    timestamp: string;
    message: string;
  };
}

export interface StartReviewHandler extends EventHandler {
  name: "START_REVIEW";
  handler: () => void;
}

export interface SelectedLayersHandler extends EventHandler {
  name: "SELECTED_LAYERS";
  data: {
    layers: LayerInfo[];
  };
}
