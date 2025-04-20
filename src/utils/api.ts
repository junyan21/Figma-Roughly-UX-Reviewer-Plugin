import { ApiResponse, ReviewResult, Settings } from "./types";

/**
 * APIリクエストを送信する
 */
export async function sendApiRequest<T>(
  endpoint: string,
  method: "GET" | "POST",
  data?: any,
  settings?: Settings
): Promise<ApiResponse<T>> {
  console.log(`🔍 API: ${method} リクエスト開始 - ${endpoint}`);

  try {
    // 設定がない場合はデフォルト値を使用
    const serverUrl = settings?.serverUrl || "localhost";
    const port = settings?.port || 3000;
    const url = `http://${serverUrl}:${port}${endpoint}`;
    console.log(`🔍 API: リクエスト先URL - ${url}`);

    // リクエストオプションのログ
    const requestOptions = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: method === "POST" ? JSON.stringify(data) : undefined,
    };
    console.log("🔍 API: リクエストオプション", requestOptions);

    if (method === "POST" && data) {
      console.log("🔍 API: 送信データ", data);
    }

    console.log("🔍 API: fetchリクエスト実行");
    const response = await fetch(url, requestOptions);
    console.log(`🔍 API: レスポンス受信 - ステータス: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API: リクエスト失敗 - ${response.status} ${errorText}`);
      throw new Error(`APIリクエストエラー: ${response.status} ${errorText}`);
    }

    console.log("🔍 API: レスポンスJSONをパース中");
    const result = await response.json();
    console.log("🔍 API: レスポンスデータ", result);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("❌ API: リクエストエラー:", error);
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
  console.log("🔍 API: サーバー状態確認リクエスト開始");
  const result = await sendApiRequest<{ status: string }>("/status", "GET", undefined, settings);
  console.log("🔍 API: サーバー状態確認結果", result);
  return result;
}

/**
 * 利用可能なモデルリストを取得する
 */
export async function fetchAvailableModels(settings?: Settings): Promise<
  ApiResponse<{
    success: boolean;
    data: Array<{ id: string; name: string; createdAt: string; isDefault: boolean }>;
  }>
> {
  console.log("🔍 API: モデルリスト取得リクエスト開始");
  const result = await sendApiRequest<{
    success: boolean;
    data: Array<{ id: string; name: string; createdAt: string; isDefault: boolean }>;
  }>("/models", "GET", undefined, settings);
  console.log("🔍 API: モデルリスト取得結果", result);
  return result;
}

/**
 * UXレビューリクエストを送信する
 */
export async function sendReviewRequest(
  layerInfo: any,
  settings?: Settings
): Promise<ApiResponse<ReviewResult>> {
  console.log("🔍 API: UXレビューリクエスト開始");
  console.log(`🔍 API: 使用モデル - ${settings?.model || "claude-3-7-sonnet-20250219"}`);
  console.log(`🔍 API: レイヤー情報 - ${layerInfo ? layerInfo.length + "個のノード" : "なし"}`);

  const result = await sendApiRequest<ReviewResult>(
    "/review",
    "POST",
    {
      layerInfo,
      model: settings?.model || "claude-3-7-sonnet-20250219",
    },
    settings
  );

  console.log("🔍 API: UXレビューリクエスト結果", result.success ? "成功" : "失敗");
  return result;
}

/**
 * 追加質問リクエストを送信する
 */
export async function sendQuestionRequest(
  question: string,
  context: any,
  settings?: Settings
): Promise<ApiResponse<{ answer: string }>> {
  console.log("🔍 API: 追加質問リクエスト開始");
  console.log(`🔍 API: 質問 - ${question}`);
  console.log(`🔍 API: 使用モデル - ${settings?.model || "claude-3-7-sonnet-20250219"}`);

  const result = await sendApiRequest<{ answer: string }>(
    "/ask",
    "POST",
    {
      question,
      context,
      model: settings?.model || "claude-3-7-sonnet-20250219",
    },
    settings
  );

  console.log("🔍 API: 追加質問リクエスト結果", result.success ? "成功" : "失敗");
  return result;
}
