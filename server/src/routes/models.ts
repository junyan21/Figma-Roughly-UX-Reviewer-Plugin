import { Hono } from "hono";
import { createClaudeService } from "../services/claude";

export function createModelsRouter(apiKey: string): Hono {
  const router = new Hono();

  router.get("/", async (c) => {
    try {
      // APIキーを使用してClaudeServiceを初期化
      const claudeService = createClaudeService(apiKey);

      // Anthropic APIから利用可能なモデルリストを取得
      const models = await claudeService.fetchAvailableModels();

      return c.json({
        success: true,
        data: models,
      });
    } catch (error) {
      console.error("モデルリスト取得エラー:", error);

      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "不明なエラーが発生しました",
        },
        500
      );
    }
  });

  return router;
}

// 後方互換性のために元のルーターも残しておく
export const modelsRouter = new Hono();
