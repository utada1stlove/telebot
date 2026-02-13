const MAX_USERS = 300;
const lastStickerByUser = new Map<number, Buffer>();

function pruneIfNeeded() {
  if (lastStickerByUser.size <= MAX_USERS) return;

  const firstKey = lastStickerByUser.keys().next().value;
  if (typeof firstKey === "number") {
    lastStickerByUser.delete(firstKey);
  }
}

export function setLastSticker(userId: number, sticker: Buffer): void {
  lastStickerByUser.set(userId, Buffer.from(sticker));
  pruneIfNeeded();
}

export function getLastSticker(userId: number): Buffer | null {
  const sticker = lastStickerByUser.get(userId);
  if (!sticker) return null;
  return Buffer.from(sticker);
}
