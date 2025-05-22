import { h } from "preact";
import { render, useWindowResize } from "@create-figma-plugin/ui";
import { useCallback, useState, useEffect } from "preact/hooks";
import { emit, on } from "@create-figma-plugin/utilities";
import { Container, VerticalSpace, IconButton } from "@create-figma-plugin/ui";
import { ChatHistory } from "./components/ChatHistory";
import { ChatInput } from "./components/ChatInput";
import { SettingsDialog } from "./components/SettingsDialog";
import { ChatMessage, MessageReceivedHandler, SendMessageHandler, Settings } from "../utils/types";
import { sendQuestionRequest, checkServerStatus, sendReviewRequest } from "../utils/api";
import { loadSettings, getDefaultSettings } from "../utils/storage";

function Plugin() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [settings, setSettings] = useState<Settings>(getDefaultSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState<any[]>([]);
  const [serverStatus, setServerStatus] = useState<string>("確認中...");

  // レイヤー情報を表示する共通関数
  const displayLayerInfo = useCallback((layers: any[]) => {
    const layerMessage: ChatMessage = {
      role: "assistant",
      content:
        layers.length > 0
          ? `レイヤーが選択されています。レビューしますか？\n\n**選択レイヤー**: ${layers
              .map((l) => `[${l.name}](#layer-${l.id})`)
              .join(", ")}\n\n[レビューを開始する](#review)`
          : "レビュー対象のレイヤーのURLを入力してください。",
      timestamp: new Date(),
    };

    setChatHistory((prev) => {
      // 既存のレイヤー情報メッセージを探す
      const existingLayerMsgIndex = prev.findIndex(
        (msg) =>
          msg.role === "assistant" &&
          (msg.content.includes("レイヤーが選択されています") ||
            msg.content.includes("レビュー対象のレイヤーのURL"))
      );

      // サーバー接続メッセージの位置を探す
      const serverMsgIndex = prev.findIndex(
        (msg) =>
          msg.role === "assistant" &&
          (msg.content.includes("サーバーに接続しました") ||
            msg.content.includes("サーバーに接続できませんでした"))
      );

      if (existingLayerMsgIndex >= 0) {
        // 既存のレイヤー情報メッセージを更新
        const newHistory = [...prev];
        newHistory[existingLayerMsgIndex] = layerMessage;
        return newHistory;
      } else if (serverMsgIndex >= 0) {
        // サーバー接続メッセージの直後に挿入
        const newHistory = [...prev];
        newHistory.splice(serverMsgIndex + 1, 0, layerMessage);
        return newHistory;
      } else {
        // 新しいメッセージを追加
        return [...prev, layerMessage];
      }
    });
  }, []);

  // レイヤー情報を強制的に表示する関数
  const forceDisplayLayerInfo = useCallback(() => {
    if (selectedLayers.length > 0) {
      displayLayerInfo(selectedLayers);
    }
  }, [selectedLayers, displayLayerInfo]);

  // 初期化時の処理
  useEffect(() => {
    // 設定の読み込み
    const savedSettings = loadSettings();
    if (savedSettings) {
      setSettings(savedSettings);
    }

    // サーバー状態の確認
    checkServerStatus(savedSettings || undefined).then((response) => {
      if (response.success) {
        setServerStatus("接続済み");

        // サーバー接続後、選択されているレイヤーがあれば表示
        if (selectedLayers.length > 0) {
          forceDisplayLayerInfo();
        }
      } else {
        setServerStatus("未接続");

        // エラーメッセージをチャット履歴に追加
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: `サーバーに接続できませんでした: ${response.error}。サーバーが起動しているか確認してください。`,
          timestamp: new Date(),
        };
        setChatHistory([errorMessage]);
      }
    });

    // 定期的にサーバー状態を確認するタイマーを設定
    const checkServerConnection = async () => {
      const response = await checkServerStatus(settings);
      const currentStatus = response.success ? "接続済み" : "未接続";

      // 前回と状態が変わった場合のみメッセージを表示
      if (currentStatus !== serverStatus) {
        setServerStatus(currentStatus);

        if (currentStatus === "接続済み") {
          // 接続が回復した場合は何もしない
        } else {
          // 接続が切れた場合のメッセージ
          const disconnectMessage: ChatMessage = {
            role: "assistant",
            content: "サーバーとの接続が切断されました。サーバーが起動しているか確認してください。",
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, disconnectMessage]);
          scrollToBottom();
        }
      }
    };

    // 30秒ごとにサーバー状態を確認
    const intervalId = setInterval(checkServerConnection, 30000);

    // コンポーネントのアンマウント時にタイマーをクリア
    return () => clearInterval(intervalId);
  }, [selectedLayers, forceDisplayLayerInfo]);

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

  // Figmaからのメッセージを処理するハンドラー
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data.pluginMessage;
      if (!data) return;

      // 選択されたレイヤー情報を処理
      if (data.type === "SELECTED_LAYERS") {
        setSelectedLayers(data.layers);
        displayLayerInfo(data.layers);
      }
      // レイヤー選択エラーを処理
      else if (data.type === "SELECTED_LAYERS_ERROR") {
        setSelectedLayers([]);

        // エラーメッセージをチャット履歴に追加
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: `レイヤー情報の取得に失敗しました: ${data.message}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorMessage]);
      }
      // レビュー用のレイヤー情報を処理
      else if (data.type === "REVIEW_LAYERS") {
        handleStartReview(data.layers);
      }
      // レビューエラーを処理
      else if (data.type === "REVIEW_LAYERS_ERROR") {
        // エラーメッセージをチャット履歴に追加
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: `レイヤー情報の取得に失敗しました: ${data.message}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorMessage]);
      }
      // デバッグメッセージを処理
      else if (data.type === "debug") {
        const systemMessage: ChatMessage = {
          role: "assistant",
          content: `[デバッグ] ${data.message}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, systemMessage]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [serverStatus, chatHistory, selectedLayers, displayLayerInfo]);

  // エラーメッセージを作成する共通関数
  const createErrorMessage = useCallback((message: string): ChatMessage => {
    return {
      role: "assistant",
      content: message,
      timestamp: new Date(),
    };
  }, []);

  // チャット履歴を更新する共通関数
  const updateChatHistory = useCallback((message: ChatMessage) => {
    setChatHistory((prev) => [...prev, message]);
    scrollToBottom();
  }, []);

  // レビュー開始処理
  const handleStartReview = async (layers: any[]) => {
    if (isSending) {
      return;
    }

    // サーバー接続状態を確認
    if (serverStatus !== "接続済み") {
      updateChatHistory(
        createErrorMessage("サーバーに接続できません。サーバーが起動しているか確認してください。")
      );
      return;
    }

    // レイヤー情報をフォーマット
    const layerInfoText =
      layers.length > 0
        ? `選択レイヤー: ${layers.map((l) => l.name).join(", ")}`
        : "レイヤーが選択されていません";

    // ユーザーメッセージをチャット履歴に追加（レイヤー情報を含める）
    const userMessage: ChatMessage = {
      role: "user",
      content: `レイヤーのレビューを開始\n\n${layerInfoText}`,
      timestamp: new Date(),
    };
    updateChatHistory(userMessage);
    setIsSending(true);

    try {
      // APIリクエスト送信
      const response = await sendReviewRequest(layers, settings);

      if (response.success && response.data) {
        // レビュー結果をチャット履歴に追加
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: formatReviewResult(response.data),
          timestamp: new Date(),
        };
        updateChatHistory(assistantMessage);
      } else {
        updateChatHistory(
          createErrorMessage(`エラーが発生しました: ${response.error || "不明なエラー"}`)
        );
      }
    } catch (error) {
      updateChatHistory(
        createErrorMessage(
          `エラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  // レビュー結果をフォーマットする関数
  const formatReviewResult = (result: any): string => {
    try {
      // ReviewResult型の場合
      if (result.summary && result.goodPoints && result.badPoints && result.detailedAnalysis) {
        let formattedResult = `## UXレビュー結果\n\n`;
        formattedResult += `### 全体サマリー\n${result.summary}\n\n`;

        formattedResult += `### 良い点\n`;
        result.goodPoints.forEach((point: string, index: number) => {
          formattedResult += `${index + 1}. ${point}\n`;
        });
        formattedResult += `\n`;

        formattedResult += `### 改善点\n`;
        result.badPoints.forEach((point: string, index: number) => {
          formattedResult += `${index + 1}. ${point}\n`;
        });
        formattedResult += `\n`;

        formattedResult += `### 詳細分析\n`;
        Object.entries(result.detailedAnalysis).forEach(([principle, analysis]) => {
          formattedResult += `#### ${principle}\n${analysis}\n\n`;
        });

        return formattedResult;
      }

      // その他の形式の場合はJSON文字列として返す
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return JSON.stringify(result, null, 2);
    }
  };

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

      updateChatHistory(userMessage);
      setIsSending(true);

      // プラグインのメインコンテキストにメッセージを送信
      emit<SendMessageHandler>("SEND_MESSAGE", { message: content });

      try {
        // サーバー接続ステータスに関するメッセージをフィルタリングしたチャット履歴を作成
        const filteredChatHistory = chatHistory.filter(
          (msg) =>
            !(
              msg.role === "assistant" &&
              (msg.content.includes("サーバーに接続しました") ||
                msg.content.includes("サーバーに接続できませんでした") ||
                msg.content.includes("サーバーとの接続が回復しました") ||
                msg.content.includes("サーバーとの接続が切断されました"))
            )
        );

        // APIリクエスト送信（フィルタリングしたチャット履歴を使用）
        const response = await sendQuestionRequest(
          content,
          {
            chatHistory: filteredChatHistory,
            selectedLayers: selectedLayers.length > 0 ? selectedLayers : null,
          },
          settings
        );

        if (response.success && response.data) {
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

          // アシスタントの応答をチャット履歴に追加
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: answerText || "レスポンスの処理に失敗しました",
            timestamp: new Date(),
          };

          updateChatHistory(assistantMessage);
        } else {
          updateChatHistory(
            createErrorMessage(`エラーが発生しました: ${response.error || "不明なエラー"}`)
          );
        }
      } catch (error) {
        updateChatHistory(
          createErrorMessage(
            `エラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`
          )
        );
      } finally {
        setIsSending(false);
      }
    },
    [isSending, chatHistory, settings, updateChatHistory, createErrorMessage]
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
      {/* ヘッダー部分（設定ボタン） */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "8px",
        }}
      >
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
        <ChatHistory
          messages={chatHistory}
          onReviewClick={() => {
            if (selectedLayers.length > 0) {
              // チャット入力と同じ処理を使用
              handleSendMessage("レビューをお願いします");
            } else {
              // レイヤーが選択されていない場合はメッセージを表示
              const errorMessage: ChatMessage = {
                role: "assistant",
                content: "レビューを開始するには、Figmaでレイヤーを選択してください。",
                timestamp: new Date(),
              };
              setChatHistory((prev) => [...prev, errorMessage]);
            }
          }}
        />
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
