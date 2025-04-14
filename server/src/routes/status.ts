import { Hono } from "hono";

// ステータスルーター
export const statusRouter = new Hono();

// サーバーの状態を取得
statusRouter.get("/", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});
