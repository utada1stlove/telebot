export function escapeXml(input: string) {
  return input.replace(/[<>&'"]/g, (char) => {
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    if (char === "&") return "&amp;";
    if (char === "'") return "&apos;";
    return "&quot;";
  });
}

export function normalizeText(input: string) {
  return input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

export function clampText(input: string, maxLen: number) {
  const normalized = normalizeText(input);
  if (normalized.length <= maxLen) return normalized;
  return `${normalized.slice(0, Math.max(1, maxLen - 1))}…`;
}

function widthOfChar(char: string): number {
  return /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe10-\ufe6f\uff00-\uff60\uffe0-\uffe6]/u.test(char)
    ? 2
    : 1;
}

export function wrapText(input: string, maxUnitsPerLine: number, maxLines: number) {
  const lines: string[] = [];
  const paragraphs = normalizeText(input).split("\n");
  let truncated = false;

  for (let pIndex = 0; pIndex < paragraphs.length; pIndex += 1) {
    const paragraph = paragraphs[pIndex];
    if (!paragraph.length) {
      lines.push("");
      if (lines.length >= maxLines) {
        truncated = pIndex < paragraphs.length - 1;
        break;
      }
      continue;
    }

    let current = "";
    let units = 0;

    for (let cIndex = 0; cIndex < paragraph.length; cIndex += 1) {
      const char = paragraph[cIndex];
      const charUnits = widthOfChar(char);
      if (units + charUnits > maxUnitsPerLine) {
        lines.push(current);
        if (lines.length >= maxLines) {
          truncated = cIndex < paragraph.length || pIndex < paragraphs.length - 1;
          break;
        }
        current = char;
        units = charUnits;
      } else {
        current += char;
        units += charUnits;
      }
    }

    if (lines.length >= maxLines) break;
    if (current.length) lines.push(current);
    if (lines.length >= maxLines) {
      truncated = pIndex < paragraphs.length - 1;
      break;
    }
  }

  if (!lines.length) return { lines: [""], truncated };
  return { lines: lines.slice(0, maxLines), truncated };
}

export function ellipsizeLastLine(lines: string[], didTruncate: boolean) {
  if (!didTruncate || !lines.length) return lines;
  const clone = [...lines];
  clone[clone.length - 1] = `${clone[clone.length - 1].replace(/…$/, "")}…`;
  return clone;
}
