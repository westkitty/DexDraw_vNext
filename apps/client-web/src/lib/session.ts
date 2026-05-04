const boardTokenKey = (boardId: string) => `dexdraw-token:${boardId}`;
const boardShareCodeKey = (boardId: string) => `dexdraw-share:${boardId}`;
const boardNameKey = "dexdraw-display-name";
const clientIdKey = "dexdraw-client-id";

export function getClientId() {
  const existing = window.localStorage.getItem(clientIdKey);
  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();
  window.localStorage.setItem(clientIdKey, created);
  return created;
}

export function setBoardToken(boardId: string, token: string) {
  window.localStorage.setItem(boardTokenKey(boardId), token);
}

export function getBoardToken(boardId: string) {
  return window.localStorage.getItem(boardTokenKey(boardId));
}

export function setBoardShareCode(boardId: string, shareCode: string) {
  window.localStorage.setItem(boardShareCodeKey(boardId), shareCode);
}

export function getBoardShareCode(boardId: string) {
  return window.localStorage.getItem(boardShareCodeKey(boardId));
}

export function setDisplayName(value: string) {
  window.localStorage.setItem(boardNameKey, value);
}

export function getDisplayName() {
  return window.localStorage.getItem(boardNameKey) ?? "Guest";
}
