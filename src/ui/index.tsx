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

        if (response.success && response.data) {
          // アシスタントの応答をチャット履歴に追加
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: response.data.answer,
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
