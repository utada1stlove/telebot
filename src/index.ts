import "dotenv/config";
import { Telegraf } from "telegraf";
import { registerHandlers } from "./bot/handlers.js";

async function bootstrap() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error("Missing BOT_TOKEN. Put it in .env or container env.");
  }

  const bot = new Telegraf(token);

  bot.catch(async (error, ctx) => {
    console.error("Unhandled bot error:", error);

    if (ctx.chat) {
      try {
        await ctx.reply("出错了，稍后再试一次。", {
          reply_to_message_id: (ctx.message as any)?.message_id
        });
      } catch {
        // Ignore secondary failures.
      }
    }
  });

  registerHandlers(bot);

  const dropPendingUpdates = process.env.DROP_PENDING_UPDATES === "true";
  await bot.launch({ dropPendingUpdates });
  console.log("Reply sticker bot started.");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

bootstrap().catch((error) => {
  console.error("Failed to start bot:", error);
  process.exit(1);
});
