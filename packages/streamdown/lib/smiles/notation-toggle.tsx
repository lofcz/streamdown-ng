import { useContext } from "react";
import { useCn } from "../prefix-context";
import { StreamdownContext } from "../streamdown-context";
import { useTranslations } from "../translations-context";

interface SmilesNotationToggleProps {
  compact: boolean;
  onToggle: () => void;
}

export const SmilesNotationToggle = ({
  compact,
  onToggle,
}: SmilesNotationToggleProps) => {
  const cn = useCn();
  const t = useTranslations();
  const { isAnimating } = useContext(StreamdownContext);
  const label = compact ? t.smilesShowStructures : t.smilesShowCompact;

  return (
    <button
      aria-label={label}
      aria-pressed={compact}
      className={cn(
        "cursor-pointer px-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
        compact && "text-foreground"
      )}
      disabled={isAnimating}
      onClick={onToggle}
      title={label}
      type="button"
    >
      <span className={cn("font-mono text-[10px] leading-none")}>CH₃</span>
    </button>
  );
};
