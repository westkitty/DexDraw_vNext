type HelpButtonProps = {
  label: string;
  onClick: () => void;
  variant?: "default" | "gateway";
};

export function HelpButton({
  label,
  onClick,
  variant = "default",
}: HelpButtonProps) {
  return (
    <button
      className={`help-trigger${variant === "gateway" ? " help-trigger--gateway" : ""}`}
      type="button"
      aria-label={label}
      onClick={onClick}
    >
      FAQ
    </button>
  );
}
