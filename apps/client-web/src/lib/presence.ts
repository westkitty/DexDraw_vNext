export type RemotePresence = {
  clientId: string;
  displayName: string;
  x: number;
  y: number;
  type: "presence.cursor" | "presence.laser";
  sentAt: string;
};

export function mergePresence(
  current: RemotePresence[],
  next: RemotePresence,
): RemotePresence[] {
  const now = Date.now();
  const filtered = current.filter(
    (entry) =>
      entry.clientId !== next.clientId &&
      now - new Date(entry.sentAt).getTime() < 4_000,
  );
  return [...filtered, next];
}
