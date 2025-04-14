import { Settings } from "../plugin/types";

// ストレージキー
const SETTINGS_KEY = "zakkuri-ux-reviewer-settings";

/**
 * 設定をクライアントストレージに保存する
 */
export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("設定の保存に失敗しました:", error);
  }
}

/**
 * 設定をクライアントストレージから読み込む
 */
export function loadSettings(): Settings | null {
  try {
    const settingsJson = localStorage.getItem(SETTINGS_KEY);
    if (!settingsJson) return null;

    return JSON.parse(settingsJson) as Settings;
  } catch (error) {
    console.error("設定の読み込みに失敗しました:", error);
    return null;
  }
}

/**
 * 設定をクライアントストレージから削除する
 */
export function clearSettings(): void {
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error("設定の削除に失敗しました:", error);
  }
}

/**
 * デフォルト設定を取得する
 */
export function getDefaultSettings(): Settings {
  return {
    apiKey: "",
    serverUrl: "localhost",
    port: 3000,
    model: "claude-3-haiku-20240307",
  };
}

/**
 * 設定を検証する
 */
export function validateSettings(settings: Settings): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!settings.serverUrl) {
    errors.push("サーバーURLが設定されていません");
  }

  if (!settings.port || settings.port <= 0 || settings.port > 65535) {
    errors.push("ポート番号が無効です");
  }

  if (!settings.model) {
    errors.push("モデルが選択されていません");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
