import { normalizeText } from "../utils/text.js";

type MaybeMessage = {
  text?: string;
  caption?: string;
  from?: {
    first_name?: string;
    last_name?: string;
    username?: string;
  };
  sender_chat?: {
    title?: string;
  };
};

type MaybeContext = {
  message?: {
    reply_to_message?: MaybeMessage;
  };
};

export function getRepliedMessage(ctx: MaybeContext): MaybeMessage | null {
  return ctx.message?.reply_to_message ?? null;
}

export function extractRepliedText(reply: MaybeMessage): string | null {
  const text = typeof reply.text === "string" ? reply.text : null;
  const caption = typeof reply.caption === "string" ? reply.caption : null;
  const raw = text ?? caption;
  if (!raw) return null;

  const cleaned = normalizeText(raw);
  return cleaned.length ? cleaned : null;
}

export function extractSpeaker(reply: MaybeMessage): string {
  if (reply.from?.first_name) {
    const fullName = `${reply.from.first_name}${reply.from.last_name ? ` ${reply.from.last_name}` : ""}`.trim();
    return fullName;
  }

  if (reply.from?.username) {
    return `@${reply.from.username}`;
  }

  if (reply.sender_chat?.title) {
    return reply.sender_chat.title;
  }

  return "Unknown";
}
