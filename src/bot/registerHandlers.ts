import type { Telegraf } from "telegraf";
import { handleHelp, handleStart } from "./commands/start.js";
import { handleSticker } from "./commands/sticker.js";

export function registerHandlers(bot: Telegraf) {
  bot.command("start", async (ctx) => handleStart(ctx));
  bot.command("help", async (ctx) => handleHelp(ctx));
  bot.command("sticker", async (ctx) => handleSticker(ctx));
}
