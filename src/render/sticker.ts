import sharp from "sharp";
import { escapeXml, clampText } from "../utils/text.js";
import type { StickerBubble } from "../types/index.js";
import { tgDarkTheme as theme } from "./theme.js";

const W = 512;
const H = 512;

type Layout = {
  x: number;
  y: number;
  w: number;
  h: number;
  speaker: string;
  text: string;
};

function estimateBox(textLen: number) {
  // Telegram 气泡宽度随文本长度变化（粗略即可，MVP 不追求完美）
  const minW = 260;
  const maxW = 440;
  const w = Math.max(minW, Math.min(maxW, 220 + Math.min(80, textLen) * 4));
  return w;
}

export async function renderReplySticker(b: StickerBubble): Promise<Buffer> {
  const speaker = escapeXml(clampText(b.speaker, 36));
  const text = escapeXml(clampText(b.text, 260));

  const bubbleW = estimateBox(text.length);

  // 用 foreignObject 让浏览器式排版自动换行（sharp 支持）
  // 这里的高度给一个上限，防止溢出；内容过多会被裁剪（MVP）
  const bubbleX = 36;
  const bubbleY = 90;
  const bubbleH = 340;

  const layout: Layout = {
    x: bubbleX,
    y: bubbleY,
    w: bubbleW,
    h: bubbleH,
    speaker,
    text
  };

  const svg = `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-25%" y="-25%" width="160%" height="160%">
        <feDropShadow dx="0" dy="${theme.shadow.dy}" stdDeviation="${theme.shadow.blur}"
          flood-opacity="${theme.shadow.opacity}"/>
      </filter>
    </defs>

    <!-- 透明背景：更像贴纸 -->
    <!-- 气泡 -->
    <rect x="${layout.x}" y="${layout.y}" width="${layout.w}" height="${layout.h}"
      rx="${theme.radius}" ry="${theme.radius}"
      fill="${theme.bubbleIncoming}" filter="url(#shadow)"/>

    <!-- 文本块 -->
    <foreignObject x="${layout.x + 22}" y="${layout.y + 18}" width="${layout.w - 44}" height="${layout.h - 36}">
      <div xmlns="http://www.w3.org/1999/xhtml"
        style="
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Noto Sans CJK SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
          color: ${theme.textPrimary};
          width: 100%;
          height: 100%;
          overflow: hidden;
        ">
        <div style="
          font-size: 22px;
          line-height: 28px;
          color: ${theme.textSecondary};
          margin-bottom: 10px;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        ">${layout.speaker}</div>

        <div style="
          font-size: 34px;
          line-height: 46px;
          word-break: break-word;
          overflow-wrap: anywhere;
        ">${layout.text}</div>
      </div>
    </foreignObject>
  </svg>`;

  return sharp(Buffer.from(svg))
    .webp({ quality: 92 })
    .toBuffer();
}
