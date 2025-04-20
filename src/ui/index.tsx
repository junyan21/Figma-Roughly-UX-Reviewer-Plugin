import { h } from "preact";
import { render } from "@create-figma-plugin/ui";
import { useCallback, useState } from "preact/hooks";
import { emit, on } from "@create-figma-plugin/utilities";
import { Container, VerticalSpace } from "@create-figma-plugin/ui";
import { ChatHistory } from "./components/ChatHistory";
import { ChatInput } from "./components/ChatInput";
import { ServerStatus } from "./components/ServerStatus";
import { ChatMessage, MessageReceivedHandler, SendMessageHandler } from "../utils/types";
import { sendQuestionRequest } from "../utils/api";

function Plugin() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  // メッセージ受信ハンドラーを設定
  on<MessageReceivedHandler>("MESSAGE_RECEIVED", (data) => {
    console.log("UIがメッセージを受信しました:", data);

    // システムメッセージをチャット履歴に追加（デバッグ用のみ）
    if (data.message && data.type === "debug") {
      const systemMessage: ChatMessage = {
        role: "assistant",
        content: `[デバッグ] ${data.message}`,
        timestamp: new Date(),
      };

      setChatHistory((prev) => [...prev, systemMessage]);
    }
    // 通常のメッセージ処理はAPIレスポンスで行うため、ここでは追加しない
  });

  // メッセージ送信処理
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isSending) return;

      // ユーザーメッセージをチャット履歴に追加
      const userMessage: ChatMessage = {
        role: "user",
        content,
        timestamp: new Date(),
      };

      setChatHistory((prev) => [...prev, userMessage]);
      setIsSending(true);

      // プラグインのメインコンテキストにメッセージを送信
      emit<SendMessageHandler>("SEND_MESSAGE", { message: content });

      try {
        // APIリクエスト送信
        const response = await sendQuestionRequest(content, { chatHistory }, undefined);
        console.log("APIレスポンス全体:", response); // 全体のレスポンスを確認

        if (response.success && response.data) {
          // レスポンスデータの構造を詳細にログ出力
          console.log("レスポンスデータ構造:", JSON.stringify(response.data));

          // データ構造に応じて適切に処理
          let answerText = "";

          // レスポンスがJSON文字列の場合はパースを試みる
          if (
            typeof response.data === "string" &&
            ((response.data as string).startsWith("{") ||
              (response.data as string).includes('"success":true'))
          ) {
            try {
              const parsedData = JSON.parse(response.data);
              if (parsedData.data && parsedData.data.answer) {
                answerText = parsedData.data.answer;
              } else if (parsedData.answer) {
                answerText = parsedData.answer;
              } else {
                answerText = response.data;
              }
            } catch (e) {
              console.warn("JSONパースに失敗:", e);
              answerText = response.data;
            }
          }
          // オブジェクトの場合は直接アクセス
          else if (typeof response.data === "object" && response.data !== null) {
            if ("answer" in response.data) {
              answerText = response.data.answer;
            } else {
              const firstProp = Object.values(response.data)[0];
              answerText =
                typeof firstProp === "string" ? firstProp : JSON.stringify(response.data);
            }
          }
          // 文字列の場合はそのまま使用
          else if (typeof response.data === "string") {
            answerText = response.data;
          }

          console.log("処理後の回答テキスト:", answerText);

          // アシスタントの応答をチャット履歴に追加
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: answerText || "レスポンスの処理に失敗しました",
            timestamp: new Date(),
          };

          setChatHistory((prev) => [...prev, assistantMessage]);
        } else {
          // エラーメッセージをチャット履歴に追加
          const errorMessage: ChatMessage = {
            role: "assistant",
            content: `エラーが発生しました: ${response.error || "不明なエラー"}`,
            timestamp: new Date(),
          };

          setChatHistory((prev) => [...prev, errorMessage]);
        }
      } catch (error) {
        // エラーメッセージをチャット履歴に追加
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: `エラーが発生しました: ${
            error instanceof Error ? error.message : "不明なエラー"
          }`,
          timestamp: new Date(),
        };

        setChatHistory((prev) => [...prev, errorMessage]);
      } finally {
        setIsSending(false);
      }
    },
    [isSending, chatHistory]
  );

  return (
    <Container space="medium">
      <VerticalSpace space="small" />
      <ServerStatus />
      <ChatHistory messages={chatHistory} />
      <ChatInput onSendMessage={handleSendMessage} disabled={isSending} />
    </Container>
  );
}

export default render(Plugin);
