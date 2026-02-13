import "dotenv/config";
import { Telegraf } from "telegraf";
import { loadBotConfig } from "../config/env.js";
import { registerHandlers } from "../bot/registerHandlers.js";
import { rememberMessage } from "../bot/store/recentMessages.js";

export async function startBot() {
  const config = loadBotConfig();
  const bot = new Telegraf(config.token);

  bot.on("message", async (ctx, next) => {
    rememberMessage(ctx);
    await next();
  });

  bot.catch(async (error, ctx) => {
    console.error("Unhandled bot error:", error);

    if (ctx.chat) {
      try {
        await ctx.reply("出错了，稍后再试一次。");
      } catch {
        // Ignore secondary failures.
      }
    }
  });

  registerHandlers(bot);

  await bot.launch({ dropPendingUpdates: config.dropPendingUpdates });
  console.log("Reply sticker bot started.");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}
