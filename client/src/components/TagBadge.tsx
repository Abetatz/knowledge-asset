// ============================================================
// タグバッジコンポーネント
// Design: Solid color badges with white text
// ============================================================

import { cn } from "@/lib/utils";
import type { FieldTag, PhaseTag, RiskTag } from "@/lib/types";
import {
  FIELD_TAG_COLORS,
  PHASE_TAG_COLORS,
  RISK_TAG_COLORS,
} from "@/lib/types";

type TagType = "field" | "phase" | "risk";

interface TagBadgeProps {
  tag: FieldTag | PhaseTag | RiskTag;
  type: TagType;
  size?: "sm" | "md";
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

export function TagBadge({
  tag,
  type,
  size = "sm",
  onClick,
  active,
  className,
}: TagBadgeProps) {
  const colors =
    type === "field"
      ? FIELD_TAG_COLORS[tag as FieldTag]
      : type === "phase"
      ? PHASE_TAG_COLORS[tag as PhaseTag]
      : RISK_TAG_COLORS[tag as RiskTag];

  const isClickable = !!onClick;

  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded font-medium transition-all duration-150",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        colors.bg,
        colors.text,
        isClickable && "cursor-pointer hover:opacity-80 hover:scale-105",
        active === false && "opacity-40",
        className
      )}
    >
      {tag}
    </span>
  );
}

interface TagGroupProps {
  fieldTags: FieldTag[];
  phaseTags: PhaseTag[];
  riskTags: RiskTag[];
  size?: "sm" | "md";
  onTagClick?: (tag: string, type: TagType) => void;
  activeFieldTags?: FieldTag[];
  activePhaseTags?: PhaseTag[];
  activeRiskTags?: RiskTag[];
}

export function TagGroup({
  fieldTags,
  phaseTags,
  riskTags,
  size = "sm",
  onTagClick,
  activeFieldTags,
  activePhaseTags,
  activeRiskTags,
}: TagGroupProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {fieldTags.map((tag) => (
        <TagBadge
          key={`field-${tag}`}
          tag={tag}
          type="field"
          size={size}
          onClick={onTagClick ? () => onTagClick(tag, "field") : undefined}
          active={activeFieldTags ? activeFieldTags.includes(tag) : undefined}
        />
      ))}
      {phaseTags.map((tag) => (
        <TagBadge
          key={`phase-${tag}`}
          tag={tag}
          type="phase"
          size={size}
          onClick={onTagClick ? () => onTagClick(tag, "phase") : undefined}
          active={activePhaseTags ? activePhaseTags.includes(tag) : undefined}
        />
      ))}
      {riskTags.map((tag) => (
        <TagBadge
          key={`risk-${tag}`}
          tag={tag}
          type="risk"
          size={size}
          onClick={onTagClick ? () => onTagClick(tag, "risk") : undefined}
          active={activeRiskTags ? activeRiskTags.includes(tag) : undefined}
        />
      ))}
    </div>
  );
}
