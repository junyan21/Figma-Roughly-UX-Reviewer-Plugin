import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createClaudeService } from "../services/claude";

// レビュールーターを作成する関数
export function createReviewRouter(apiKey: string): Hono {
  const router = new Hono();

  // リクエストの検証スキーマ
  const reviewRequestSchema = z.object({
    layerInfo: z.any(),
    model: z.string().optional(),
  });

  // UXレビューを実行
  router.post("/", zValidator("json", reviewRequestSchema), async (c) => {
    try {
      const { layerInfo, model } = c.req.valid("json");

      // APIキーを使用してClaudeServiceを初期化
      const claudeService = createClaudeService(apiKey);

      // Claude APIを使用してレビューを実行
      const reviewResult = await claudeService.generateReview(layerInfo, model);

      return c.json({
        success: true,
        data: reviewResult,
      });
    } catch (error) {
      console.error("レビュー実行エラー:", error);

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
export const reviewRouter = new Hono();
