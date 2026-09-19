import type { CheckpointSummary } from "@dexdraw/shared-protocol";
import { useEffect, useRef, useState } from "react";
import type { PendingOp } from "../lib/recoveryJournal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  connection: "connected" | "connecting" | "disconnected";
  serverSeq: number;
  pendingOps: PendingOp[];
  cachedSnapshotAge: string;
  latestCheckpoint?: CheckpointSummary | null;
  recoveryIssue?: string | null;
  isCachedView: boolean;
  onRetryReconnect: () => void;
  onReloadAuthoritative: () => void;
  onExportRecoveryCopy: () => void;
  onDiscardLocalRecovery: () => void;
};

export function RecoveryCenterModal({
  isOpen,
  onClose,
  connection,
  serverSeq,
  pendingOps,
  cachedSnapshotAge,
  latestCheckpoint,
  recoveryIssue,
  isCachedView,
  onRetryReconnect,
  onReloadAuthoritative,
  onExportRecoveryCopy,
  onDiscardLocalRecovery,
}: Props) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setConfirmDiscard(false);
      return;
    }

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <dialog
        className="modal-card recovery-center-card"
        open
        aria-labelledby="recovery-center-title"
        data-testid="recovery-center-modal"
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
      >
        <header className="modal-header">
          <div>
            <p className="modal-kicker">Diagnostics & Continuity</p>
            <h2 id="recovery-center-title">Recovery Center</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close recovery center"
            data-testid="recovery-close-button"
          >
            ✕
          </button>
        </header>

        {isCachedView && (
          <div
            className="recovery-notice-banner"
            data-testid="cached-state-banner"
          >
            <strong>Local Cached View Active:</strong> Showing recovered local
            snapshot from {cachedSnapshotAge}. Edits will be held in pending
            queue until the authoritative server reconciles.
          </div>
        )}

        {recoveryIssue && (
          <div
            className="recovery-issue-banner"
            data-testid="recovery-issue-alert"
          >
            <strong>Recovery Issue:</strong> {recoveryIssue}
          </div>
        )}

        <div className="modal-body recovery-body">
          <section className="recovery-grid">
            <div className="recovery-stat-tile">
              <span className="recovery-stat-label">Connection</span>
              <strong
                className={`recovery-stat-val val-${connection}`}
                data-testid="recovery-stat-connection"
              >
                {connection}
              </strong>
            </div>

            <div className="recovery-stat-tile">
              <span className="recovery-stat-label">
                Confirmed Server Sequence
              </span>
              <strong
                className="recovery-stat-val"
                data-testid="recovery-stat-seq"
              >
                #{serverSeq}
              </strong>
            </div>

            <div className="recovery-stat-tile">
              <span className="recovery-stat-label">Pending Edits</span>
              <strong
                className="recovery-stat-val"
                data-testid="recovery-stat-pending"
              >
                {pendingOps.length}
              </strong>
            </div>

            <div className="recovery-stat-tile">
              <span className="recovery-stat-label">Local Snapshot Age</span>
              <strong
                className="recovery-stat-val"
                data-testid="recovery-stat-age"
              >
                {cachedSnapshotAge}
              </strong>
            </div>
          </section>

          <section className="recovery-checkpoint-info">
            <span className="recovery-stat-label">Latest Checkpoint</span>
            {latestCheckpoint ? (
              <p
                className="recovery-checkpoint-text"
                data-testid="recovery-latest-checkpoint"
              >
                <strong>{latestCheckpoint.name}</strong> (seq #
                {latestCheckpoint.serverSeq},{" "}
                {new Date(latestCheckpoint.createdAt).toLocaleTimeString()})
              </p>
            ) : (
              <p className="recovery-checkpoint-text muted">
                No checkpoints recorded yet.
              </p>
            )}
          </section>

          {pendingOps.length > 0 && (
            <section
              className="recovery-pending-list"
              data-testid="recovery-pending-list"
            >
              <span className="recovery-stat-label">
                Pending Operations Queue
              </span>
              <ul className="pending-ops-ul">
                {pendingOps.map((op) => (
                  <li key={op.opId} className="pending-op-item">
                    <code>{op.opType}</code>{" "}
                    <span className="muted">seq #{op.clientSeq}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="recovery-actions">
            <h3>Bounded Recovery Actions</h3>
            <div className="recovery-action-buttons">
              <button
                type="button"
                className="action-button"
                onClick={onRetryReconnect}
                data-testid="recovery-retry-reconnect-button"
              >
                Retry Reconnect
              </button>

              <button
                type="button"
                className="action-button"
                onClick={onReloadAuthoritative}
                data-testid="recovery-reload-authoritative-button"
              >
                Reload Authoritative State
              </button>

              <button
                type="button"
                className="action-button action-button--secondary"
                onClick={onExportRecoveryCopy}
                data-testid="recovery-export-copy-button"
              >
                Export Local Recovery Copy
              </button>
            </div>

            <div className="recovery-danger-zone">
              {!confirmDiscard ? (
                <button
                  type="button"
                  className="action-button action-button--danger"
                  onClick={() => setConfirmDiscard(true)}
                  data-testid="recovery-discard-trigger"
                >
                  Discard Local Recovery Copy…
                </button>
              ) : (
                <div
                  className="discard-confirm-box"
                  data-testid="recovery-discard-confirm-box"
                >
                  <p>
                    Are you sure? This discards local pending edits and local
                    cached snapshot. This cannot be undone.
                  </p>
                  <div className="discard-buttons">
                    <button
                      type="button"
                      className="action-button action-button--danger"
                      onClick={() => {
                        onDiscardLocalRecovery();
                        setConfirmDiscard(false);
                      }}
                      data-testid="recovery-confirm-discard-button"
                    >
                      Yes, Discard Local Copy
                    </button>
                    <button
                      type="button"
                      className="action-button"
                      onClick={() => setConfirmDiscard(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </dialog>
    </div>
  );
}
