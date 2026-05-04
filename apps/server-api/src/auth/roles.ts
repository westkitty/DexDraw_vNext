import type { Role } from "@dexdraw/shared-protocol";

export function canPerformDurableOp(
  role: Role,
  opType: string,
  payload: unknown,
) {
  if (role === "owner" || role === "edit") {
    return true;
  }

  if (role === "view") {
    return false;
  }

  if (role === "comment") {
    if (opType !== "object.create") {
      return false;
    }

    return (
      typeof payload === "object" &&
      payload !== null &&
      "type" in payload &&
      payload.type === "note"
    );
  }

  return false;
}
