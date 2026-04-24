import type { BaseMessage } from "./types";
import en from "./locales/en";
import zhCN from "./locales/zh-CN";
import { getLanguage } from "obsidian";

const locales: Record<string, BaseMessage> = {
  en,
  "zh": zhCN,
  "zh-CN": zhCN,
};

const messages: BaseMessage = locales[getLanguage()] ?? locales["en"];

export function t(): BaseMessage {
  return messages;
}
