export type ReplyExtra = {
  reply_to_message_id?: number;
};

export type CommandMessage = {
  message_id?: number;
} & Record<string, unknown>;

export type CommandContext = {
  chat?: {
    id?: number | string;
  };
  message?: CommandMessage;
  msg?: CommandMessage;
  reply: (text: string, extra?: ReplyExtra) => Promise<unknown>;
};

export type StickerCommandContext = CommandContext & {
  replyWithSticker: (sticker: { source: Buffer }, extra?: ReplyExtra) => Promise<unknown>;
};

export function isCommandContext(value: unknown): value is CommandContext {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CommandContext>;
  return typeof candidate.reply === "function";
}

export function isStickerCommandContext(value: unknown): value is StickerCommandContext {
  if (!isCommandContext(value)) return false;
  const candidate = value as Partial<StickerCommandContext>;
  return typeof candidate.replyWithSticker === "function";
}

export function getCommandMessageId(ctx: CommandContext): number | undefined {
  const fromMessage = ctx.message?.message_id;
  if (typeof fromMessage === "number") return fromMessage;

  const fromMsg = ctx.msg?.message_id;
  if (typeof fromMsg === "number") return fromMsg;

  return undefined;
}

export function getCommandMessageKeys(ctx: CommandContext): string[] {
  return Object.keys((ctx.message ?? ctx.msg ?? {}) as Record<string, unknown>);
}

export function toReplyExtra(messageId: number | undefined): ReplyExtra | undefined {
  if (!messageId) return undefined;
  return { reply_to_message_id: messageId };
}
