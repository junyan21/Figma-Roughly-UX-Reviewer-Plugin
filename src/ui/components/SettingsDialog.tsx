import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Button, Container, Dropdown, Text, VerticalSpace, Modal } from "@create-figma-plugin/ui";
import { fetchAvailableModels } from "../../utils/api";
import { Settings } from "../../utils/types";
import { saveSettings } from "../../utils/storage";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export function SettingsDialog({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: SettingsDialogProps) {
  const [models, setModels] = useState<
    Array<{ id: string; name: string; createdAt: string; isDefault: boolean }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState(settings.model);
  const [error, setError] = useState<string | null>(null);

  // モデルリストの取得
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);

      fetchAvailableModels(settings)
        .then((response) => {
          if (response.success && response.data?.data) {
            const modelList = response.data.data;

            if (modelList.length === 0) {
              setError("モデルリストが空です");
              setModels([]);
            } else {
              setModels(modelList);

              // 現在選択されているモデルがリストにない場合は適切なモデルを選択
              if (!modelList.some((model) => model.id === selectedModel)) {
                const defaultModel = modelList.find((model) => model.isDefault) || modelList[0];
                setSelectedModel(defaultModel.id);
              }
            }
          } else {
            setError("モデルリストの取得に失敗しました");
          }
        })
        .catch(() => {
          setError("モデルリストの取得中にエラーが発生しました");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, settings, selectedModel]);

  // 設定を保存
  const handleSave = () => {
    const newSettings = {
      ...settings,
      model: selectedModel,
    };
    saveSettings(newSettings);
    onSettingsChange(newSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      title="設定"
      onCloseButtonClick={onClose}
      style={{ width: "400px", maxWidth: "90%" }}
    >
      <Container
        space="medium"
        style={{
          minHeight: "200px",
          maxHeight: "400px",
          overflow: "auto",
        }}
      >
        <Text>
          <strong>使用するモデル</strong>
        </Text>
        <VerticalSpace space="small" />

        {loading ? (
          <Text>読み込み中...</Text>
        ) : error ? (
          <Text style={{ color: "var(--figma-color-text-danger)" }}>{error}</Text>
        ) : models.length === 0 ? (
          <Text>モデルリストが空です</Text>
        ) : (
          <div style={{ marginBottom: "16px" }}>
            {models.map((model) => (
              <div
                key={model.id}
                style={{
                  padding: "8px",
                  marginBottom: "4px",
                  border: "1px solid var(--figma-color-border)",
                  borderRadius: "2px",
                  backgroundColor:
                    model.id === selectedModel ? "var(--figma-color-bg-selected)" : "transparent",
                  cursor: "pointer",
                }}
                onClick={() => setSelectedModel(model.id)}
              >
                <Text>
                  {model.name} ({new Date(model.createdAt).toLocaleDateString()})
                  {model.isDefault ? " - デフォルト" : ""}
                </Text>
              </div>
            ))}
          </div>
        )}

        <VerticalSpace space="large" />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={handleSave}>保存</Button>
        </div>
      </Container>
    </Modal>
  );
}
