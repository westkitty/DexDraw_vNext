import type { BoardObject } from "@dexdraw/shared-protocol";

export type PendingOp = {
  opId: string;
  clientSeq: number;
  opType: string;
  payload: unknown;
  sentAt: string;
};

export type LocalRecoveryRecord = {
  boardId: string;
  boardTitle: string;
  serverSeq: number;
  objects: BoardObject[];
  pendingOps: PendingOp[];
  savedAt: string;
};

const DB_NAME = "dexdraw_recovery_db";
const DB_VERSION = 1;
const STORE_NAME = "recovery_snapshots";
const MAX_PENDING_OPS = 100;

// In-memory fallback if IndexedDB is not supported in the environment
const memoryStore = new Map<string, LocalRecoveryRecord>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      return reject(new Error("IndexedDB unavailable"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "boardId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

export async function saveRecoverySnapshot(
  record: LocalRecoveryRecord,
): Promise<void> {
  // Cap pending operations to prevent unbounded divergence journal growth
  const boundedRecord: LocalRecoveryRecord = {
    ...record,
    pendingOps: record.pendingOps.slice(-MAX_PENDING_OPS),
    savedAt: new Date().toISOString(),
  };

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(boundedRecord);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to in-memory store
    memoryStore.set(record.boardId, boundedRecord);
  }
}

export async function loadRecoverySnapshot(
  boardId: string,
): Promise<LocalRecoveryRecord | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(boardId);
      req.onsuccess = () =>
        resolve((req.result as LocalRecoveryRecord) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return memoryStore.get(boardId) ?? null;
  }
}

export async function clearRecoverySnapshot(boardId: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(boardId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    memoryStore.delete(boardId);
  }
}

export function formatSnapshotAge(isoDateString?: string): string {
  if (!isoDateString) return "unknown";
  const deltaMs = Date.now() - new Date(isoDateString).getTime();
  if (deltaMs < 5_000) return "just now";
  if (deltaMs < 60_000) return `${Math.floor(deltaMs / 1000)}s ago`;
  if (deltaMs < 3_600_000) return `${Math.floor(deltaMs / 60_000)}m ago`;
  return `${Math.floor(deltaMs / 3_600_000)}h ago`;
}
