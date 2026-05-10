import { useEffect, useId, useRef } from "react";
import type { HelpTopic } from "./helpContent";

type HelpModalProps = {
  topic: HelpTopic;
  onClose: () => void;
};

export function HelpModal({ topic, onClose }: HelpModalProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  return (
    <div className="help-modal-backdrop" role="presentation">
      <dialog
        className="help-modal"
        open
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
      >
        <div className="help-modal-header">
          <div className="help-modal-heading">
            <h2 id={titleId} className="help-modal-title">
              {topic.title}
            </h2>
            {topic.summary ? (
              <p className="help-modal-summary">{topic.summary}</p>
            ) : null}
          </div>
          <button
            ref={closeButtonRef}
            className="secondary-button"
            type="button"
            aria-label={`Close ${topic.title}`}
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="help-modal-copy">
          {topic.sections.map((section) => (
            <section
              key={section.heading ?? section.body}
              className="help-modal-section"
            >
              {section.heading ? <h3>{section.heading}</h3> : null}
              <p>{section.body}</p>
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </dialog>
    </div>
  );
}
