import {
  getCommandMessageId,
  isStickerCommandContext,
  toReplyExtra
} from "../context.js";
import {
  asRecord,
  readNumber,
  readRecord,
  readString
} from "../extract/messageIdentity.js";
import { fetchUserAvatar } from "../services/fetchAvatar.js";
import { renderReplySticker } from "../../render/renderReplySticker.js";

type PreviewIdentity = {
  speaker: string;
  userId?: number;
};

function getPreviewIdentity(ctx: unknown): PreviewIdentity {
  const context = asRecord(ctx);
  const from =
    readRecord(context, "from") ??
    readRecord(readRecord(context, "message"), "from") ??
    readRecord(readRecord(context, "msg"), "from");

  const firstName = readString(from, "first_name");
  const lastName = readString(from, "last_name");
  const username = readString(from, "username");
  const userId = readNumber(from, "id") ?? undefined;

  if (firstName) {
    return {
      speaker: `${firstName}${lastName ? ` ${lastName}` : ""}`.trim(),
      userId
    };
  }

  if (username) {
    return {
      speaker: `@${username}`,
      userId
    };
  }

  return {
    speaker: "Preview",
    userId
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

    await ctx.replyWithSticker({ source: sticker }, toReplyExtra(commandMessageId));
  } catch (error) {
    console.error("Failed to render /preview sticker:", error);
    await ctx.reply(`预览生成失败：${errorMessage(error)}`, toReplyExtra(commandMessageId));
  }
}
