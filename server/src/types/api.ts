/**
 * レビュー結果の型定義
 */
export interface ReviewResult {
  summary: string;
  goodPoints: string[];
  badPoints: string[];
  detailedAnalysis: {
    [principle: string]: string;
  };
}

/**
 * APIレスポンスの型定義
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * レビューリクエストの型定義
 */
export interface ReviewRequest {
  layerInfo: any;
  model?: string;
}

/**
 * 質問リクエストの型定義
 */
export interface AskRequest {
  question: string;
  context: {
    reviewResult?: ReviewResult;
    chatHistory?: {
      role: "user" | "assistant";
      content: string;
    }[];
  };
  model?: string;
}

/**
 * 質問レスポンスの型定義
 */
export interface AskResponse {
  answer: string;
}
