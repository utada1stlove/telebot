type TelegramStickerApi = {
  callApi: (method: string, payload?: Record<string, unknown>) => Promise<unknown>;
  getMe: () => Promise<unknown>;
};

type EnsureStickerInPackInput = {
  telegram: unknown;
  userId: number;
  displayName: string;
  sticker: Buffer;
  emoji?: string;
};

export type EnsureStickerInPackResult = {
  packName: string;
  created: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown> | null, key: string): string | null {
  if (!record) return null;
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function isTelegramStickerApi(value: unknown): value is TelegramStickerApi {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TelegramStickerApi>;
  return typeof candidate.callApi === "function" && typeof candidate.getMe === "function";
}

function normalizeForPack(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
}

function cleanTitle(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Reply Sticker Pack";
  return trimmed.length > 64 ? `${trimmed.slice(0, 61)}...` : trimmed;
}

function errorText(error: unknown): string {
  const root = asRecord(error);
  const description = readString(root, "description");
  if (description) return description;

  const response = asRecord(root?.response);
  const responseDescription = readString(response, "description");
  if (responseDescription) return responseDescription;

  const message = readString(root, "message");
  if (message) return message;

  return String(error ?? "Unknown error");
}

function isMissingStickerSetError(text: string): boolean {
  const normalized = text.toUpperCase();
  return normalized.includes("STICKERSET_INVALID") || normalized.includes("STICKERSET_NOT_FOUND");
}

async function getBotUsername(telegram: TelegramStickerApi): Promise<string> {
  const me = asRecord(await telegram.getMe());
  const username = readString(me, "username");
  if (!username) {
    throw new Error("Bot username unavailable. Please set a public username in @BotFather.");
  }
  return username;
}

function buildPackName(userId: number, botUsername: string): string {
  const safeBot = normalizeForPack(botUsername) || "bot";
  const suffix = `_by_${safeBot}`;
  const basePrefix = `reply_memories_${userId}`;
  const maxPrefixLen = 64 - suffix.length;

  if (maxPrefixLen <= 0) {
    throw new Error("Bot username is too long for sticker set short name.");
  }

  const prefix = basePrefix.slice(0, maxPrefixLen);
  return `${prefix}${suffix}`;
}

function buildPackTitle(displayName: string): string {
  const safeName = cleanTitle(displayName);
  return cleanTitle(`${safeName}'s Reply Stickers`);
}

function buildInputSticker(sticker: Buffer, emoji: string) {
  return {
    sticker: { source: sticker },
    format: "static",
    emoji_list: [emoji]
  };
}

async function stickerSetExists(telegram: TelegramStickerApi, packName: string): Promise<boolean> {
  try {
    await telegram.callApi("getStickerSet", { name: packName });
    return true;
  } catch (error) {
    const text = errorText(error);
    if (isMissingStickerSetError(text)) return false;
    throw error;
  }
}

export async function ensureStickerInPack(input: EnsureStickerInPackInput): Promise<EnsureStickerInPackResult> {
  if (!isTelegramStickerApi(input.telegram)) {
    throw new Error("Telegram API unavailable on context.");
  }

  const emoji = input.emoji ?? "💬";
  const botUsername = await getBotUsername(input.telegram);
  const packName = buildPackName(input.userId, botUsername);
  const packTitle = buildPackTitle(input.displayName);
  const inputSticker = buildInputSticker(input.sticker, emoji);

  const exists = await stickerSetExists(input.telegram, packName);

  if (exists) {
    await input.telegram.callApi("addStickerToSet", {
      user_id: input.userId,
      name: packName,
      sticker: inputSticker
    });

    return { packName, created: false };
  }

  await input.telegram.callApi("createNewStickerSet", {
    user_id: input.userId,
    name: packName,
    title: packTitle,
    stickers: [inputSticker],
    sticker_type: "regular"
  });

  return { packName, created: true };
}

export function describePackError(error: unknown): string {
  const text = errorText(error);

  if (text.includes("STICKERSET_OWNER_ANONYMOUS")) {
    return "无法在匿名身份下管理贴纸包，请用你的个人账号发送 /pack。";
  }

  if (text.toUpperCase().includes("STICKER_FILE_INVALID")) {
    return "这张贴纸文件不符合 Telegram 贴纸要求，请重新生成后再试。";
  }

  if (text.toUpperCase().includes("STICKERSET_INVALID")) {
    return "贴纸包状态异常，请稍后重试。";
  }

  return text;
}
