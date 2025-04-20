import { h } from "preact";
import { render, useWindowResize } from "@create-figma-plugin/ui";
import { useCallback, useState, useEffect } from "preact/hooks";
import { emit, on } from "@create-figma-plugin/utilities";
import { Container, VerticalSpace, IconButton } from "@create-figma-plugin/ui";
import { ChatHistory } from "./components/ChatHistory";
import { ChatInput } from "./components/ChatInput";
import { ServerStatus } from "./components/ServerStatus";
import { SettingsDialog } from "./components/SettingsDialog";
import { ChatMessage, MessageReceivedHandler, SendMessageHandler, Settings } from "../utils/types";
import { sendQuestionRequest } from "../utils/api";
import { loadSettings, getDefaultSettings } from "../utils/storage";

function Plugin() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [settings, setSettings] = useState<Settings>(getDefaultSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 設定の読み込み
  useEffect(() => {
    const savedSettings = loadSettings();
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, []);

  // 設定ダイアログを開く
  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  // 設定ダイアログを閉じる
  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  // 設定変更時の処理
  const handleSettingsChange = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
  }, []);

  // リサイズ後にスクロールを最下部に移動（最新メッセージを表示）
  function scrollToBottom() {
    setTimeout(() => {
      const chatContainer = document.querySelector(".chat-history-container");
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  // ウィンドウリサイズ処理
  function onWindowResize(windowSize: { width: number; height: number }) {
    emit("RESIZE_WINDOW", windowSize);
    scrollToBottom();
  }

  useWindowResize(onWindowResize, {
    minWidth: 450,
    minHeight: 500,
    maxWidth: 800,
    maxHeight: 900,
  });

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
        // APIリクエスト送信（設定を渡す）
        const response = await sendQuestionRequest(content, { chatHistory }, settings);
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
          // 新しいメッセージが追加されたらスクロールを最下部に移動
          scrollToBottom();
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
    [isSending, chatHistory, settings]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* ヘッダー部分（サーバーステータスと設定ボタン） */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px",
        }}
      >
        <ServerStatus />
        <IconButton onClick={openSettings}>
          {/* マテリアルデザインの歯車アイコン */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"
            />
          </svg>
        </IconButton>
      </div>

      {/* チャット履歴（可変サイズ、残りのスペースを埋める） */}
      <div style={{ flexGrow: 1, overflow: "hidden" }}>
        <ChatHistory messages={chatHistory} />
      </div>

      {/* 入力部分（下部に固定） */}
      <div style={{ flexShrink: 0 }}>
        <ChatInput onSendMessage={handleSendMessage} disabled={isSending} />
      </div>

      {/* 設定ダイアログ */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}

export default render(Plugin);
