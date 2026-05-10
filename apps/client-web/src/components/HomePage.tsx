import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
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
const MAX_INK_DROPS = 14;

type InkDrop = {
  id: number;
  x: number;
  y: number;
};

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inkDrops, setInkDrops] = useState<InkDrop[]>([]);
  const inkIdRef = useRef(0);

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
    const boardName = createName.trim();
    const ownerName = createDisplayName.trim();

    if (!boardName) {
      setError("Board name is required before creating a board.");
      return;
    }
    if (!ownerName) {
      setError("Your name is required before creating a board.");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const response = await createBoard({
        name: boardName,
        templateId,
        displayName: ownerName,
      });

      setBoardToken(response.boardId, response.ownerToken);
      setBoardShareCode(response.boardId, response.shareCode);
      setDisplayName(ownerName);
      const createUrl = response.boardUrl;
      setOpeningPanel("create");
      setTimeout(() => {
        navigate(createUrl);
      }, getHomeRevealDelay());
    } catch (reason) {
      setIsSubmitting(false);
      setOpeningPanel(null);
      setError(
        reason instanceof Error ? reason.message : "Board creation failed.",
      );
    }
  }

  async function handleJoinBoard() {
    const boardId = joinBoardId.trim();
    const shareCode = joinShareCode.trim().toUpperCase();
    const guestName = joinDisplayName.trim();

    if (!boardId) {
      setError("Board ID is required before joining a board.");
      return;
    }
    if (!shareCode) {
      setError("Share code is required before joining a board.");
      return;
    }
    if (!guestName) {
      setError("Display name is required before joining a board.");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const response = await joinBoard(boardId, {
        displayName: guestName,
        shareCode,
      });

      setBoardToken(response.boardId, response.token);
      setBoardShareCode(response.boardId, shareCode);
      setDisplayName(guestName);
      const joinUrl = response.boardUrl;
      setOpeningPanel("join");
      setTimeout(() => {
        navigate(joinUrl);
      }, getHomeRevealDelay());
    } catch (reason) {
      setIsSubmitting(false);
      setOpeningPanel(null);
      setError(reason instanceof Error ? reason.message : "Board join failed.");
    }
  }

  function handleInkMove(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    const id = inkIdRef.current + 1;
    inkIdRef.current = id;
    const drop = { id, x: event.clientX, y: event.clientY };
    setInkDrops((current) => [...current.slice(-MAX_INK_DROPS + 1), drop]);
    window.setTimeout(() => {
      setInkDrops((current) => current.filter((item) => item.id !== id));
    }, 720);
  }

  return (
    <main
      className={`shell${openingPanel ? " home-shell--opening" : ""}`}
      onPointerMove={handleInkMove}
      aria-busy={isSubmitting}
    >
      <div className="ink-trail" aria-hidden="true">
        {inkDrops.map((drop) => (
          <span
            key={drop.id}
            className="ink-drop"
            style={{ left: drop.x, top: drop.y }}
          />
        ))}
      </div>
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

        {error ? (
          <div className="board-error" role="alert">
            {error}
          </div>
        ) : null}

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
                disabled={isSubmitting}
              />
            </div>

            <div className="field">
              <label htmlFor="your-name">Your name</label>
              <input
                id="your-name"
                aria-label="Your name"
                value={createDisplayName}
                onChange={(event) => setCreateDisplayName(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="field">
              <label htmlFor="template">Template</label>
              <select
                id="template"
                aria-label="Template"
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
                disabled={isSubmitting || templates.length === 0}
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
              disabled={isSubmitting}
            >
              {openingPanel === "create" ? "Opening board…" : "Create board"}
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
                disabled={isSubmitting}
                autoComplete="off"
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
                disabled={isSubmitting}
                autoComplete="off"
              />
            </div>

            <div className="field">
              <label htmlFor="join-display-name">Join display name</label>
              <input
                id="join-display-name"
                aria-label="Join display name"
                value={joinDisplayName}
                onChange={(event) => setJoinDisplayName(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={handleJoinBoard}
              disabled={isSubmitting}
            >
              {openingPanel === "join" ? "Opening board…" : "Join board"}
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
