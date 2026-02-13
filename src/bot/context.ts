export type ReplyExtra = {
  reply_to_message_id?: number;
};

export type CommandUser = {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export type CommandMessage = {
  message_id?: number;
  from?: CommandUser;
} & Record<string, unknown>;

export type CommandContext = {
  chat?: {
    id?: number | string;
  };
  from?: CommandUser;
  telegram?: unknown;
  message?: CommandMessage;
  msg?: CommandMessage;
  reply: (text: string, extra?: ReplyExtra) => Promise<unknown>;
};

export type StickerCommandContext = CommandContext & {
  replyWithSticker: (sticker: { source: Buffer }, extra?: ReplyExtra) => Promise<unknown>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function pickUser(value: unknown): CommandUser | null {
  const user = asRecord(value);
  if (!user) return null;

  const id = typeof user.id === "number" ? user.id : undefined;
  const username = typeof user.username === "string" ? user.username : undefined;
  const firstName = typeof user.first_name === "string" ? user.first_name : undefined;
  const lastName = typeof user.last_name === "string" ? user.last_name : undefined;

  if (!id && !username && !firstName) return null;
  return {
    id,
    username,
    first_name: firstName,
    last_name: lastName
  };
}

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

export function getCommandText(ctx: CommandContext): string | undefined {
  const message = (ctx.message ?? ctx.msg ?? {}) as Record<string, unknown>;
  const text = message.text;
  if (typeof text === "string") return text;

  const caption = message.caption;
  if (typeof caption === "string") return caption;

  return undefined;
}

export function toReplyExtra(messageId: number | undefined): ReplyExtra | undefined {
  if (!messageId) return undefined;
  return { reply_to_message_id: messageId };
}

export function getCommandUser(ctx: CommandContext): CommandUser | null {
  return pickUser(ctx.from) ?? pickUser(ctx.message?.from) ?? pickUser(ctx.msg?.from) ?? null;
}

export function getCommandUserId(ctx: CommandContext): number | undefined {
  return getCommandUser(ctx)?.id;
}

export function getCommandDisplayName(ctx: CommandContext): string {
  const user = getCommandUser(ctx);
  if (!user) return "User";

  if (user.first_name) {
    return `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`.trim();
  }

  if (user.username) return `@${user.username}`;
  if (typeof user.id === "number") return `User ${user.id}`;
  return "User";
}
