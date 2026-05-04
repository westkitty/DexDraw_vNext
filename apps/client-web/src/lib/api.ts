type CreateBoardResponse = {
  boardId: string;
  shareCode: string;
  ownerToken: string;
  boardUrl: string;
  name: string;
  templateId: string;
};

type JoinBoardResponse = {
  boardId: string;
  token: string;
  role: "owner" | "edit" | "comment" | "view";
  boardUrl: string;
};

export async function fetchTemplates() {
  const response = await fetch("/api/templates");
  if (!response.ok) {
    throw new Error("Failed to load templates.");
  }

  return (await response.json()) as {
    templates: Array<{ id: string; name: string; description: string }>;
  };
}

export async function createBoard(payload: {
  name: string;
  templateId: string;
  displayName: string;
}) {
  const response = await fetch("/api/boards", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Board creation failed.");
  }

  return (await response.json()) as CreateBoardResponse;
}

export async function joinBoard(
  boardId: string,
  payload: {
    displayName: string;
    shareCode: string;
    requestedRole?: "edit" | "view";
  },
) {
  const response = await fetch(`/api/boards/${boardId}/join`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Board join failed.");
  }

  return (await response.json()) as JoinBoardResponse;
}
