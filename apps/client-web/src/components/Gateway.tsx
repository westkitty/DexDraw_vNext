import { useEffect, useRef, useState } from "react";
import type { ReactNode, SyntheticEvent } from "react";

const GATEWAY_ANIMATION_FALLBACK_MS = 9_000;
const TEST_GATEWAY_ANIMATION_FALLBACK_MS = 120;

function getGatewayFallbackMs() {
  if (typeof window === "undefined") return GATEWAY_ANIMATION_FALLBACK_MS;
  return window.navigator.webdriver
    ? TEST_GATEWAY_ANIMATION_FALLBACK_MS
    : GATEWAY_ANIMATION_FALLBACK_MS;
}

export function Gateway({ children }: { children: ReactNode }) {
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    animationTimerRef.current = setTimeout(() => {
      setAnimationComplete(true);
      animationTimerRef.current = null;
    }, getGatewayFallbackMs());

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      if (animationTimerRef.current !== null) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  function clearAnimationTimer() {
    if (animationTimerRef.current !== null) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
  }

  function markAnimationComplete() {
    clearAnimationTimer();
    setAnimationComplete(true);
  }

  function handleVideoMetadata(event: SyntheticEvent<HTMLVideoElement>) {
    const duration = event.currentTarget.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;

    clearAnimationTimer();
    animationTimerRef.current = setTimeout(
      markAnimationComplete,
      Math.max(getGatewayFallbackMs(), Math.ceil(duration * 1_000) + 1_000),
    );
  }

  function handleEnter() {
    if (!animationComplete || exiting) return;

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

  const phase = exiting ? "exiting" : animationComplete ? "ready" : "opening";

  return (
    <div
      className={`gateway${exiting ? " gateway--exiting" : ""}`}
      data-testid="gateway-screen"
      data-gateway-phase={phase}
      aria-busy={!animationComplete}
    >
      <video
        className="gateway-video"
        data-testid="gateway-video"
        src="/DexDraw_Opening.mp4"
        autoPlay
        muted
        playsInline
        onLoadedMetadata={handleVideoMetadata}
        onEnded={markAnimationComplete}
        onError={markAnimationComplete}
      />
      {animationComplete ? (
        <div className="gateway-content">
          <section
            className="gateway-barrier"
            aria-label="DexDraw canvas entry barrier"
          >
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
                disabled={exiting}
              >
                Enter Canvas
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
