// ============================================================
// ナレッジカードコンポーネント
// Design: Left border accent + tag badges + expandable content
// ============================================================

import { useState } from "react";
import { ChevronDown, ChevronUp, Edit2, Trash2, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TagGroup } from "@/components/TagBadge";
import type { KnowledgeEntry, FieldTag } from "@/lib/types";
import { CARD_BORDER_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface KnowledgeCardProps {
  entry: KnowledgeEntry;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const SECTION_LABELS: { key: keyof KnowledgeEntry; label: string; color: string }[] = [
  { key: "phenomenon",      label: "事象",     color: "text-indigo-700" },
  { key: "background",      label: "背景",     color: "text-slate-600" },
  { key: "decision",        label: "判断",     color: "text-teal-700" },
  { key: "decisionReason",  label: "判断理由", color: "text-teal-600" },
  { key: "alternatives",    label: "代替案",   color: "text-amber-700" },
  { key: "laterVerification",label: "後日検証", color: "text-purple-700" },
  { key: "outcome",         label: "結果・成果", color: "text-green-700" },
  { key: "learnings",       label: "学び・教訓", color: "text-blue-700" },
  { key: "nextAction",      label: "次のアクション", color: "text-orange-700" },
  { key: "relatedCases",    label: "関連事例", color: "text-rose-700" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export function KnowledgeCard({ entry, onEdit, onDelete }: KnowledgeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const borderColor =
    entry.fieldTags.length > 0
      ? CARD_BORDER_COLORS[entry.fieldTags[0] as FieldTag]
      : "border-l-slate-400";

  const previewSections = SECTION_LABELS.slice(0, 4);
  const extraSections = SECTION_LABELS.slice(4).filter(
    (s) => entry[s.key] && String(entry[s.key]).trim()
  );

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 border-l-4 shadow-sm",
        "hover:shadow-md transition-all duration-200",
        borderColor
      )}
    >
      {/* カードヘッダー */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900 leading-snug flex-1">
            {entry.title || "（タイトルなし）"}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
              onClick={() => onEdit(entry.id)}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                  onClick={() => onDelete(entry.id)}
                >
                  削除
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-slate-500"
                  onClick={() => setConfirmDelete(false)}
                >
                  取消
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* 日時 */}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(entry.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(entry.createdAt)}
          </span>
          {entry.updatedAt !== entry.createdAt && (
            <span className="text-slate-300">（更新: {formatDate(entry.updatedAt)}）</span>
          )}
        </div>

        {/* タグ */}
        <div className="mt-3">
          <TagGroup
            fieldTags={entry.fieldTags}
            phaseTags={entry.phaseTags}
            riskTags={entry.riskTags}
            size="sm"
          />
        </div>
      </div>

      {/* 事象プレビュー（常時表示） */}
      <div className="px-5 pb-3 border-t border-slate-50">
        <div className="pt-3 space-y-2">
          {previewSections.slice(0, 2).map((s) => {
            const val = String(entry[s.key] || "").trim();
            if (!val) return null;
            return (
              <div key={s.key}>
                <span className={cn("text-xs font-bold mr-2", s.color)}>{s.label}</span>
                <span className="text-sm text-slate-700 line-clamp-2">{val}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 展開コンテンツ */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-slate-100 space-y-3 pt-3">
          {previewSections.slice(2).map((s) => {
            const val = String(entry[s.key] || "").trim();
            if (!val) return null;
            return (
              <div key={s.key}>
                <span className={cn("text-xs font-bold block mb-0.5", s.color)}>{s.label}</span>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{val}</p>
              </div>
            );
          })}
          {extraSections.map((s) => {
            const val = String(entry[s.key] || "").trim();
            return (
              <div key={s.key}>
                <span className={cn("text-xs font-bold block mb-0.5", s.color)}>{s.label}</span>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{val}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* 展開ボタン */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-2.5 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors border-t border-slate-100 rounded-b-xl"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" />
            閉じる
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" />
            詳細を見る
          </>
        )}
      </button>
    </div>
  );
}
