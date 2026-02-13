import type { Telegraf } from "telegraf";
import { extractRepliedText, extractSpeaker, getRepliedMessage } from "./message.js";
import { renderReplySticker } from "../render/sticker.js";

function usageText() {
  return [
    "用法：",
    "1. 在私聊或群组里先回复一条消息",
    "2. 然后发送 /sticker",
    "",
    "提示：",
    "- 群组需要在 @BotFather 关闭 Group Privacy（/setprivacy -> Disable）",
    "- 只支持有文字的消息（文本或图片说明 caption）"
  ].join("\n");
}

export function registerHandlers(bot: Telegraf) {
  bot.command("start", async (ctx) => {
    await ctx.reply(usageText());
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(usageText());
  });

  bot.command("sticker", async (ctx: any) => {
    const replied = getRepliedMessage(ctx);
    if (!replied) {
      await ctx.reply("请先回复一条消息，再发送 /sticker。", {
        reply_to_message_id: ctx.message?.message_id
      });
      return;
    }

    const text = extractRepliedText(replied);
    if (!text) {
      await ctx.reply("被回复的内容没有可提取文字（例如纯图片/文件）。", {
        reply_to_message_id: ctx.message?.message_id
      });
      return;
    }

    const speaker = extractSpeaker(replied);

    try {
      const sticker = await renderReplySticker({ speaker, text });
      await ctx.replyWithSticker({ source: sticker }, { reply_to_message_id: ctx.message?.message_id });
    } catch (error: any) {
      console.error("Failed to render sticker:", error);
      await ctx.reply(`生成贴纸失败：${error?.message ?? "未知错误"}`);
    }
  });
}
