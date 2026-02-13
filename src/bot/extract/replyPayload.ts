import { normalizeText } from "../../utils/text.js";
import { asRecord, extractMessageIdentity, readRecord, readString, type JsonRecord } from "./messageIdentity.js";

export type ReplyPayload = {
  text: string | null;
  speaker: string;
  senderUserId?: number;
  source: "reply_to_message" | "external_reply" | "quote" | "history";
};

function extractText(message: JsonRecord | null): string | null {
  if (!message) return null;

  const raw = readString(message, "text") ?? readString(message, "caption");
  if (!raw) return null;

  const cleaned = normalizeText(raw);
  return cleaned.length ? cleaned : null;
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
    const identity = extractMessageIdentity(replyToMessage);
    return {
      text: extractText(replyToMessage),
      speaker: identity.speaker,
      senderUserId: identity.senderUserId,
      source: "reply_to_message"
    };
  }

  const externalReply = readRecord(message, "external_reply");
  if (externalReply) {
    const externalMessage = readRecord(externalReply, "message") ?? externalReply;
    const originIdentity = extractMessageIdentity(externalReply);
    const messageIdentity = extractMessageIdentity(externalMessage);
    const identity = originIdentity.speaker !== "Unknown" ? originIdentity : messageIdentity;

    return {
      text: extractText(externalMessage),
      speaker: identity.speaker,
      senderUserId: identity.senderUserId,
      source: "external_reply"
    };
  }

  const quote = readRecord(message, "quote");
  const quoteText = readString(quote, "text");
  if (quoteText) {
    const identity = extractMessageIdentity(message);
    return {
      text: normalizeText(quoteText),
      speaker: identity.speaker,
      senderUserId: identity.senderUserId,
      source: "quote"
    };
  }

  return null;
}
