import type { BaseMessage } from "./types";
import en from "./locales/en";
import zhCN from "./locales/zh-CN";

const locales: Record<string, BaseMessage> = {
  en,
  zh: zhCN,
  "zh-CN": zhCN,
};

function getCurrentLanguage(): string {
  const obsidianModule = require("obsidian") as Record<string, unknown>;
  if (typeof obsidianModule.getLanguage === "function") {
    return obsidianModule.getLanguage() as string;
  }

  const { moment } = window as unknown as { moment?: { locale: () => string } };
  return moment?.locale() ?? "en";
}

const lang = getCurrentLanguage();
const messages: BaseMessage = locales[lang] ?? locales["en"];

export function t(): BaseMessage {
  return messages;
}
