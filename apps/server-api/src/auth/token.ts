import { type Role, RoleSchema } from "@dexdraw/shared-protocol";
import { SignJWT, jwtVerify } from "jose";

type TokenPayload = {
  boardId: string;
  role: Role;
  displayName: string;
};

function key(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function createBoardToken(secret: string, payload: TokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(key(secret));
}

export async function verifyBoardToken(secret: string, token: string) {
  const result = await jwtVerify(token, key(secret));
  return {
    boardId: String(result.payload.boardId),
    role: RoleSchema.parse(result.payload.role),
    displayName: String(result.payload.displayName ?? "Guest"),
  };
}
