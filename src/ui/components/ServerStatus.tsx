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
      try {
        const result = await checkServerStatus();
        console.log("サーバー接続状態:", result);
        setStatus({
          connected: result.success,
          checking: false,
        });
      } catch (error) {
        console.error("サーバー接続確認エラー:", error);
        setStatus({
          connected: false,
          checking: false,
        });
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Container space="extraSmall">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px",
          border: "1px solid var(--figma-color-border)",
          borderRadius: "2px",
          marginBottom: "4px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              marginRight: "8px",
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
        <Text>
          <span style={{ color: "var(--figma-color-text)" }}>http://localhost:3000</span>
        </Text>
      </div>
    </Container>
  );
}
