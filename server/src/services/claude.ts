import Anthropic from "@anthropic-ai/sdk";
import { ReviewResult } from "../types/api";

// Claude APIサービス
class ClaudeService {
  private client: Anthropic;

  constructor(apiKey: string) {
    // APIキーを引数から取得
    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  /**
   * UXレビューを生成する
   */
  async generateReview(layerInfo: any, model?: string): Promise<ReviewResult> {
    try {
      // デフォルトモデルの設定
      const selectedModel = model || "claude-3-haiku-20240307";

      // プロンプトの生成
      const prompt = this.generateReviewPrompt(layerInfo);

      // Claude APIにリクエストを送信
      const response = await this.client.messages.create({
        model: selectedModel,
        max_tokens: 4000,
        temperature: 0.7,
        system:
          "あなたはUXデザインの専門家です。ヤコブ・ニールセンの10ヒューリスティック原則に基づいて、Figmaのデザインを分析し、具体的で実用的なフィードバックを提供してください。",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      // レスポンスのパース
      // 新しいSDKでは、content[0]のtextプロパティが直接アクセスできないため、
      // typeがtextのコンテンツブロックからテキストを取得する
      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock || !("text" in textBlock)) {
        throw new Error("テキストレスポンスが見つかりませんでした");
      }

      return this.parseReviewResponse(textBlock.text);
    } catch (error) {
      console.error("Claude APIエラー:", error);
      throw new Error("レビューの生成に失敗しました");
    }
  }

  /**
   * 追加質問への回答を生成する
   */
  async generateAnswer(question: string, context: any, model?: string): Promise<string> {
    try {
      // デフォルトモデルの設定
      const selectedModel = model || "claude-3-haiku-20240307";

      // プロンプトの生成
      const prompt = this.generateAnswerPrompt(question, context);

      // Claude APIにリクエストを送信
      const response = await this.client.messages.create({
        model: selectedModel,
        max_tokens: 2000,
        temperature: 0.7,
        system:
          "あなたはUXデザインの専門家です。ユーザーの質問に対して、具体的で実用的な回答を提供してください。",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      // 新しいSDKでは、content[0]のtextプロパティが直接アクセスできないため、
      // typeがtextのコンテンツブロックからテキストを取得する
      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock || !("text" in textBlock)) {
        throw new Error("テキストレスポンスが見つかりませんでした");
      }

      return textBlock.text;
    } catch (error) {
      console.error("Claude APIエラー:", error);
      throw new Error("回答の生成に失敗しました");
    }
  }

  /**
   * レビュー用のプロンプトを生成する
   */
  private generateReviewPrompt(layerInfo: any): string {
    return `
以下のFigmaレイヤー情報を分析し、ヤコブ・ニールセンの10ヒューリスティック原則に基づいてUXレビューを行ってください。

## レイヤー情報
${JSON.stringify(layerInfo, null, 2)}

## レビュー観点
ヤコブ・ニールセンの10ヒューリスティック原則:
1. システム状態の可視性
2. システムと実世界の一致
3. ユーザーコントロールと自由
4. 一貫性と標準
5. エラー防止
6. 認識よりも想起
7. 柔軟性と効率性
8. 美的でミニマリストなデザイン
9. エラーの認識・診断・回復の手助け
10. ヘルプとドキュメント

## 出力形式
以下の形式でレビュー結果を出力してください:

1. 全体サマリー（100-150文字）
2. 良い点（3-5項目）
3. 改善点（3-5項目）
4. 各ヒューリスティック原則ごとの詳細分析

レビューは日本語で行ってください。
`;
  }

  /**
   * 追加質問用のプロンプトを生成する
   */
  private generateAnswerPrompt(question: string, context: any): string {
    const reviewResult = context.reviewResult
      ? JSON.stringify(context.reviewResult, null, 2)
      : "情報なし";
    const chatHistory = context.chatHistory
      ? context.chatHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join("\n")
      : "情報なし";

    return `
## 質問
${question}

## レビュー結果
${reviewResult}

## 過去の会話履歴
${chatHistory}

上記の情報を参考に、質問に対して具体的で実用的な回答を日本語で提供してください。
`;
  }

  /**
   * レビューレスポンスをパースする
   */
  private parseReviewResponse(text: string): ReviewResult {
    try {
      // 全体サマリーの抽出
      const summaryMatch = text.match(/全体サマリー[：:]\s*([\s\S]*?)(?=\n\n|$)/i);
      const summary = summaryMatch ? summaryMatch[1].trim() : "全体サマリーが見つかりませんでした";

      // 良い点の抽出
      const goodPointsMatch = text.match(/良い点[：:]\s*([\s\S]*?)(?=\n\n改善点|$)/i);
      const goodPointsText = goodPointsMatch ? goodPointsMatch[1].trim() : "";
      const goodPoints = goodPointsText
        .split(/\n-|\n\d+\./)
        .map((point) => point.trim())
        .filter((point) => point.length > 0);

      // 改善点の抽出
      const badPointsMatch = text.match(/改善点[：:]\s*([\s\S]*?)(?=\n\n各ヒューリスティック|$)/i);
      const badPointsText = badPointsMatch ? badPointsMatch[1].trim() : "";
      const badPoints = badPointsText
        .split(/\n-|\n\d+\./)
        .map((point) => point.trim())
        .filter((point) => point.length > 0);

      // 詳細分析の抽出
      const detailedAnalysis: Record<string, string> = {};

      // 10のヒューリスティック原則を順番に検索
      const principles = [
        "システム状態の可視性",
        "システムと実世界の一致",
        "ユーザーコントロールと自由",
        "一貫性と標準",
        "エラー防止",
        "認識よりも想起",
        "柔軟性と効率性",
        "美的でミニマリストなデザイン",
        "エラーの認識・診断・回復の手助け",
        "ヘルプとドキュメント",
      ];

      for (let i = 0; i < principles.length; i++) {
        const principle = principles[i];
        const nextPrinciple = principles[i + 1];

        // 正規表現パターンの作成
        const pattern = nextPrinciple
          ? new RegExp(`${principle}[：:](.*?)(?=${nextPrinciple}|$)`, "s")
          : new RegExp(`${principle}[：:](.*?)$`, "s");

        const match = text.match(pattern);
        if (match && match[1]) {
          detailedAnalysis[principle] = match[1].trim();
        } else {
          detailedAnalysis[principle] = "分析情報なし";
        }
      }

      return {
        summary,
        goodPoints: goodPoints.length > 0 ? goodPoints : ["良い点が見つかりませんでした"],
        badPoints: badPoints.length > 0 ? badPoints : ["改善点が見つかりませんでした"],
        detailedAnalysis,
      };
    } catch (error) {
      console.error("レスポンスのパースエラー:", error);

      // エラー時のデフォルトレスポンス
      return {
        summary: "レスポンスのパースに失敗しました",
        goodPoints: ["パースエラーが発生しました"],
        badPoints: ["パースエラーが発生しました"],
        detailedAnalysis: {
          エラー: "レスポンスのパースに失敗しました",
        },
      };
    }
  }
}

// サービスのファクトリー関数をエクスポート
export function createClaudeService(apiKey: string): ClaudeService {
  return new ClaudeService(apiKey);
}
