export type JsonRecord = Record<string, unknown>;

export type MessageIdentity = {
  speaker: string;
  senderUserId?: number;
};

export function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object") return null;
  return value as JsonRecord;
}

export function readRecord(record: JsonRecord | null, key: string): JsonRecord | null {
  if (!record) return null;
  return asRecord(record[key]);
}

export function readString(record: JsonRecord | null, key: string): string | null {
  if (!record) return null;
  const value = record[key];
  return typeof value === "string" ? value : null;
}

export function readNumber(record: JsonRecord | null, key: string): number | null {
  if (!record) return null;
  const value = record[key];
  return typeof value === "number" ? value : null;
}

function normalizeDisplayName(firstName: string | null, lastName: string | null, username: string | null): string | null {
  if (firstName) return `${firstName}${lastName ? ` ${lastName}` : ""}`.trim();
  if (username) return `@${username}`;
  return null;
}

function extractOriginIdentity(origin: JsonRecord | null): MessageIdentity | null {
  if (!origin) return null;

  const originType = readString(origin, "type");

  if (originType === "user") {
    const user = readRecord(origin, "sender_user");
    const name = normalizeDisplayName(
      readString(user, "first_name"),
      readString(user, "last_name"),
      readString(user, "username")
    );
    if (!name) return null;

    const userId = readNumber(user, "id") ?? undefined;
    return { speaker: name, senderUserId: userId };
  }

  if (originType === "hidden_user") {
    const hiddenName = readString(origin, "sender_user_name");
    if (!hiddenName) return null;
    return { speaker: hiddenName };
  }

  if (originType === "chat" || originType === "channel") {
    const senderChat = readRecord(origin, "sender_chat") ?? readRecord(origin, "chat");
    const title = readString(senderChat, "title");
    if (title) return { speaker: title };

    const signature = readString(origin, "author_signature");
    if (signature) return { speaker: signature };
  }

  return null;
}

function extractLegacyForwardIdentity(message: JsonRecord | null): MessageIdentity | null {
  if (!message) return null;

  const forwardFrom = readRecord(message, "forward_from");
  const forwardName = normalizeDisplayName(
    readString(forwardFrom, "first_name"),
    readString(forwardFrom, "last_name"),
    readString(forwardFrom, "username")
  );

  if (forwardName) {
    return {
      speaker: forwardName,
      senderUserId: readNumber(forwardFrom, "id") ?? undefined
    };
  }

  const hiddenForwardName = readString(message, "forward_sender_name");
  if (hiddenForwardName) return { speaker: hiddenForwardName };

  const forwardFromChat = readRecord(message, "forward_from_chat");
  const forwardChatTitle = readString(forwardFromChat, "title");
  if (forwardChatTitle) return { speaker: forwardChatTitle };

  const signature = readString(message, "forward_signature");
  if (signature) return { speaker: signature };

  return null;
}

function extractDirectIdentity(message: JsonRecord | null): MessageIdentity | null {
  if (!message) return null;

  const from = readRecord(message, "from");
  const speaker = normalizeDisplayName(
    readString(from, "first_name"),
    readString(from, "last_name"),
    readString(from, "username")
  );

  if (speaker) {
    return {
      speaker,
      senderUserId: readNumber(from, "id") ?? undefined
    };
  }

  const senderChat = readRecord(message, "sender_chat");
  const senderChatTitle = readString(senderChat, "title");
  if (senderChatTitle) {
    return { speaker: senderChatTitle };
  }

  return null;
}

export function extractMessageIdentity(message: JsonRecord | null): MessageIdentity {
  const originIdentity = extractOriginIdentity(readRecord(message, "forward_origin") ?? readRecord(message, "origin"));
  if (originIdentity) return originIdentity;

  const legacyForwardIdentity = extractLegacyForwardIdentity(message);
  if (legacyForwardIdentity) return legacyForwardIdentity;

  const directIdentity = extractDirectIdentity(message);
  if (directIdentity) return directIdentity;

  return { speaker: "Unknown" };
}
