import type { Telegraf } from "telegraf";
import { handlePack } from "./commands/pack.js";
import { handleHelp, handleStart } from "./commands/start.js";
import { handlePreview } from "./commands/preview.js";
import { handleSticker } from "./commands/sticker.js";
import { getCommandMessageId, getCommandUserId, isCommandContext, toReplyExtra } from "./context.js";

type RegisterOptions = {
  ownerTgid?: number;
};

type CommandHandler = (ctx: unknown) => Promise<void>;

function withOwnerGuard(handler: CommandHandler, ownerTgid?: number): CommandHandler {
  if (typeof ownerTgid !== "number") return handler;

  return async (ctx: unknown) => {
    if (!isCommandContext(ctx)) {
      console.error("Invalid command context in owner guard");
      return;
    }

    const userId = getCommandUserId(ctx);
    if (userId !== ownerTgid) {
      await ctx.reply("当前机器人已开启仅限指定 TGID 使用。", toReplyExtra(getCommandMessageId(ctx)));
      return;
    }

    await handler(ctx);
  };
}

export function registerHandlers(bot: Telegraf, options: RegisterOptions = {}) {
  const guarded = (handler: CommandHandler) => withOwnerGuard(handler, options.ownerTgid);

  bot.command("start", guarded(handleStart));
  bot.command("help", guarded(handleHelp));
  bot.command("preview", guarded(handlePreview));
  bot.command("sticker", guarded(handleSticker));
  bot.command("pack", guarded(handlePack));
}
