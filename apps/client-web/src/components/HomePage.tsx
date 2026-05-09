import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBoard, fetchTemplates, joinBoard } from "../lib/api";
import {
  setBoardShareCode,
  setBoardToken,
  setDisplayName,
} from "../lib/session";
import { HelpButton } from "./HelpButton";
import { HelpModal } from "./HelpModal";
import { HELP_TOPICS, type HelpTopicId } from "./helpContent";

const HOME_REVEAL_MS = 560;

function getHomeRevealDelay(): number {
  if (typeof window === "undefined") return 0;
  if (window.navigator.webdriver) return 0;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  return HOME_REVEAL_MS;
}

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
  const [activeHelpId, setActiveHelpId] = useState<HelpTopicId | null>(null);
  const [openingPanel, setOpeningPanel] = useState<"create" | "join" | null>(
    null,
  );

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
      const createUrl = response.boardUrl;
      setOpeningPanel("create");
      setTimeout(() => {
        navigate(createUrl);
      }, getHomeRevealDelay());
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
      const joinUrl = response.boardUrl;
      setOpeningPanel("join");
      setTimeout(() => {
        navigate(joinUrl);
      }, getHomeRevealDelay());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Board join failed.");
    }
  }

  return (
    <main className={`shell${openingPanel ? " home-shell--opening" : ""}`}>
      <div className="home-grid">
        <section className="hero">
          <div className="section-header section-header--centered">
            <h1>DexDraw</h1>
            <HelpButton
              label="Home FAQ"
              onClick={() => setActiveHelpId("home-overview")}
            />
          </div>
          <p>Private, self-hosted, server-authoritative collaboration.</p>
          <p>
            Create boards quickly, share access cleanly, and keep sync sane.
          </p>
        </section>

        {error ? <div className="board-error">{error}</div> : null}

        <div className="panel-grid" data-testid="intake-zone">
          <section className="panel home-panel--create">
            <div className="section-header">
              <h2>Create</h2>
              <HelpButton
                label="Create FAQ"
                onClick={() => setActiveHelpId("home-create")}
              />
            </div>
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

          <section className="panel home-panel--join">
            <div className="section-header">
              <h2>Join</h2>
              <HelpButton
                label="Join FAQ"
                onClick={() => setActiveHelpId("home-join")}
              />
            </div>
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
      {activeHelpId ? (
        <HelpModal
          topic={HELP_TOPICS[activeHelpId]}
          onClose={() => setActiveHelpId(null)}
        />
      ) : null}
    </main>
  );
}
