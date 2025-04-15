import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createClaudeService } from "../services/claude";

// 質問ルーターを作成する関数
export function createAskRouter(apiKey: string): Hono {
  const router = new Hono();

  // リクエストの検証スキーマ
  const askRequestSchema = z.object({
    question: z.string(),
    context: z.any(),
    model: z.string().optional(),
  });

  // 追加質問を送信
  router.post("/", zValidator("json", askRequestSchema), async (c) => {
    try {
      const { question, context, model } = c.req.valid("json");

      // APIキーを使用してClaudeServiceを初期化
      const claudeService = createClaudeService(apiKey);

      // Claude APIを使用して回答を生成
      const answer = await claudeService.generateAnswer(question, context, model);

      return c.json({
        success: true,
        data: { answer },
      });
    } catch (error) {
      console.error("質問処理エラー:", error);

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
export const askRouter = new Hono();
