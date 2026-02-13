export type BotConfig = {
  token: string;
  dropPendingUpdates: boolean;
  ownerTgid?: number;
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

function parseOptionalPositiveInt(name: string): number | undefined {
  const value = process.env[name];
  if (value === undefined || !value.trim()) return undefined;

  const parsed = Number(value.trim());
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name}: expected a positive integer TG user id.`);
  }

  return parsed;
}

export function loadBotConfig(): BotConfig {
  return {
    token: readRequired("BOT_TOKEN"),
    dropPendingUpdates: parseBoolean(process.env.DROP_PENDING_UPDATES, true),
    ownerTgid: parseOptionalPositiveInt("OWNER_TGID")
  };
}
