import sharp from "sharp";
import { clampText, ellipsizeLastLine, escapeXml, wrapText } from "../utils/text.js";
import { theme } from "./theme.js";
import type { StickerBubble } from "../types/sticker.js";

const W = 512;
const H = 512;
const BUBBLE_X = 88;
const BUBBLE_PADDING_X = 28;
const SPEAKER_FONT_SIZE = 38;
const BODY_FONT_SIZE = 34;
const BODY_LINE_HEIGHT = 42;
const MAX_BODY_LINES = 5;
const BODY_MAX_UNITS = 16;
const TOP_PADDING = 20;
const SPEAKER_GAP_TO_BODY = 8;
const BOTTOM_PADDING = 18;
const BUBBLE_MIN_W = 190;
const BUBBLE_MAX_W = 396;
const BUBBLE_MIN_H = 122;
const BUBBLE_MAX_H = 448;

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

function widthUnits(char: string): number {
  return /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe10-\ufe6f\uff00-\uff60\uffe0-\uffe6]/u.test(char)
    ? 2
    : 1;
}

function textUnits(text: string): number {
  let units = 0;
  for (const ch of text) units += widthUnits(ch);
  return units;
}

function unitsToPx(units: number, fontSize: number): number {
  return units * fontSize * 0.56;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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
  const speakerRaw = clampText(input.speaker, 26);
  const bodyLinesRaw = buildBodyLines(input.text);
  const speaker = escapeXml(speakerRaw);
  const bodyLines = bodyLinesRaw.map(escapeXml);

  const speakerWidth = unitsToPx(textUnits(speakerRaw), SPEAKER_FONT_SIZE);
  const bodyMaxUnits = bodyLinesRaw.reduce((max, line) => Math.max(max, textUnits(line)), 1);
  const bodyWidth = unitsToPx(bodyMaxUnits, BODY_FONT_SIZE);
  const contentWidth = Math.max(speakerWidth, bodyWidth);
  const bubbleWidth = clamp(
    Math.ceil(contentWidth + BUBBLE_PADDING_X * 2),
    BUBBLE_MIN_W,
    BUBBLE_MAX_W
  );

  const textBlockHeight = BODY_FONT_SIZE + Math.max(0, bodyLines.length - 1) * BODY_LINE_HEIGHT;
  const bubbleHeight = clamp(
    Math.ceil(TOP_PADDING + SPEAKER_FONT_SIZE + SPEAKER_GAP_TO_BODY + textBlockHeight + BOTTOM_PADDING),
    BUBBLE_MIN_H,
    BUBBLE_MAX_H
  );
  const bubbleY = Math.max(24, Math.floor((H - bubbleHeight) / 2));

  const avatarR = 38;
  const avatarSize = avatarR * 2;
  const avatarGap = 10;
  const avatarCx = BUBBLE_X - avatarR - avatarGap;
  const avatarCy = bubbleY + avatarR + 6;

  const bodyStartX = BUBBLE_X + BUBBLE_PADDING_X;
  const speakerY = bubbleY + TOP_PADDING + SPEAKER_FONT_SIZE;
  const bodyStartY = speakerY + SPEAKER_GAP_TO_BODY + BODY_FONT_SIZE - 1;

  const bodySvg = bodyLines
    .map((line, index) => {
      const y = bodyStartY + index * BODY_LINE_HEIGHT;
      return `<text x="${bodyStartX}" y="${y}" fill="${theme.text}" font-size="${BODY_FONT_SIZE}" font-weight="700">${line}</text>`;
    })
    .join("\n");

  const avatarFallback = `
  <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}" fill="${theme.avatarBg}"/>
  <text x="${avatarCx}" y="${avatarCy + 14}" text-anchor="middle" fill="${theme.avatarText}" font-size="38" font-weight="800">
    ${escapeXml(initialOf(input.speaker))}
  </text>`;

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

  <rect x="${BUBBLE_X}" y="${bubbleY}" width="${bubbleWidth}" height="${bubbleHeight}" rx="34" ry="34"
    fill="${theme.bubble}" stroke="${theme.bubbleStroke}" stroke-width="2" filter="url(#shadow)"/>

  ${input.avatar ? "" : avatarFallback}

  <text x="${BUBBLE_X + BUBBLE_PADDING_X}" y="${speakerY}" fill="${theme.speaker}" font-size="${SPEAKER_FONT_SIZE}" font-weight="800">
    ${speaker}
  </text>

  ${bodySvg}
</svg>`;

  const base = sharp(Buffer.from(svg), { density: 72 });
  const roundedAvatar = input.avatar ? await renderRoundedAvatar(input.avatar, avatarSize) : null;

  if (roundedAvatar) {
    base.composite([
      {
        input: roundedAvatar,
        left: avatarCx - avatarR,
        top: avatarCy - avatarR
      },
      {
        input: Buffer.from(`<svg width="${avatarSize}" height="${avatarSize}" xmlns="http://www.w3.org/2000/svg"><circle cx="${avatarR}" cy="${avatarR}" r="${avatarR - 1}" fill="none" stroke="#2a3e58" stroke-width="2"/></svg>`),
        left: avatarCx - avatarR,
        top: avatarCy - avatarR
      }
    ]);
  }

  return base.webp({ quality: 92, effort: 4 }).toBuffer();
}
