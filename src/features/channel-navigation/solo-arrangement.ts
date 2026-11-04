import type { ChatArrange, ChatFacts } from "../conversation/service";

export type ArrangedChat = {
  id: string;
  group?: { id: string; label: string };
};

export function arrangeChats(
  arrange: ChatArrange | undefined,
  chats: readonly ChatFacts[],
): ArrangedChat[] {
  const fallback = chats.map((chat) => ({ id: chat.id }));
  if (!arrange) return fallback;
  let entries: unknown;
  try {
    entries = arrange(chats);
  } catch {
    return fallback;
  }
  if (!Array.isArray(entries)) return fallback;
  const known = new Set(chats.map((chat) => chat.id));
  const placed = new Set<string>();
  const groupIds = new Set<string>();
  const result: ArrangedChat[] = [];
  const take = (id: unknown) => {
    if (typeof id !== "string" || !known.has(id) || placed.has(id))
      return false;
    placed.add(id);
    return true;
  };
  for (const entry of entries as unknown[]) {
    if (typeof entry === "string") {
      if (take(entry)) result.push({ id: entry });
      continue;
    }
    if (!entry || typeof entry !== "object") continue;
    const { group, label, chats: members } = entry as Record<string, unknown>;
    if (!Array.isArray(members)) continue;
    const valid =
      typeof group === "string" &&
      group !== "" &&
      typeof label === "string" &&
      label.trim() !== "" &&
      !groupIds.has(group);
    if (typeof group === "string" && group !== "") groupIds.add(group);
    for (const id of members as unknown[]) {
      if (!take(id)) continue;
      result.push(
        valid
          ? { id: id as string, group: { id: group, label: label.trim() } }
          : { id: id as string },
      );
    }
  }
  for (const chat of chats)
    if (!placed.has(chat.id)) result.push({ id: chat.id });
  return result;
}
