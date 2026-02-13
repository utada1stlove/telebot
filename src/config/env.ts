export type BotConfig = {
  token: string;
  dropPendingUpdates: boolean;
};

function readRequired(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function parseBoolean(input: string | undefined, fallback: boolean): boolean {
  if (input === undefined) return fallback;
  return input.trim().toLowerCase() === "true";
}

export function loadBotConfig(): BotConfig {
  return {
    token: readRequired("BOT_TOKEN"),
    dropPendingUpdates: parseBoolean(process.env.DROP_PENDING_UPDATES, true)
  };
}
