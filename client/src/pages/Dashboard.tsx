// ============================================================
// ダッシュボードページ
// Design: Field Command / War Room Aesthetic
// - Stats widgets at top
// - Sticky search bar + tag filter panel
// - Card grid with animated filter transitions
// - Quick tag filter chips
// ============================================================

import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Search,
  SlidersHorizontal,
  X,
  Plus,
  ArrowUpDown,
  LayoutGrid,
  List,
  BookOpen,
  TrendingUp,
  Tag,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnowledgeCard } from "@/components/KnowledgeCard";
import { TagBadge } from "@/components/TagBadge";
import { useKnowledgeContext } from "@/contexts/KnowledgeContext";
import { entriesAPI } from "@/lib/api";
import type { FieldTag, PhaseTag, RiskTag, FilterState } from "@/lib/types";
import {
  FIELD_TAGS,
  PHASE_TAGS,
  RISK_TAGS,
  FIELD_TAG_COLORS,
  PHASE_TAG_COLORS,
  RISK_TAG_COLORS,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const INITIAL_FILTER: FilterState = {
  keyword: "",
  fieldTags: [],
  phaseTags: [],
  riskTags: [],
  sortOrder: "newest",
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 font-mono leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { filterEntries, deleteEntry, setEditingId, totalCount, entries } =
    useKnowledgeContext();

  const [filter, setFilter] = useState<FilterState>(INITIAL_FILTER);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredEntries = useMemo(
    () => filterEntries(filter),
    [filterEntries, filter]
  );

  const hasActiveFilter =
    filter.keyword.trim() !== "" ||
    filter.fieldTags.length > 0 ||
    filter.phaseTags.length > 0 ||
    filter.riskTags.length > 0;

  // 統計データ
  const stats = useMemo(() => {
    const allTags = entries.flatMap((e) => [
      ...e.fieldTags,
      ...e.phaseTags,
      ...e.riskTags,
    ]);
    const uniqueTags = new Set(allTags).size;
    const thisMonth = entries.filter((e) => {
      const d = new Date(e.createdAt);
      const now = new Date();
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;
    return { uniqueTags, thisMonth };
  }, [entries]);

  const toggleFieldTag = useCallback((tag: FieldTag) => {
    setFilter((prev) => ({
      ...prev,
      fieldTags: prev.fieldTags.includes(tag)
        ? prev.fieldTags.filter((t) => t !== tag)
        : [...prev.fieldTags, tag],
    }));
  }, []);

  const togglePhaseTag = useCallback((tag: PhaseTag) => {
    setFilter((prev) => ({
      ...prev,
      phaseTags: prev.phaseTags.includes(tag)
        ? prev.phaseTags.filter((t) => t !== tag)
        : [...prev.phaseTags, tag],
    }));
  }, []);

  const toggleRiskTag = useCallback((tag: RiskTag) => {
    setFilter((prev) => ({
      ...prev,
      riskTags: prev.riskTags.includes(tag)
        ? prev.riskTags.filter((t) => t !== tag)
        : [...prev.riskTags, tag],
    }));
  }, []);

  const clearFilter = () => setFilter(INITIAL_FILTER);

  const handleEdit = (id: string) => {
    setEditingId(id);
    navigate("/form");
  };

  const handleDelete = (id: string) => {
    deleteEntry(id);
    toast.success("判断資産を削除しました");
  };

  const toggleSort = () => {
    setFilter((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "newest" ? "oldest" : "newest",
    }));
  };

  const handleExportCSV = async () => {
    try {
      const response = await entriesAPI.exportCSV();
      const url = window.URL.createObjectURL(response.data as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `knowledge-asset-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("CSV をダウンロードしました");
    } catch (error) {
      console.error("CSV export error:", error);
      toast.error("CSV のダウンロードに失敗しました");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 検索バー（スティッキー） */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* 検索入力 */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={filter.keyword}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, keyword: e.target.value }))
                }
                placeholder="キーワードで検索（事象・判断・背景など全文検索）"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {filter.keyword && (
                <button
                  onClick={() =>
                    setFilter((prev) => ({ ...prev, keyword: "" }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={cn(
                "gap-1.5 shrink-0",
                showFilterPanel &&
                  "bg-indigo-50 border-indigo-300 text-indigo-700"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">タグフィルター</span>
              {filter.fieldTags.length +
                filter.phaseTags.length +
                filter.riskTags.length >
                0 && (
                <span className="bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {filter.fieldTags.length +
                    filter.phaseTags.length +
                    filter.riskTags.length}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSort}
              className="gap-1.5 shrink-0"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">
                {filter.sortOrder === "newest" ? "新しい順" : "古い順"}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={totalCount === 0}
              className="gap-1.5 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">エクスポート</span>
            </Button>
          </div>

          {/* タグフィルターパネル */}
          {showFilterPanel && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  分野タグ
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {FIELD_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleFieldTag(tag)}
                      className={cn(
                        "inline-flex items-center rounded px-2.5 py-1 text-xs font-medium transition-all duration-150 border",
                        filter.fieldTags.includes(tag)
                          ? `${FIELD_TAG_COLORS[tag].bg} ${FIELD_TAG_COLORS[tag].text} border-transparent`
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  フェーズタグ
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PHASE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => togglePhaseTag(tag)}
                      className={cn(
                        "inline-flex items-center rounded px-2.5 py-1 text-xs font-medium transition-all duration-150 border",
                        filter.phaseTags.includes(tag)
                          ? `${PHASE_TAG_COLORS[tag].bg} ${PHASE_TAG_COLORS[tag].text} border-transparent`
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  リスクタグ
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {RISK_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleRiskTag(tag)}
                      className={cn(
                        "inline-flex items-center rounded px-2.5 py-1 text-xs font-medium transition-all duration-150 border",
                        filter.riskTags.includes(tag)
                          ? `${RISK_TAG_COLORS[tag].bg} ${RISK_TAG_COLORS[tag].text} border-transparent`
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              {hasActiveFilter && (
                <button
                  onClick={clearFilter}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  フィルターをリセット
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-6xl mx-auto px-4 py-5">
        {/* 統計ウィジェット（データがある場合のみ） */}
        {totalCount > 0 && !hasActiveFilter && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <StatCard
              label="総判断資産数"
              value={totalCount}
              icon={BookOpen}
              color="bg-indigo-700"
            />
            <StatCard
              label="使用タグ種類"
              value={stats.uniqueTags}
              icon={Tag}
              color="bg-teal-600"
            />
            <StatCard
              label="今月の記録"
              value={stats.thisMonth}
              icon={TrendingUp}
              color="bg-amber-500"
            />
          </div>
        )}

        {/* ステータスバー */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-600">
              {hasActiveFilter ? (
                <>
                  <span className="font-bold text-indigo-700">
                    {filteredEntries.length}
                  </span>
                  <span className="text-slate-400"> / {totalCount} 件</span>
                </>
              ) : (
                <>
                  <span className="font-bold text-slate-800">{totalCount}</span>
                  <span className="text-slate-500"> 件の判断資産</span>
                </>
              )}
            </p>
            {hasActiveFilter && (
              <button
                onClick={clearFilter}
                className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                クリア
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* アクティブフィルターバッジ */}
            <div className="hidden sm:flex flex-wrap gap-1">
              {filter.fieldTags.map((tag) => (
                <TagBadge
                  key={`active-field-${tag}`}
                  tag={tag}
                  type="field"
                  size="sm"
                  onClick={() => toggleFieldTag(tag)}
                />
              ))}
              {filter.phaseTags.map((tag) => (
                <TagBadge
                  key={`active-phase-${tag}`}
                  tag={tag}
                  type="phase"
                  size="sm"
                  onClick={() => togglePhaseTag(tag)}
                />
              ))}
              {filter.riskTags.map((tag) => (
                <TagBadge
                  key={`active-risk-${tag}`}
                  tag={tag}
                  type="risk"
                  size="sm"
                  onClick={() => toggleRiskTag(tag)}
                />
              ))}
            </div>
            {/* ビュー切替 */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 transition-colors",
                  viewMode === "grid"
                    ? "bg-indigo-700 text-white"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 transition-colors",
                  viewMode === "list"
                    ? "bg-indigo-700 text-white"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* カード一覧 */}
        {filteredEntries.length === 0 ? (
          <EmptyState
            hasFilter={hasActiveFilter}
            onClear={clearFilter}
            onNew={() => navigate("/form")}
          />
        ) : (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                : "space-y-3"
            )}
          >
            {filteredEntries.map((entry) => (
              <KnowledgeCard
                key={entry.id}
                entry={entry}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB（モバイル用新規追加ボタン） */}
      <button
        onClick={() => navigate("/form")}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 w-14 h-14 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-20"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

function EmptyState({
  hasFilter,
  onClear,
  onNew,
}: {
  hasFilter: boolean;
  onClear: () => void;
  onNew: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-indigo-300" />
      </div>
      {hasFilter ? (
        <>
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            該当する判断資産が見つかりません
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            検索条件を変更するか、フィルターをリセットしてください
          </p>
          <Button
            variant="outline"
            onClick={onClear}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            フィルターをリセット
          </Button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            まだ判断資産が記録されていません
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            現場での判断・意思決定を記録して、チームの知見を蓄積しましょう
          </p>
          <Button
            onClick={onNew}
            className="gap-2 bg-indigo-700 hover:bg-indigo-800 text-white"
          >
            <Plus className="w-4 h-4" />
            最初の判断資産を記録する
          </Button>
        </>
      )}
    </div>
  );
}
