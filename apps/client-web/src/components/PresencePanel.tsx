import type { RemotePresence } from "../lib/presence";

type PresencePanelProps = {
  localDisplayName: string;
  remotePresence: RemotePresence[];
};

export function PresencePanel({
  localDisplayName,
  remotePresence,
}: PresencePanelProps) {
  const uniqueRemote = Array.from(
    new Map(remotePresence.map((p) => [p.clientId, p])).values(),
  );
  const total = 1 + uniqueRemote.length;

  return (
    <div className="presence-panel" data-testid="presence-panel">
      <span className="presence-count" data-testid="presence-count">
        {total}
      </span>
      <div
        key="local"
        className="presence-participant presence-you"
        data-testid="presence-participant"
        title={localDisplayName}
      >
        You
      </div>
      {uniqueRemote.map((p) => (
        <div
          key={p.clientId}
          className="presence-participant"
          data-testid="presence-participant"
          title={p.displayName}
        >
          {p.displayName}
        </div>
      ))}
    </div>
  );
}
