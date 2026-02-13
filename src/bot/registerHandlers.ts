import type { Telegraf } from "telegraf";
import { handlePack } from "./commands/pack.js";
import { handleHelp, handleStart } from "./commands/start.js";
import { handlePreview } from "./commands/preview.js";
import { handleSticker } from "./commands/sticker.js";

export function registerHandlers(bot: Telegraf) {
  bot.command("start", async (ctx) => handleStart(ctx));
  bot.command("help", async (ctx) => handleHelp(ctx));
  bot.command("preview", async (ctx) => handlePreview(ctx));
  bot.command("sticker", async (ctx) => handleSticker(ctx));
  bot.command("pack", async (ctx) => handlePack(ctx));
}
