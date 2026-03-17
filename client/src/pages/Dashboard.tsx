// ============================================================
// ダッシュボードページ
// ============================================================

import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Edit2, Trash2, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AllTagSelector } from "@/components/TagSelector";
import { useKnowledgeContext } from "@/contexts/KnowledgeContext";
import type { FieldTag, PhaseTag, RiskTag } from "@/lib/types";
import { FIELD_TAGS, PHASE_TAGS, RISK_TAGS } from "@/lib/types";
import { entriesAPI } from "@/lib/api";

interface FilterState {
  fieldTags: FieldTag[];
  phaseTag: PhaseTag[];
  riskTags: RiskTag[];
  searchQuery: string;
}

const INITIAL_FILTER: FilterState = {
  fieldTags: [],
  phaseTag: [],
  riskTags: [],
  searchQuery: "",
};

export function Dashboard() {
  const [, navigate] = useLocation();
  const { entries, deleteEntry, setEditingId } = useKnowledgeContext();
  const [filter, setFilter] = useState<FilterState>(INITIAL_FILTER);

  // フィルタリング
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // タグでフィルタリング
      if (filter.fieldTags.length > 0) {
        const entryFieldTags = entry.tags
          .filter((t) => t.category === "field")
          .map((t) => t.name as FieldTag);
        if (!filter.fieldTags.some((tag) => entryFieldTags.includes(tag))) {
          return false;
        }
      }

      if (filter.phaseTag.length > 0) {
        const entryPhaseTags = entry.tags
          .filter((t) => t.category === "phase")
          .map((t) => t.name as PhaseTag);
        if (!filter.phaseTag.some((tag) => entryPhaseTags.includes(tag))) {
          return false;
        }
      }

      if (filter.riskTags.length > 0) {
        const entryRiskTags = entry.tags
          .filter((t) => t.category === "risk")
          .map((t) => t.name as RiskTag);
        if (!filter.riskTags.some((tag) => entryRiskTags.includes(tag))) {
          return false;
        }
      }

      // 検索クエリでフィルタリング
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        return (
          entry.title.toLowerCase().includes(query) ||
          entry.phenomenon.toLowerCase().includes(query) ||
          entry.background.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [entries, filter]);

  // 統計データ
  const stats = useMemo(() => {
    const allTags = entries.flatMap((e) => e.tags.map((t) => t.name));
    const uniqueTags = new Set(allTags).size;
    const thisMonth = entries.filter((e) => {
      const d = new Date(e.created_at);
      const now = new Date();
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;
    return { uniqueTags, thisMonth };
  }, [entries]);

  const handleEdit = (id: number) => {
    setEditingId(id.toString());
    navigate("/form");
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteEntry(id);
      toast.success("判断資産を削除しました");
    } catch (error) {
      toast.error("削除に失敗しました");
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await entriesAPI.exportCSV();
      const url = window.URL.createObjectURL(response.data as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `knowledge-asset-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("CSV をダウンロードしました");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("エクスポートに失敗しました");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-slate-900">判断資産</h1>
            <div className="flex gap-2">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                エクスポート
              </Button>
              <Button
                onClick={() => {
                  setEditingId(null);
                  navigate("/form");
                }}
                className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新規作成
              </Button>
            </div>
          </div>

          {/* 統計 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-sm text-slate-600">判断資産数</div>
              <div className="text-2xl font-bold text-indigo-600">
                {entries.length}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-slate-600">使用タグ種類</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.uniqueTags}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-slate-600">今月の記録</div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.thisMonth}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* 検索 */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="キーワードで検索"
              value={filter.searchQuery}
              onChange={(e) =>
                setFilter({ ...filter, searchQuery: e.target.value })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* タグフィルター */}
          <AllTagSelector
            selectedField={filter.fieldTags}
            onFieldChange={(tags) => setFilter({ ...filter, fieldTags: tags })}
            selectedPhase={filter.phaseTag}
            onPhaseChange={(tags) => setFilter({ ...filter, phaseTag: tags })}
            selectedRisk={filter.riskTags}
            onRiskChange={(tags) => setFilter({ ...filter, riskTags: tags })}
          />

          {/* フィルタークリア */}
          {(filter.fieldTags.length > 0 ||
            filter.phaseTag.length > 0 ||
            filter.riskTags.length > 0 ||
            filter.searchQuery) && (
            <button
              onClick={() => setFilter(INITIAL_FILTER)}
              className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              フィルターをクリア
            </button>
          )}
        </div>
      </div>

      {/* エントリリスト */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">判断資産がありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow"
              >
                {/* タイトル */}
                <h3 className="font-bold text-slate-900 mb-2 line-clamp-2">
                  {entry.title}
                </h3>

                {/* タグ */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-block px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: tag.color + "20",
                        color: tag.color,
                        border: `1px solid ${tag.color}`,
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>

                {/* 日時 */}
                <p className="text-xs text-slate-500 mb-3">
                  {new Date(entry.created_at).toLocaleDateString("ja-JP")}
                </p>

                {/* 説明 */}
                <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                  {entry.phenomenon}
                </p>

                {/* ボタン */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(entry.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    編集
                  </Button>
                  <Button
                    onClick={() => handleDelete(entry.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    削除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
