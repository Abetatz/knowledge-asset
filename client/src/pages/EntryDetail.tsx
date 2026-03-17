// ============================================================
// 判断資産詳細表示ページ
// ============================================================

import { useLocation } from "wouter";
import { ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKnowledgeContext } from "@/contexts/KnowledgeContext";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export function EntryDetail() {
  const [, navigate] = useLocation();
  const { entries, deleteEntry, setEditingId } = useKnowledgeContext();
  const [entryId, setEntryId] = useState<number | null>(null);

  // URL パラメータから ID を取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setEntryId(parseInt(id, 10));
    }
  }, []);

  if (entryId === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">エントリーが見つかりません</p>
      </div>
    );
  }

  const entry = entries.find((e) => e.id === entryId);

  if (!entry) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">エントリーが見つかりません</p>
      </div>
    );
  }

  const handleEdit = () => {
    setEditingId(entryId.toString());
    navigate("/form");
  };

  const handleDelete = async () => {
    if (window.confirm("このエントリーを削除してもよろしいですか？")) {
      try {
        await deleteEntry(entryId);
        toast.success("判断資産を削除しました");
        navigate("/dashboard");
      } catch (error) {
        toast.error("削除に失敗しました");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              戻る
            </button>
            <div className="flex gap-2">
              <Button
                onClick={handleEdit}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                編集
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                削除
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-slate-200 p-8">
          {/* タイトル */}
          <h1 className="text-3xl font-bold text-slate-900 mb-4">{entry.title}</h1>

          {/* タグ */}
          <div className="flex flex-wrap gap-2 mb-6">
            {entry.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-block px-3 py-1 rounded text-sm font-medium"
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
          <p className="text-sm text-slate-500 mb-8">
            作成日時：{new Date(entry.created_at).toLocaleDateString("ja-JP")}
            {entry.updated_at !== entry.created_at && (
              <>
                <br />
                更新日時：{new Date(entry.updated_at).toLocaleDateString("ja-JP")}
              </>
            )}
          </p>

          {/* フィールド */}
          <div className="space-y-6">
            {/* 現象 */}
            {entry.phenomenon && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">現象</h2>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {entry.phenomenon}
                </p>
              </div>
            )}

            {/* 背景 */}
            {entry.background && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">背景</h2>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {entry.background}
                </p>
              </div>
            )}

            {/* 判断 */}
            {entry.judgment && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">判断</h2>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {entry.judgment}
                </p>
              </div>
            )}

            {/* 判断理由 */}
            {entry.judgment_reason && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  判断理由
                </h2>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {entry.judgment_reason}
                </p>
              </div>
            )}

            {/* 代替案 */}
            {entry.alternative_options && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  代替案
                </h2>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {entry.alternative_options}
                </p>
              </div>
            )}

            {/* 今後の検証 */}
            {entry.future_verification && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  今後の検証
                </h2>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {entry.future_verification}
                </p>
              </div>
            )}

            {/* 追加情報 */}
            {(entry.additional_1 ||
              entry.additional_2 ||
              entry.additional_3 ||
              entry.additional_4) && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  追加情報
                </h2>
                <div className="space-y-4">
                  {entry.additional_1 && (
                    <div>
                      <h3 className="font-semibold text-slate-700 mb-1">
                        追加情報 1
                      </h3>
                      <p className="text-slate-700 whitespace-pre-wrap">
                        {entry.additional_1}
                      </p>
                    </div>
                  )}
                  {entry.additional_2 && (
                    <div>
                      <h3 className="font-semibold text-slate-700 mb-1">
                        追加情報 2
                      </h3>
                      <p className="text-slate-700 whitespace-pre-wrap">
                        {entry.additional_2}
                      </p>
                    </div>
                  )}
                  {entry.additional_3 && (
                    <div>
                      <h3 className="font-semibold text-slate-700 mb-1">
                        追加情報 3
                      </h3>
                      <p className="text-slate-700 whitespace-pre-wrap">
                        {entry.additional_3}
                      </p>
                    </div>
                  )}
                  {entry.additional_4 && (
                    <div>
                      <h3 className="font-semibold text-slate-700 mb-1">
                        追加情報 4
                      </h3>
                      <p className="text-slate-700 whitespace-pre-wrap">
                        {entry.additional_4}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
