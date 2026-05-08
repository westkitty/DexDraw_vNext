import { useEffect, useRef } from "react";
import { useState } from "react";
import type { ReactNode } from "react";

const ENTERED_KEY = "dexdraw-entered";

function hasEntered(): boolean {
  try {
    return localStorage.getItem(ENTERED_KEY) === "1";
  } catch {
    return false;
  }
}

function markEntered(): void {
  try {
    localStorage.setItem(ENTERED_KEY, "1");
  } catch {
    // storage unavailable — degrade gracefully
  }
}

export function Gateway({ children }: { children: ReactNode }) {
  const [entered, setEntered] = useState(hasEntered);
  const [exiting, setExiting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleEnter() {
    markEntered();
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
    return <div data-testid="app-shell">{children}</div>;
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
        <h1 className="gateway-title">DexDraw</h1>
        <p className="gateway-subtitle">
          Private. Self-hosted. Server-authoritative.
        </p>
        <button
          className="gateway-enter"
          data-testid="gateway-enter"
          type="button"
          onClick={handleEnter}
        >
          Enter
        </button>
      </div>
    </div>
  );
}
