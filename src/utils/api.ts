import { ApiResponse, ReviewResult, Settings } from "../plugin/types";

/**
 * APIリクエストを送信する
 */
export async function sendApiRequest<T>(
  endpoint: string,
  method: "GET" | "POST",
  data?: any,
  settings?: Settings
): Promise<ApiResponse<T>> {
  try {
    // 設定がない場合はデフォルト値を使用
    const serverUrl = settings?.serverUrl || "localhost";
    const port = settings?.port || 3000;
    const url = `http://${serverUrl}:${port}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: method === "POST" ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`APIリクエストエラー: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("APIリクエストエラー:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "不明なエラーが発生しました",
    };
  }
}

/**
 * サーバーの状態を確認する
 */
export async function checkServerStatus(
  settings?: Settings
): Promise<ApiResponse<{ status: string }>> {
  return sendApiRequest<{ status: string }>("/status", "GET", undefined, settings);
}

/**
 * UXレビューリクエストを送信する
 */
export async function sendReviewRequest(
  layerInfo: any,
  settings?: Settings
): Promise<ApiResponse<ReviewResult>> {
  return sendApiRequest<ReviewResult>(
    "/review",
    "POST",
    {
      layerInfo,
      model: settings?.model || "claude-3-haiku-20240307",
    },
    settings
  );
}

/**
 * 追加質問リクエストを送信する
 */
export async function sendQuestionRequest(
  question: string,
  context: any,
  settings?: Settings
): Promise<ApiResponse<{ answer: string }>> {
  return sendApiRequest<{ answer: string }>(
    "/ask",
    "POST",
    {
      question,
      context,
      model: settings?.model || "claude-3-haiku-20240307",
    },
    settings
  );
}
