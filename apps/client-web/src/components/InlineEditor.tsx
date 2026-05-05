import type { BoardObject } from "@dexdraw/shared-protocol";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

type EditableObject = Extract<BoardObject, { type: "text" | "note" }>;

type InlineEditorProps = {
  object: EditableObject;
  canvasEl: SVGSVGElement;
  onCommit: (id: string, text: string) => void;
  onCancel: () => void;
};

export function InlineEditor({
  object,
  canvasEl,
  onCommit,
  onCancel,
}: InlineEditorProps) {
  const [text, setText] = useState(object.text);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.select();
  }, []);

  const rect = canvasEl.getBoundingClientRect();
  const scaleX = rect.width / 1600;
  const scaleY = rect.height / 900;

  let left: number;
  let top: number;
  let width: number;
  let height: number;

  if (object.type === "note") {
    left = object.x * scaleX;
    top = object.y * scaleY;
    width = object.width * scaleX;
    height = object.height * scaleY;
  } else {
    const fontSize = object.style.fontSize ?? 18;
    left = object.x * scaleX;
    top = (object.y - fontSize) * scaleY;
    width = Math.max(120, object.text.length * fontSize * 0.7 * scaleX, 180);
    height = fontSize * 1.6 * scaleY;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }

    if (object.type === "text" && event.key === "Enter") {
      event.preventDefault();
      onCommit(object.id, text);
      return;
    }

    if (
      object.type === "note" &&
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey)
    ) {
      event.preventDefault();
      onCommit(object.id, text);
    }
  }

  return (
    <textarea
      ref={ref}
      data-testid="inline-editor"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onCommit(object.id, text)}
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        resize: "none",
        border: "2px solid #f97316",
        borderRadius: 6,
        padding: "4px 8px",
        fontSize:
          object.type === "text"
            ? (object.style.fontSize ?? 18) * scaleY
            : 14 * scaleY,
        lineHeight: 1.4,
        fontFamily: "inherit",
        background:
          object.type === "note" ? "#fde68a" : "rgba(255,251,245,0.96)",
        color: "#111827",
        outline: "none",
        zIndex: 100,
        overflowY: object.type === "note" ? "auto" : "hidden",
        whiteSpace: object.type === "note" ? "pre-wrap" : "nowrap",
        boxSizing: "border-box",
      }}
      aria-label="Edit text"
    />
  );
}
