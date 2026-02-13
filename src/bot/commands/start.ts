import { isCommandContext } from "../context.js";

const usage = [
  "用法：",
  "1. 在私聊或群组里先回复一条消息",
  "2. 然后发送 /sticker",
  "3. 发送 /preview 可快速预览当前贴纸样式",
  "4. 发送 /pack 可把最近一张贴纸加入你的贴纸包",
  "",
  "提示：",
  "- 群组需要在 @BotFather 关闭 Group Privacy（/setprivacy -> Disable）",
  "- 只支持有文字的消息（文本或图片说明 caption）"
].join("\n");

async function replyUsage(ctx: unknown) {
  if (!isCommandContext(ctx)) {
    console.error("Invalid command context in start/help handler");
    return;
  }

  await ctx.reply(usage);
}

export async function handleStart(ctx: unknown) {
  await replyUsage(ctx);
}

export async function handleHelp(ctx: unknown) {
  await replyUsage(ctx);
}
