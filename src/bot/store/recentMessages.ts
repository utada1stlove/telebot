import { normalizeText } from "../../utils/text.js";
import type { ReplyPayload } from "../extract/replyPayload.js";
import {
  asRecord,
  extractMessageIdentity,
  readNumber,
  readRecord,
  readString,
  type JsonRecord
} from "../extract/messageIdentity.js";

type CachedMessage = {
  chatKey: string;
  messageId?: number;
  date?: number;
  senderKey?: string;
  senderUserId?: number;
  speaker: string;
  text: string | null;
  isCommand: boolean;
};

const MAX_PER_CHAT = 200;
const recentByChat = new Map<string, CachedMessage[]>();

function readChatKey(message: JsonRecord | null): string | null {
  const chat = readRecord(message, "chat");
  const id = chat?.id;
  if (typeof id === "string" || typeof id === "number") {
    return String(id);
  }
  return null;
}

function readSenderKey(message: JsonRecord | null): string | null {
  const from = readRecord(message, "from");
  const userId = from?.id;
  if (typeof userId === "number") return `u:${userId}`;

  const senderChat = readRecord(message, "sender_chat");
  const chatId = senderChat?.id;
  if (typeof chatId === "number") return `c:${chatId}`;

  return null;
}

function readMessageText(message: JsonRecord | null): string | null {
  const text = readString(message, "text");
  const caption = readString(message, "caption");
  const raw = text ?? caption;
  if (!raw) return null;

  const cleaned = normalizeText(raw);
  return cleaned.length ? cleaned : null;
}

function isCommandText(text: string | null): boolean {
  if (!text) return false;
  return /^\/[a-z0-9_]+(?:@\w+)?\b/i.test(text);
}

function getIncomingMessage(ctx: unknown): JsonRecord | null {
  const context = asRecord(ctx);
  return readRecord(context, "message") ?? readRecord(readRecord(context, "update"), "message") ?? readRecord(context, "msg");
}

function toCachedMessage(message: JsonRecord | null): CachedMessage | null {
  if (!message) return null;

  const chatKey = readChatKey(message);
  if (!chatKey) return null;

  const text = readMessageText(message);
  const identity = extractMessageIdentity(message);

  return {
    chatKey,
    messageId: readNumber(message, "message_id") ?? undefined,
    date: readNumber(message, "date") ?? undefined,
    senderKey: readSenderKey(message) ?? undefined,
    senderUserId: identity.senderUserId,
    speaker: identity.speaker,
    text,
    isCommand: isCommandText(text)
  };
}

function saveMessage(item: CachedMessage) {
  const bucket = recentByChat.get(item.chatKey) ?? [];
  bucket.push(item);

  if (bucket.length > MAX_PER_CHAT) {
    bucket.splice(0, bucket.length - MAX_PER_CHAT);
  }

  recentByChat.set(item.chatKey, bucket);
}

export function rememberMessage(ctx: unknown): void {
  const parsed = toCachedMessage(getIncomingMessage(ctx));
  if (!parsed) return;
  saveMessage(parsed);
}

function pickFallback(command: CachedMessage, candidates: CachedMessage[]): CachedMessage | null {
  if (!candidates.length) return null;

  const commandMessageId = typeof command.messageId === "number" ? command.messageId : null;
  if (commandMessageId !== null) {
    const directPrev = candidates.find((item) => item.messageId === commandMessageId - 1);
    if (directPrev) return directPrev;
  }

  const commandDate = typeof command.date === "number" ? command.date : null;
  if (command.senderKey && commandDate !== null) {
    const sameSender = candidates.find((item) => {
      if (!item.senderKey || item.senderKey !== command.senderKey) return false;
      if (typeof item.date !== "number") return true;
      return commandDate - item.date <= 300;
    });
    if (sameSender) return sameSender;
  }

  if (commandDate !== null) {
    const recent = candidates.find((item) => {
      if (typeof item.date !== "number") return false;
      return commandDate - item.date <= 45;
    });
    if (recent) return recent;
  }

  return candidates[0] ?? null;
}

export function findFallbackReply(ctx: unknown): ReplyPayload | null {
  const command = toCachedMessage(getIncomingMessage(ctx));
  if (!command) return null;
  const commandMessageId = typeof command.messageId === "number" ? command.messageId : null;

  const bucket = recentByChat.get(command.chatKey) ?? [];

  const candidates = bucket
    .filter((item) => {
      if (!item.text || item.isCommand) return false;

      if (commandMessageId !== null) {
        if (typeof item.messageId !== "number") return false;
        return item.messageId < commandMessageId;
      }

      return true;
    })
    .reverse();

  const picked = pickFallback(command, candidates);
  if (!picked || !picked.text) return null;

  return {
    text: picked.text,
    speaker: picked.speaker,
    senderUserId: picked.senderUserId,
    source: "history"
  };
}
