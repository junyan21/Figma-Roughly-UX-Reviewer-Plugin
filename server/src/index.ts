import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createReviewRouter } from "./routes/review";
import { createAskRouter } from "./routes/ask";
import { createModelsRouter } from "./routes/models";
import { statusRouter } from "./routes/status";
import { parseArgs } from "node:util";

// コマンドライン引数の解析
const { values } = parseArgs({
  options: {
    "api-key": { type: "string" },
    port: { type: "string", default: "3000" },
  },
});

// APIキーの取得
const apiKey = values["api-key"];
if (!apiKey) {
  console.error("APIキーが指定されていません。");
  console.error("使用方法: npm start -- --api-key=YOUR_API_KEY");
  process.exit(1);
}

// ポート番号の取得
const port = parseInt(values["port"] as string, 10);

// Honoアプリケーションの作成
const app = new Hono();

// ミドルウェアの設定
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
  })
);

// ルーターの設定（APIキーを渡す）
app.route("/review", createReviewRouter(apiKey));
app.route("/ask", createAskRouter(apiKey));
app.route("/models", createModelsRouter(apiKey));
app.route("/status", statusRouter);

// 静的ファイルの提供（将来的な拡張用）
app.use("*", serveStatic({ root: "./public" }));

// ルートパス
app.get("/", (c) => {
  return c.json({
    message: "Zakkuri UX Reviewer API",
    status: "running",
    endpoints: [
      { path: "/status", method: "GET", description: "サーバーの状態を取得" },
      { path: "/review", method: "POST", description: "UXレビューを実行" },
      { path: "/ask", method: "POST", description: "追加質問を送信" },
      { path: "/models", method: "GET", description: "利用可能なモデルリストを取得" },
    ],
  });
});

// サーバーの起動
console.log(`サーバーを起動しています... (ポート: ${port})`);
serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`サーバーが起動しました: http://localhost:${info.port}`);
    console.log("Ctrl+Cで終了");
  }
);
