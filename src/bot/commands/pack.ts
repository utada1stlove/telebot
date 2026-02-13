import {
  getCommandDisplayName,
  getCommandMessageId,
  getCommandUserId,
  isCommandContext,
  toReplyExtra
} from "../context.js";
import { describePackError, ensureStickerInPack } from "../services/stickerPack.js";
import { getLastSticker } from "../store/lastSticker.js";

export async function handlePack(ctx: unknown) {
  if (!isCommandContext(ctx)) {
    console.error("Invalid command context in /pack handler");
    return;
  }

  const commandMessageId = getCommandMessageId(ctx);
  const userId = getCommandUserId(ctx);

  if (typeof userId !== "number") {
    await ctx.reply("无法识别你的账号，请用个人账号发送 /pack。", toReplyExtra(commandMessageId));
    return;
  }

  const lastSticker = getLastSticker(userId);
  if (!lastSticker) {
    await ctx.reply("你还没有可加入贴纸包的贴纸。先用 /sticker 或 /preview 生成一张。", toReplyExtra(commandMessageId));
    return;
  }

  try {
    const result = await ensureStickerInPack({
      telegram: ctx.telegram,
      userId,
      displayName: getCommandDisplayName(ctx),
      sticker: lastSticker,
      emoji: "💬"
    });

    const actionText = result.created ? "已创建新的贴纸包并加入这张贴纸。" : "已把这张贴纸加入你的贴纸包。";
    await ctx.reply(
      `${actionText}\n\n打开贴纸包：https://t.me/addstickers/${result.packName}`,
      toReplyExtra(commandMessageId)
    );
  } catch (error) {
    console.error("Failed to add sticker to pack:", error);
    await ctx.reply(`加入贴纸包失败：${describePackError(error)}`, toReplyExtra(commandMessageId));
  }
}
