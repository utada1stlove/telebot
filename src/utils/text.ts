export function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;"
  }[c] as string));
}

export function normalizeText(s: string) {
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

// 一个实用的裁剪：防止文本爆炸
export function clampText(s: string, maxLen: number) {
  const t = normalizeText(s);
  return t.length > maxLen ? t.slice(0, maxLen) + "…" : t;
}
