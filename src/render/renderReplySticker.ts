import sharp from "sharp";
import { clampText, ellipsizeLastLine, escapeXml, wrapText } from "../utils/text.js";
import { theme } from "./theme.js";
import type { StickerBubble } from "../types/sticker.js";

const W = 512;
const H = 512;
const BUBBLE_X = 78;
const BUBBLE_W = 414;
const BUBBLE_PADDING_X = 28;
const SPEAKER_FONT_SIZE = 42;
const BODY_FONT_SIZE = 56;
const BODY_LINE_HEIGHT = 64;
const MAX_BODY_LINES = 5;
const BODY_MAX_UNITS = 12;

function initialOf(name: string) {
  const normalized = name.trim();
  if (!normalized) return "?";
  return normalized[0]?.toUpperCase() ?? "?";
}

function buildBodyLines(input: string) {
  const limited = clampText(input, 140);
  const wrapped = wrapText(limited, BODY_MAX_UNITS, MAX_BODY_LINES);
  const truncated = limited.length < input.trim().length || wrapped.truncated;
  return ellipsizeLastLine(wrapped.lines, truncated);
}

async function renderRoundedAvatar(avatar: Buffer, size: number): Promise<Buffer | null> {
  try {
    const mask = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`);

    return await sharp(avatar)
      .resize(size, size, { fit: "cover" })
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

export async function renderReplySticker(input: StickerBubble): Promise<Buffer> {
  const speaker = escapeXml(clampText(input.speaker, 26));
  const bodyLines = buildBodyLines(input.text).map(escapeXml);

  const bubbleHeight = Math.min(
    460,
    58 + SPEAKER_FONT_SIZE + 24 + bodyLines.length * BODY_LINE_HEIGHT + 36
  );
  const bubbleY = Math.max(24, Math.floor((H - bubbleHeight) / 2));

  const avatarR = 30;
  const avatarSize = avatarR * 2;
  const avatarCx = 38;
  const avatarCy = bubbleY + 34;

  const bodyStartX = BUBBLE_X + BUBBLE_PADDING_X;
  const bodyStartY = bubbleY + 58 + SPEAKER_FONT_SIZE + 20;

  const bodySvg = bodyLines
    .map((line, index) => {
      const y = bodyStartY + index * BODY_LINE_HEIGHT;
      return `<text x="${bodyStartX}" y="${y}" fill="${theme.text}" font-size="${BODY_FONT_SIZE}" font-weight="700">${line}</text>`;
    })
    .join("\n");

  const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="160%" height="160%">
      <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#000" flood-opacity="${theme.shadowOpacity}"/>
    </filter>
  </defs>
  <style>
    text {
      font-family: "Noto Sans CJK SC", "Noto Sans CJK TC", "Noto Color Emoji", sans-serif;
    }
  </style>

  <rect x="${BUBBLE_X}" y="${bubbleY}" width="${BUBBLE_W}" height="${bubbleHeight}" rx="34" ry="34"
    fill="${theme.bubble}" stroke="${theme.bubbleStroke}" stroke-width="2" filter="url(#shadow)"/>

  <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}" fill="${theme.avatarBg}"/>
  <text x="${avatarCx}" y="${avatarCy + 13}" text-anchor="middle" fill="${theme.avatarText}" font-size="34" font-weight="800">
    ${escapeXml(initialOf(input.speaker))}
  </text>

  <text x="${BUBBLE_X + BUBBLE_PADDING_X}" y="${bubbleY + 58}" fill="${theme.speaker}" font-size="${SPEAKER_FONT_SIZE}" font-weight="700">
    ${speaker}
  </text>

  ${bodySvg}
</svg>`;

  const base = sharp(Buffer.from(svg), { density: 192 });
  const roundedAvatar = input.avatar ? await renderRoundedAvatar(input.avatar, avatarSize) : null;

  if (roundedAvatar) {
    base.composite([
      {
        input: roundedAvatar,
        left: avatarCx - avatarR,
        top: avatarCy - avatarR
      }
    ]);
  }

  return base.webp({ quality: 92, effort: 4 }).toBuffer();
}
