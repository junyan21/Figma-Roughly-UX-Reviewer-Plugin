import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { claudeService } from "../services/claude";

// レビュールーター
export const reviewRouter = new Hono();

// リクエストの検証スキーマ
const reviewRequestSchema = z.object({
  layerInfo: z.any(),
  model: z.string().optional(),
});

// UXレビューを実行
reviewRouter.post("/", zValidator("json", reviewRequestSchema), async (c) => {
  try {
    const { layerInfo, model } = c.req.valid("json");

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
