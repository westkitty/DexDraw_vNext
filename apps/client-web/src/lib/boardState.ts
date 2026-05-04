import type { BoardObject, ServerOpEnvelope } from "@dexdraw/shared-protocol";

export function applyCanonicalOperation(
  current: BoardObject[],
  envelope: ServerOpEnvelope,
) {
  const objects = new Map(current.map((object) => [object.id, object]));

  if (envelope.opType === "object.create") {
    const object = envelope.payload as BoardObject;
    objects.set(object.id, object);
  }

  if (envelope.opType === "object.update") {
    const payload = envelope.payload as {
      id: string;
      patch: Partial<BoardObject>;
    };
    const previous = objects.get(payload.id);
    if (previous) {
      objects.set(payload.id, { ...previous, ...payload.patch } as BoardObject);
    }
  }

  if (envelope.opType === "object.delete") {
    const payload = envelope.payload as { id: string };
    objects.delete(payload.id);
  }

  if (envelope.opType === "object.reorder") {
    const payload = envelope.payload as { id: string; zIndex: number };
    const previous = objects.get(payload.id);
    if (previous) {
      objects.set(payload.id, {
        ...previous,
        zIndex: payload.zIndex,
      } as BoardObject);
    }
  }

  return [...objects.values()].sort(
    (left, right) => left.zIndex - right.zIndex,
  );
}
