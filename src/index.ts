import { startBot } from "./app/startBot.js";

startBot().catch((error) => {
  console.error("Failed to start bot:", error);
  process.exit(1);
});
