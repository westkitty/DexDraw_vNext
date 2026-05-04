import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBoard, fetchTemplates, joinBoard } from "../lib/api";
import {
  setBoardShareCode,
  setBoardToken,
  setDisplayName,
} from "../lib/session";

export function HomePage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<
    Array<{ id: string; name: string; description: string }>
  >([]);
  const [createName, setCreateName] = useState("Untitled board");
  const [createDisplayName, setCreateDisplayName] = useState("Owner");
  const [templateId, setTemplateId] = useState("blank");
  const [joinBoardId, setJoinBoardId] = useState("");
  const [joinShareCode, setJoinShareCode] = useState("");
  const [joinDisplayName, setJoinDisplayName] = useState("Guest");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates()
      .then((result) => {
        setTemplates(result.templates);
        if (result.templates.length > 0) {
          setTemplateId(result.templates[0].id);
        }
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  async function handleCreateBoard() {
    try {
      setError(null);
      const response = await createBoard({
        name: createName,
        templateId,
        displayName: createDisplayName,
      });

      setBoardToken(response.boardId, response.ownerToken);
      setBoardShareCode(response.boardId, response.shareCode);
      setDisplayName(createDisplayName);
      navigate(response.boardUrl);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Board creation failed.",
      );
    }
  }

  async function handleJoinBoard() {
    try {
      setError(null);
      const response = await joinBoard(joinBoardId, {
        displayName: joinDisplayName,
        shareCode: joinShareCode,
      });

      setBoardToken(response.boardId, response.token);
      setBoardShareCode(response.boardId, joinShareCode);
      setDisplayName(joinDisplayName);
      navigate(response.boardUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Board join failed.");
    }
  }

  return (
    <main className="shell">
      <div className="home-grid">
        <section className="hero">
          <p>Private, self-hosted, server-authoritative collaboration.</p>
          <h1>DexDraw vNext</h1>
          <p>
            Repository B architecture. Repository A muscle memory. Fewer bad
            habits.
          </p>
        </section>

        {error ? <div className="board-error">{error}</div> : null}

        <div className="panel-grid">
          <section className="panel">
            <h2>Create</h2>
            <p>
              Start a board, get a share code, and keep the server in charge.
            </p>

            <div className="field">
              <label htmlFor="board-name">Board name</label>
              <input
                id="board-name"
                aria-label="Board name"
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="your-name">Your name</label>
              <input
                id="your-name"
                aria-label="Your name"
                value={createDisplayName}
                onChange={(event) => setCreateDisplayName(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="template">Template</label>
              <select
                id="template"
                aria-label="Template"
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="primary-button"
              type="button"
              onClick={handleCreateBoard}
            >
              Create board
            </button>
          </section>

          <section className="panel">
            <h2>Join</h2>
            <p>
              Use the board identifier and share code. Unknown users do not edit
              by magic.
            </p>

            <div className="field">
              <label htmlFor="join-board-id">Join board ID</label>
              <input
                id="join-board-id"
                aria-label="Join board ID"
                value={joinBoardId}
                onChange={(event) => setJoinBoardId(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="join-share-code">Join share code</label>
              <input
                id="join-share-code"
                aria-label="Join share code"
                value={joinShareCode}
                onChange={(event) =>
                  setJoinShareCode(event.target.value.toUpperCase())
                }
              />
            </div>

            <div className="field">
              <label htmlFor="join-display-name">Join display name</label>
              <input
                id="join-display-name"
                aria-label="Join display name"
                value={joinDisplayName}
                onChange={(event) => setJoinDisplayName(event.target.value)}
              />
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={handleJoinBoard}
            >
              Join board
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
