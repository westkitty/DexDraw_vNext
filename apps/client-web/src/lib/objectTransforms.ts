import type { BoardObject } from "@dexdraw/shared-protocol";

export type ArrangeAction = "front" | "back" | "forward" | "backward";

export interface ZIndexChange {
  id: string;
  prevZIndex: number;
  nextZIndex: number;
}

/**
 * Computes new zIndex assignments to implement an arrange action.
 *
 * Returns only entries where zIndex actually changes. Returns empty array
 * when the action is a no-op (already at top/bottom, or nothing selected).
 *
 * The resulting zIndices are dense integers starting from 0.
 */
export function computeArrange(
  allObjects: BoardObject[],
  selectedIds: string[],
  action: ArrangeAction,
): ZIndexChange[] {
  if (selectedIds.length === 0 || allObjects.length === 0) return [];

  const sorted = [...allObjects].sort((a, b) => a.zIndex - b.zIndex);
  const selectedSet = new Set(selectedIds);

  const order = sorted.map((o) => o.id);

  const selectedIdxs = order
    .map((id, i) => ({ id, i }))
    .filter(({ id }) => selectedSet.has(id))
    .map(({ i }) => i);

  if (selectedIdxs.length === 0) return [];

  const selectedIdsInOrder = selectedIdxs.map((i) => order[i]);
  const unselectedIdsInOrder = order.filter((id) => !selectedSet.has(id));

  let newOrder: string[];

  if (action === "front") {
    if (unselectedIdsInOrder.length === 0) return [];
    newOrder = [...unselectedIdsInOrder, ...selectedIdsInOrder];
  } else if (action === "back") {
    if (unselectedIdsInOrder.length === 0) return [];
    newOrder = [...selectedIdsInOrder, ...unselectedIdsInOrder];
  } else if (action === "forward") {
    const maxSelectedIdx = Math.max(...selectedIdxs);
    let swapIdx = -1;
    for (let i = maxSelectedIdx + 1; i < order.length; i++) {
      if (!selectedSet.has(order[i])) {
        swapIdx = i;
        break;
      }
    }
    if (swapIdx === -1) return [];

    const minSelectedIdx = Math.min(...selectedIdxs);
    const newArr = [...order];
    const [moved] = newArr.splice(swapIdx, 1);
    newArr.splice(minSelectedIdx, 0, moved);
    newOrder = newArr;
  } else {
    // backward
    const minSelectedIdx = Math.min(...selectedIdxs);
    let swapIdx = -1;
    for (let i = minSelectedIdx - 1; i >= 0; i--) {
      if (!selectedSet.has(order[i])) {
        swapIdx = i;
        break;
      }
    }
    if (swapIdx === -1) return [];

    const maxSelectedIdx = Math.max(...selectedIdxs);
    const newArr = [...order];
    const [moved] = newArr.splice(swapIdx, 1);
    // After removing swapIdx (< minSelectedIdx), all selected indices shift by -1.
    // maxSelectedIdx - 1 now points to the last selected; inserting at maxSelectedIdx
    // places the moved item just after the last selected.
    newArr.splice(maxSelectedIdx, 0, moved);
    newOrder = newArr;
  }

  const idToObject = new Map(allObjects.map((o) => [o.id, o]));
  return newOrder
    .map((id, newZ) => {
      const obj = idToObject.get(id);
      if (!obj) return null;
      return { id, prevZIndex: obj.zIndex, nextZIndex: newZ };
    })
    .filter(
      (entry): entry is ZIndexChange =>
        entry !== null && entry.prevZIndex !== entry.nextZIndex,
    );
}

/**
 * Creates a duplicate of a board object with a new ID, offset position,
 * and updated timestamps.
 */
export function duplicateObject(
  object: BoardObject,
  newId: string,
  newZIndex: number,
  now: string,
  createdBy: string,
  offset = 24,
): BoardObject {
  const base = {
    id: newId,
    createdBy,
    createdAt: now,
    updatedAt: now,
    zIndex: newZIndex,
  };

  if (object.type === "stroke") {
    return {
      ...object,
      ...base,
      points: object.points.map((p) => ({
        ...p,
        x: p.x + offset,
        y: p.y + offset,
      })),
    };
  }

  if (
    object.type === "rectangle" ||
    object.type === "text" ||
    object.type === "note"
  ) {
    return {
      ...object,
      ...base,
      x: object.x + offset,
      y: object.y + offset,
    };
  }

  if (object.type === "ellipse") {
    return {
      ...object,
      ...base,
      cx: object.cx + offset,
      cy: object.cy + offset,
    };
  }

  // exhaustive — TypeScript will catch unhandled variants
  return object;
}
