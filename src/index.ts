import "dotenv/config";
import { Telegraf } from "telegraf";
import { registerHandlers } from "./bot/handlers.js";

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("Missing BOT_TOKEN");

const bot = new Telegraf(token);

registerHandlers(bot);

bot.launch();
console.log("Reply Sticker Bot started");

// 优雅退出
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
