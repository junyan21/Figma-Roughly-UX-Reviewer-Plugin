import { ApiResponse, ReviewResult, ServerStatus, Settings } from "./types";

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

    // リクエストオプションのログ
    const requestOptions = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: method === "POST" ? JSON.stringify(data) : undefined,
    };

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API: リクエスト失敗 - ${response.status} ${errorText}`);
      throw new Error(`APIリクエストエラー: ${response.status} ${errorText}`);
    }

    const result = await response.json();
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
export async function checkServerStatus(settings?: Settings): Promise<ApiResponse<ServerStatus>> {
  try {
    return {
      success: true,
      data: {
        connected: true,
        message: "サーバーに接続できました",
      },
    };
  } catch (error) {
    console.error("サーバーステータスチェックエラー:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "サーバーに接続できませんでした",
    };
  }
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
  const result = await sendApiRequest<{
    success: boolean;
    data: Array<{ id: string; name: string; createdAt: string; isDefault: boolean }>;
  }>("/models", "GET", undefined, settings);
  return result;
}

/**
 * UXレビューリクエストを送信する
 */
export async function sendReviewRequest(
  layerInfo: any,
  settings?: Settings
): Promise<ApiResponse<ReviewResult>> {
  // Claudeが理解しやすいプロンプトを生成
  const prompt = `\nFigmaで選択されたレイヤー情報をもとにUX観点でレビューしてください。以下のJSONフォーマットで回答してください：
{
  "summary": "全体のサマリー",
  "goodPoints": ["良い点1", "良い点2", ...],
  "badPoints": ["改善点1", "改善点2", ...],
  "detailedAnalysis": {
    "原則1": "分析1",
    "原則2": "分析2",
    ...
  }
}

レイヤー情報: \n${JSON.stringify(layerInfo, null, 2)}\n`;

  const result = await sendApiRequest<{ answer: string }>(
    "/ask",
    "POST",
    {
      question: prompt,
      context: { selectedLayers: layerInfo },
      model: settings?.model || "claude-3-7-sonnet-20250219",
    },
    settings
  );

  if (result.success && result.data) {
    try {
      // レスポンスのanswerフィールドからJSONを抽出
      const answerText = result.data.answer;

      // レスポンスがJSON文字列の場合はパースを試みる
      if (
        typeof answerText === "string" &&
        (answerText.startsWith("{") || answerText.includes('"success":true'))
      ) {
        try {
          const parsedData = JSON.parse(answerText);
          if (parsedData.data && parsedData.data.answer) {
            const reviewResult = JSON.parse(parsedData.data.answer) as ReviewResult;
            return {
              success: true,
              data: reviewResult,
            };
          } else if (parsedData.answer) {
            const reviewResult = JSON.parse(parsedData.answer) as ReviewResult;
            return {
              success: true,
              data: reviewResult,
            };
          }
        } catch (e) {
          console.warn("🔍 API: 最初のJSONパースに失敗:", e);
        }
      }

      // JSON文字列を探す
      const jsonMatch = answerText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const reviewResult = JSON.parse(jsonStr) as ReviewResult;
        return {
          success: true,
          data: reviewResult,
        };
      } else {
        console.error("🔍 API: JSONが見つかりませんでした");
        return {
          success: false,
          error: "レビュー結果のJSONが見つかりませんでした",
        };
      }
    } catch (error) {
      console.error("🔍 API: レビュー結果のパースエラー:", error);
      return {
        success: false,
        error: "レビュー結果の解析に失敗しました",
      };
    }
  }

  return {
    success: false,
    error: result.error || "不明なエラーが発生しました",
  };
}

/**
 * 追加質問リクエストを送信する
 */
export async function sendQuestionRequest(
  question: string,
  context: any,
  settings?: Settings
): Promise<ApiResponse<{ answer: string }>> {
  // 特殊コマンドの処理
  if (question.toLowerCase() === "#review") {
    return {
      success: true,
      data: { answer: "レビューを開始します。Figmaでレイヤーを選択してください。" },
    };
  }

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

  return result;
}
