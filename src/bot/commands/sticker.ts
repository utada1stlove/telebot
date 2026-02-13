import {
  getCommandMessageId,
  getCommandMessageKeys,
  getCommandUserId,
  isStickerCommandContext,
  toReplyExtra
} from "../context.js";
import { getReplyPayload } from "../extract/replyPayload.js";
import { findFallbackReply } from "../store/recentMessages.js";
import { setLastSticker } from "../store/lastSticker.js";
import { fetchUserAvatar } from "../services/fetchAvatar.js";
import { renderReplySticker } from "../../render/renderReplySticker.js";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "未知错误";
}

export async function handleSticker(ctx: unknown) {
  if (!isStickerCommandContext(ctx)) {
    console.error("Invalid command context in /sticker handler");
    return;
  }

  const commandMessageId = getCommandMessageId(ctx);
  const strictReply = getReplyPayload(ctx);
  const reply = strictReply ?? findFallbackReply(ctx);

  if (!reply) {
    console.warn("No reply context on /sticker", {
      chatId: ctx.chat?.id,
      hasMessage: Boolean(ctx.message || ctx.msg),
      messageKeys: getCommandMessageKeys(ctx)
    });

    await ctx.reply("请先回复一条消息，再发送 /sticker。", toReplyExtra(commandMessageId));
    return;
  }

  if (!reply.text) {
    await ctx.reply("被回复的内容没有可提取文字（例如纯图片/文件）。", toReplyExtra(commandMessageId));
    return;
  }

  console.info("Reply context source", {
    source: reply.source,
    chatId: ctx.chat?.id,
    hasUserId: Boolean(reply.senderUserId)
  });

  try {
    const avatar = await fetchUserAvatar(ctx.telegram, reply.senderUserId);
    const sticker = await renderReplySticker({
      speaker: reply.speaker,
      text: reply.text,
      avatar
    });

    const actorUserId = getCommandUserId(ctx);
    if (typeof actorUserId === "number") {
      setLastSticker(actorUserId, sticker);
    }

    await ctx.replyWithSticker({ source: sticker }, toReplyExtra(commandMessageId));
  } catch (error) {
    console.error("Failed to render sticker:", error);
    await ctx.reply(`生成贴纸失败：${errorMessage(error)}`);
  }
}
