import { h } from "preact";
import { useCallback, useState } from "preact/hooks";
import { Button, Container, TextboxMultiline, VerticalSpace } from "@create-figma-plugin/ui";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || disabled) return;
    onSendMessage(inputValue);
    setInputValue("");
  }, [inputValue, disabled, onSendMessage]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  return (
    <Container space="extraSmall">
      <div style={{ display: "flex", alignItems: "flex-end", padding: "4px 0" }}>
        <div style={{ flexGrow: 1, marginRight: "8px" }}>
          <TextboxMultiline
            onKeyDown={handleKeyDown}
            onValueInput={setInputValue}
            placeholder="メッセージを入力..."
            value={inputValue}
            variant="border"
            disabled={disabled}
            rows={2}
          />
        </div>
        <Button onClick={handleSendMessage} disabled={disabled || !inputValue.trim()}>
          {disabled ? "送信中..." : "送信"}
        </Button>
      </div>
      <VerticalSpace space="small" />
    </Container>
  );
}
