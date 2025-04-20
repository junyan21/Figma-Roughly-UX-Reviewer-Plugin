import { h } from "preact";
import { Container, Text, VerticalSpace } from "@create-figma-plugin/ui";
import { ChatMessage } from "../../utils/types";

interface ChatHistoryProps {
  messages: ChatMessage[];
}

export function ChatHistory({ messages }: ChatHistoryProps) {
  return (
    <Container space="small">
      <div
        style={{
          height: "300px",
          overflowY: "auto",
          border: "1px solid var(--figma-color-border)",
          borderRadius: "2px",
          padding: "8px",
        }}
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
              <Text>{message.content}</Text>
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
