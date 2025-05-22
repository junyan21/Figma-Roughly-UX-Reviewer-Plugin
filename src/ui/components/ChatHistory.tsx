import { h } from "preact";
import { Container, Text, VerticalSpace } from "@create-figma-plugin/ui";
import { ChatMessage } from "../../utils/types";
import { marked } from "marked"; // マークダウンライブラリをインポート

interface ChatHistoryProps {
  messages: ChatMessage[];
  onReviewClick?: () => void; // レビューリンククリック時のコールバック
}

export function ChatHistory({ messages, onReviewClick }: ChatHistoryProps) {
  // マークダウンをHTMLに変換する関数
  const renderMarkdown = (content: string) => {
    try {
      // 厳密なnullチェック
      if (content === null || content === undefined || content === "") {
        console.warn("マークダウン変換: contentが空です");
        return { __html: "" };
      }

      let processedContent = content;

      // JSONデータの場合はパースを試みる
      if (
        typeof content === "string" &&
        (content.startsWith("{") ||
          content.includes('"success":true') ||
          content.includes('"data":{"answer"'))
      ) {
        try {
          const parsedData = JSON.parse(content);
          if (parsedData.data && parsedData.data.answer) {
            processedContent = parsedData.data.answer;
          } else if (parsedData.answer) {
            processedContent = parsedData.answer;
          }
        } catch (e) {
          console.warn("JSONパースに失敗:", e);
          // パースに失敗した場合は元のコンテンツを使用
        }
      }

      // 文字列型の強制
      const contentStr = String(processedContent);

      // レビューリンクとレイヤーリンクの処理
      const processedStr = contentStr
        .replace(
          /\[レビューを開始する\]\(#review\)/g,
          '<a href="#" class="review-link">レビューを開始する</a>'
        )
        .replace(
          /\[([^\]]+)\]\(#layer-([^)]+)\)/g,
          '<a href="#layer-$2" class="layer-link">$1</a>'
        );

      // markedを同期的に使用するようにオプションを設定
      const html = marked.parse(processedStr, {
        async: false,
        breaks: true,
        gfm: true,
      }) as string;

      return { __html: html };
    } catch (error) {
      console.error("マークダウン変換エラー:", error);
      // エラー時も安全な値を返す
      return { __html: typeof content === "string" ? content : String(content || "") };
    }
  };
  // レビューリンクとレイヤーリンクのクリックイベントを処理
  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // レビューリンクのクリック処理
    if (target.classList.contains("review-link")) {
      event.preventDefault();
      if (onReviewClick) {
        onReviewClick();
      }
    }

    // レイヤーリンクのクリック処理
    const layerLinkMatch = target.getAttribute("href")?.match(/#layer-(.+)/);
    if (layerLinkMatch && layerLinkMatch[1]) {
      event.preventDefault();
      // ここでレイヤーIDを使った処理を行う（例：Figmaでそのレイヤーを選択する）
      // 現時点では、レイヤーIDをコンソールに出力するだけ
    }
  };

  return (
    <Container space="extraSmall">
      <div
        className="chat-history-container"
        style={{
          height: "100%",
          overflowY: "auto",
          border: "1px solid var(--figma-color-border)",
          borderRadius: "2px",
          padding: "8px",
        }}
        onClick={handleClick}
      >
        {messages.length === 0 ? (
          <Text align="center">
            <span style={{ color: "var(--figma-color-text-secondary)" }}>
              メッセージはまだありません
            </span>
          </Text>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              style={{
                marginBottom: "10px",
                padding: "8px",
                borderRadius: "6px",
                maxWidth: "80%",
                wordBreak: "break-word",
                backgroundColor:
                  message.role === "user"
                    ? "var(--figma-color-bg-brand-tertiary)"
                    : "var(--figma-color-bg-secondary)",
                marginLeft: message.role === "user" ? "auto" : "0",
                marginRight: message.role === "user" ? "0" : "auto",
              }}
            >
              {/* ユーザーメッセージはプレーンテキスト（改行を保持）、アシスタントメッセージはマークダウンとして表示 */}
              {message.role === "user" ? (
                <Text>
                  <span style={{ whiteSpace: "pre-wrap" }}>{message.content}</span>
                </Text>
              ) : (
                <div
                  className="markdown-content"
                  dangerouslySetInnerHTML={renderMarkdown(message.content)}
                  style={{
                    fontSize: "var(--figma-font-size-normal)",
                    lineHeight: "1.5",
                    color: "var(--figma-color-text)",
                  }}
                />
              )}
              <VerticalSpace space="extraSmall" />
              <Text>
                <span style={{ color: "var(--figma-color-text-secondary)", fontSize: "0.8em" }}>
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </Text>
            </div>
          ))
        )}
      </div>
      <VerticalSpace space="small" />
    </Container>
  );
}
