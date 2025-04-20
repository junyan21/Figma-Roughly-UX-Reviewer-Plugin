import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Container, Text, VerticalSpace } from "@create-figma-plugin/ui";
import { checkServerStatus } from "../../utils/api";

export function ServerStatus() {
  const [status, setStatus] = useState<{
    connected: boolean;
    checking: boolean;
  }>({
    connected: false,
    checking: true,
  });

  useEffect(() => {
    const checkServer = async () => {
      const result = await checkServerStatus();
      setStatus({
        connected: result.success,
        checking: false,
      });
    };

    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Container space="small">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "4px",
          border: "1px solid var(--figma-color-border)",
          borderRadius: "2px",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            marginRight: "5px",
            backgroundColor: status.checking
              ? "var(--figma-color-icon-warning)"
              : status.connected
              ? "var(--figma-color-icon-positive)"
              : "var(--figma-color-icon-danger)",
          }}
        />
        <Text>
          サーバー接続状態:{" "}
          {status.checking ? "確認中..." : status.connected ? "接続済み" : "未接続"}
        </Text>
      </div>
      <Text align="center">
        <span style={{ color: "var(--figma-color-text-secondary)" }}>
          <small>URL: http://localhost:3000</small>
        </span>
      </Text>
      <VerticalSpace space="small" />
    </Container>
  );
}
