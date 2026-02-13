import type { Telegraf } from "telegraf";
import { getRepliedMessage, extractRepliedText, extractSpeaker } from "./message.js";
import { renderReplySticker } from "../render/sticker.js";

export function registerHandlers(bot: Telegraf) {
  bot.command("sticker", async (ctx: any) => {
    const reply = getRepliedMessage(ctx);
    if (!reply) {
      await ctx.reply("请回复一条消息再发送 /sticker（长按消息 → Reply → /sticker）");
      return;
    }

    const text = extractRepliedText(reply);
    if (!text) {
      await ctx.reply("被回复的消息没有可用文本（可能是纯图片/文件）。");
      return;
    }

    const speaker = extractSpeaker(reply);

    try {
      const webp = await renderReplySticker({ speaker, text, kind: "incoming" });
      await ctx.replyWithSticker({ source: webp });
    } catch (e: any) {
      await ctx.reply(`生成失败：${e?.message ?? e}`);
    }
  });

  bot.command("start", async (ctx) => {
    await ctx.reply(
      "用法：在群里回复一条消息，然后发送 /sticker，我会把那条消息做成 Telegram 深色风格贴纸。\n\n" +
      "注意：如果在群里无效，请在 @BotFather 里关闭 Group Privacy（/setprivacy -> Disable）。"
    );
  });
}
