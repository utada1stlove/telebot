import {
  getCommandMessageId,
  getCommandUser,
  getCommandUserId,
  isStickerCommandContext,
  toReplyExtra
} from "../context.js";
import { fetchUserAvatar } from "../services/fetchAvatar.js";
import { setLastSticker } from "../store/lastSticker.js";
import { renderReplySticker } from "../../render/renderReplySticker.js";

type PreviewIdentity = {
  speaker: string;
  userId?: number;
};

function getPreviewIdentity(ctx: unknown): PreviewIdentity {
  if (isStickerCommandContext(ctx)) {
    const user = getCommandUser(ctx);
    const userId = getCommandUserId(ctx);

    if (user?.first_name) {
      return {
        speaker: `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`.trim(),
        userId
      };
    }

    if (user?.username) {
      return {
        speaker: `@${user.username}`,
        userId
      };
    }

    return {
      speaker: "Preview",
      userId
    };
  }

  return {
    speaker: "Preview"
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "未知错误";
}

export async function handlePreview(ctx: unknown) {
  if (!isStickerCommandContext(ctx)) {
    console.error("Invalid command context in /preview handler");
    return;
  }

  const commandMessageId = getCommandMessageId(ctx);
  const identity = getPreviewIdentity(ctx);

  try {
    const avatar = await fetchUserAvatar(ctx.telegram, identity.userId);
    const sticker = await renderReplySticker({
      speaker: identity.speaker,
      text: "你好，这是 /preview 渲染测试。\n头像、字号、间距是否自然？",
      avatar
    });

    const actorUserId = getCommandUserId(ctx);
    if (typeof actorUserId === "number") {
      setLastSticker(actorUserId, sticker);
    }

    await ctx.replyWithSticker({ source: sticker }, toReplyExtra(commandMessageId));
  } catch (error) {
    console.error("Failed to render /preview sticker:", error);
    await ctx.reply(`预览生成失败：${errorMessage(error)}`, toReplyExtra(commandMessageId));
  }
}
