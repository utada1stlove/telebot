import { normalizeText } from "../../utils/text.js";

export type ReplyPayload = {
  text: string | null;
  speaker: string;
  source: "reply_to_message" | "external_reply" | "quote" | "history";
};

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object") return null;
  return value as JsonRecord;
}

function readRecord(record: JsonRecord | null, key: string): JsonRecord | null {
  if (!record) return null;
  return asRecord(record[key]);
}

function readString(record: JsonRecord | null, key: string): string | null {
  if (!record) return null;
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function extractText(message: JsonRecord | null): string | null {
  if (!message) return null;

  const raw = readString(message, "text") ?? readString(message, "caption");
  if (!raw) return null;

  const cleaned = normalizeText(raw);
  return cleaned.length ? cleaned : null;
}

function extractSpeaker(message: JsonRecord | null): string {
  if (!message) return "Unknown";

  const from = readRecord(message, "from");
  const firstName = readString(from, "first_name");
  if (firstName) {
    const lastName = readString(from, "last_name");
    return `${firstName}${lastName ? ` ${lastName}` : ""}`.trim();
  }

  const username = readString(from, "username");
  if (username) return `@${username}`;

  const senderChat = readRecord(message, "sender_chat");
  const senderChatTitle = readString(senderChat, "title");
  if (senderChatTitle) return senderChatTitle;

  return "Unknown";
}

function extractExternalSpeaker(externalReply: JsonRecord | null): string | null {
  const origin = readRecord(externalReply, "origin");
  if (!origin) return null;

  const originType = readString(origin, "type");

  if (originType === "user") {
    const user = readRecord(origin, "sender_user");
    const firstName = readString(user, "first_name");
    if (firstName) {
      const lastName = readString(user, "last_name");
      return `${firstName}${lastName ? ` ${lastName}` : ""}`.trim();
    }

    const username = readString(user, "username");
    if (username) return `@${username}`;
  }

  if (originType === "chat") {
    const chat = readRecord(origin, "chat");
    const title = readString(chat, "title");
    if (title) return title;
  }

  if (originType === "hidden_user") {
    const hiddenName = readString(origin, "sender_user_name");
    if (hiddenName) return hiddenName;
  }

  return null;
}

function getIncomingMessage(ctx: unknown): JsonRecord | null {
  const context = asRecord(ctx);

  const message = readRecord(context, "message");
  if (message) return message;

  const update = readRecord(context, "update");
  const updateMessage = readRecord(update, "message");
  if (updateMessage) return updateMessage;

  const msg = readRecord(context, "msg");
  if (msg) return msg;

  return null;
}

export function getReplyPayload(ctx: unknown): ReplyPayload | null {
  const message = getIncomingMessage(ctx);
  if (!message) return null;

  const replyToMessage = readRecord(message, "reply_to_message");
  if (replyToMessage) {
    return {
      text: extractText(replyToMessage),
      speaker: extractSpeaker(replyToMessage),
      source: "reply_to_message"
    };
  }

  const externalReply = readRecord(message, "external_reply");
  if (externalReply) {
    const externalMessage = readRecord(externalReply, "message") ?? externalReply;
    return {
      text: extractText(externalMessage),
      speaker: extractExternalSpeaker(externalReply) ?? extractSpeaker(externalMessage),
      source: "external_reply"
    };
  }

  const quote = readRecord(message, "quote");
  const quoteText = readString(quote, "text");
  if (quoteText) {
    return {
      text: normalizeText(quoteText),
      speaker: extractSpeaker(message),
      source: "quote"
    };
  }

  return null;
}
