import { useEffect, useRef } from "react";
import { useState } from "react";
import type { ReactNode } from "react";
import { HelpButton } from "./HelpButton";
import { HelpModal } from "./HelpModal";
import { HELP_TOPICS } from "./helpContent";

const ENTERED_KEY = "dexdraw-entered";

export function Gateway({ children }: { children: ReactNode }) {
  const [entered, setEntered] = useState(() => {
    try {
      return localStorage.getItem(ENTERED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [exiting, setExiting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleEnter() {
    try {
      localStorage.setItem(ENTERED_KEY, "1");
    } catch {
      // ignore — storage unavailable in some private-browsing modes
    }
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      setEntered(true);
    } else {
      setExiting(true);
      // transition duration matches .gateway--exiting CSS (600ms)
      timeoutRef.current = setTimeout(() => setEntered(true), 600);
    }
  }

  if (entered) {
    return (
      <div data-testid="app-shell" data-app-theme="dark">
        {children}
      </div>
    );
  }

  return (
    <div
      className={`gateway${exiting ? " gateway--exiting" : ""}`}
      data-testid="gateway-screen"
    >
      <video
        className="gateway-video"
        data-testid="gateway-video"
        src="/DexDraw_Opening.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="gateway-content">
        <p className="gateway-subtitle">
          Collaborative visual thinking for boards, sketches and structured
          creative work.
        </p>

        <div className="gateway-actions">
          <button
            className="gateway-enter"
            data-testid="gateway-enter"
            type="button"
            onClick={handleEnter}
          >
            Enter
          </button>
          <HelpButton
            label="Gateway FAQ"
            variant="gateway"
            onClick={() => setHelpOpen(true)}
          />
        </div>
      </div>
      {helpOpen ? (
        <HelpModal
          topic={HELP_TOPICS.gateway}
          onClose={() => setHelpOpen(false)}
        />
      ) : null}
    </div>
  );
}
