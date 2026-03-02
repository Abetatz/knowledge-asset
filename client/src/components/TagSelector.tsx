// ============================================================
// タグ選択コンポーネント（フォーム用）
// Design: Toggle-style tag selection with visual feedback
// ============================================================

import { cn } from "@/lib/utils";
import type { FieldTag, PhaseTag, RiskTag } from "@/lib/types";
import {
  FIELD_TAGS,
  PHASE_TAGS,
  RISK_TAGS,
  FIELD_TAG_COLORS,
  PHASE_TAG_COLORS,
  RISK_TAG_COLORS,
} from "@/lib/types";

interface TagSelectorProps<T extends string> {
  label: string;
  tags: T[];
  selected: T[];
  onChange: (selected: T[]) => void;
  colorMap: Record<string, { bg: string; text: string; border: string }>;
  description?: string;
}

function TagSelectorBase<T extends string>({
  label,
  tags,
  selected,
  onChange,
  colorMap,
  description,
}: TagSelectorProps<T>) {
  const toggle = (tag: T) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selected.includes(tag);
          const colors = colorMap[tag];
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={cn(
                "inline-flex items-center rounded px-3 py-1.5 text-sm font-medium transition-all duration-150",
                "border-2",
                isSelected
                  ? `${colors.bg} ${colors.text} ${colors.border} shadow-sm scale-105`
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700"
              )}
            >
              {isSelected && (
                <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface AllTagSelectorProps {
  selectedField: FieldTag[];
  selectedPhase: PhaseTag[];
  selectedRisk: RiskTag[];
  onFieldChange: (tags: FieldTag[]) => void;
  onPhaseChange: (tags: PhaseTag[]) => void;
  onRiskChange: (tags: RiskTag[]) => void;
}

export function AllTagSelector({
  selectedField,
  selectedPhase,
  selectedRisk,
  onFieldChange,
  onPhaseChange,
  onRiskChange,
}: AllTagSelectorProps) {
  return (
    <div className="space-y-5">
      <TagSelectorBase
        label="分野タグ"
        tags={FIELD_TAGS}
        selected={selectedField}
        onChange={onFieldChange}
        colorMap={FIELD_TAG_COLORS}
        description="関連するスタッフ・部門を選択"
      />
      <TagSelectorBase
        label="フェーズタグ"
        tags={PHASE_TAGS}
        selected={selectedPhase}
        onChange={onPhaseChange}
        colorMap={PHASE_TAG_COLORS}
        description="発生したシーズンフェーズを選択"
      />
      <TagSelectorBase
        label="リスクタグ"
        tags={RISK_TAGS}
        selected={selectedRisk}
        onChange={onRiskChange}
        colorMap={RISK_TAG_COLORS}
        description="関連するリスク・課題カテゴリを選択"
      />
    </div>
  );
}
