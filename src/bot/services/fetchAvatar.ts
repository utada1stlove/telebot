import { asRecord, readRecord, readString } from "../extract/messageIdentity.js";

type TelegramLike = {
  getUserProfilePhotos: (userId: number, offset?: number, limit?: number) => Promise<unknown>;
  getFileLink: (fileId: string) => Promise<string | URL>;
};

function isTelegramLike(value: unknown): value is TelegramLike {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TelegramLike>;
  return typeof candidate.getUserProfilePhotos === "function" && typeof candidate.getFileLink === "function";
}

function pickLargestFileId(photosResult: unknown): string | null {
  const root = asRecord(photosResult);
  const photosValue = root?.photos;
  if (!Array.isArray(photosValue) || photosValue.length === 0) return null;

  const firstPhotoSet = photosValue[0];
  if (!Array.isArray(firstPhotoSet) || firstPhotoSet.length === 0) return null;

  for (let index = firstPhotoSet.length - 1; index >= 0; index -= 1) {
    const sizeItem = asRecord(firstPhotoSet[index]);
    const fileId = readString(sizeItem, "file_id");
    if (fileId) return fileId;
  }

  return null;
}

export async function fetchUserAvatar(telegram: unknown, userId: number | undefined): Promise<Buffer | null> {
  if (!userId || !isTelegramLike(telegram)) return null;

  try {
    const profilePhotos = await telegram.getUserProfilePhotos(userId, 0, 1);
    const fileId = pickLargestFileId(profilePhotos);
    if (!fileId) return null;

    const fileLink = await telegram.getFileLink(fileId);
    const url = typeof fileLink === "string" ? fileLink : fileLink.toString();

    const response = await fetch(url);
    if (!response.ok) return null;

    const fileBuffer = Buffer.from(await response.arrayBuffer());
    return fileBuffer.length > 0 ? fileBuffer : null;
  } catch (error) {
    console.warn("Failed to fetch avatar", { userId, error });
    return null;
  }
}
