import type { Context } from "telegraf";
import { normalizeText } from "../utils/text.js";

export function getRepliedMessage(ctx: any) {
  return ctx.message?.reply_to_message ?? null;
}

export function extractRepliedText(reply: any): string | null {
  const t = typeof reply?.text === "string" ? reply.text : null;
  const c = typeof reply?.caption === "string" ? reply.caption : null;
  const raw = t ?? c;
  if (!raw) return null;
  const cleaned = normalizeText(raw);
  return cleaned.length ? cleaned : null;
}

export function extractSpeaker(reply: any): string {
  const from = reply?.from;
  if (from?.first_name) {
    return (from.first_name + (from.last_name ? ` ${from.last_name}` : "")).trim();
  }
  const chatTitle = reply?.sender_chat?.title;
  if (chatTitle) return chatTitle;
  return "Unknown";
}
