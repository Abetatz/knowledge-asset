// ============================================================
// 入力フォームページ
// ============================================================

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AllTagSelector } from "@/components/TagSelector";
import { useKnowledgeContext } from "@/contexts/KnowledgeContext";
import type { FieldTag, PhaseTag, RiskTag } from "@/lib/types";

type FormValues = {
  title: string;
  phenomenon: string;
  background: string;
  judgment: string;
  judgment_reason: string;
  alternative_options: string;
  future_verification: string;
  additional_1: string;
  additional_2: string;
  additional_3: string;
  additional_4: string;
};

const INITIAL_VALUES: FormValues = {
  title: "",
  phenomenon: "",
  background: "",
  judgment: "",
  judgment_reason: "",
  alternative_options: "",
  future_verification: "",
  additional_1: "",
  additional_2: "",
  additional_3: "",
  additional_4: "",
};

export function EntryForm() {
  const [, navigate] = useLocation();
  const { editingId, setEditingId, getEntry, addEntry, updateEntry, tags } = useKnowledgeContext();
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [fieldTags, setFieldTags] = useState<FieldTag[]>([]);
  const [phaseTags, setPhaseTags] = useState<PhaseTag[]>([]);
  const [riskTags, setRiskTags] = useState<RiskTag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);

  // 編集モード: エントリを読み込む
  useEffect(() => {
    if (editingId) {
      const entryId = parseInt(editingId);
      const entry = getEntry(entryId);
      if (entry) {
        setValues({
          title: entry.title,
          phenomenon: entry.phenomenon,
          background: entry.background,
          judgment: entry.judgment,
          judgment_reason: entry.judgment_reason,
          alternative_options: entry.alternative_options,
          future_verification: entry.future_verification,
          additional_1: entry.additional_1,
          additional_2: entry.additional_2,
          additional_3: entry.additional_3,
          additional_4: entry.additional_4,
        });

        // タグを抽出
        const fieldTagsFromEntry: FieldTag[] = [];
        const phaseTagsFromEntry: PhaseTag[] = [];
        const riskTagsFromEntry: RiskTag[] = [];

        if (Array.isArray(entry.tags)) {
          entry.tags.forEach((tag) => {
            if (tag.category === "field") fieldTagsFromEntry.push(tag.name as FieldTag);
            else if (tag.category === "phase") phaseTagsFromEntry.push(tag.name as PhaseTag);
            else if (tag.category === "risk") riskTagsFromEntry.push(tag.name as RiskTag);
          });
        }

        setFieldTags(fieldTagsFromEntry);
        setPhaseTags(phaseTagsFromEntry);
        setRiskTags(riskTagsFromEntry);

        if (entry.additional_1 || entry.additional_2 || entry.additional_3 || entry.additional_4) {
          setShowAdditional(true);
        }
      }
    }
  }, [editingId, getEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (!values.title.trim() || !values.phenomenon.trim() || !values.background.trim() ||
        !values.judgment.trim() || !values.judgment_reason.trim()) {
      toast.error("必須項目を入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      // タグ ID を取得
      const allTagIds: number[] = [];
      
      // タグ名から ID に変換
      fieldTags.forEach((tagName) => {
        const tag = tags.find((t) => t.name === tagName && t.category === "field");
        if (tag) allTagIds.push(tag.id);
      });
      
      phaseTags.forEach((tagName) => {
        const tag = tags.find((t) => t.name === tagName && t.category === "phase");
        if (tag) allTagIds.push(tag.id);
      });
      
      riskTags.forEach((tagName) => {
        const tag = tags.find((t) => t.name === tagName && t.category === "risk");
        if (tag) allTagIds.push(tag.id);
      });

      const data = {
        title: values.title,
        phenomenon: values.phenomenon,
        background: values.background,
        judgment: values.judgment,
        judgment_reason: values.judgment_reason,
        alternative_options: values.alternative_options,
        future_verification: values.future_verification,
        additional_1: values.additional_1,
        additional_2: values.additional_2,
        additional_3: values.additional_3,
        additional_4: values.additional_4,
        tags: allTagIds,
      };

      if (editingId) {
        await updateEntry(parseInt(editingId), data);
        toast.success("判断資産を更新しました");
        setEditingId(null);
      } else {
        await addEntry(data);
        toast.success("判断資産を保存しました");
      }

      // リセット
      setValues(INITIAL_VALUES);
      setFieldTags([]);
      setPhaseTags([]);
      setRiskTags([]);
      setShowAdditional(false);
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to save entry:", error);
      toast.error("保存に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              {editingId ? "判断資産を編集" : "新規判断資産を作成"}
            </h1>
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 hover:bg-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* タイトル */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              タイトル *
            </label>
            <input
              type="text"
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
              placeholder="判断資産の要約"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 事象 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              1. 事象 *
            </label>
            <textarea
              value={values.phenomenon}
              onChange={(e) => setValues({ ...values, phenomenon: e.target.value })}
              placeholder="何が起きたか"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 背景 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              2. 背景 *
            </label>
            <textarea
              value={values.background}
              onChange={(e) => setValues({ ...values, background: e.target.value })}
              placeholder="背景・文脈"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 判断 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              3. 判断 *
            </label>
            <textarea
              value={values.judgment}
              onChange={(e) => setValues({ ...values, judgment: e.target.value })}
              placeholder="どのような判断を下したか"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 判断理由 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              4. 判断理由 *
            </label>
            <textarea
              value={values.judgment_reason}
              onChange={(e) => setValues({ ...values, judgment_reason: e.target.value })}
              placeholder="判断の理由"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 代替案 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              5. 代替案
            </label>
            <textarea
              value={values.alternative_options}
              onChange={(e) => setValues({ ...values, alternative_options: e.target.value })}
              placeholder="検討した代替案"
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 後日検証 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              6. 後日検証
            </label>
            <textarea
              value={values.future_verification}
              onChange={(e) => setValues({ ...values, future_verification: e.target.value })}
              placeholder="後日検証する内容"
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* タグセレクター */}
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <AllTagSelector
              selectedField={fieldTags}
              onFieldChange={setFieldTags}
              selectedPhase={phaseTags}
              onPhaseChange={setPhaseTags}
              selectedRisk={riskTags}
              onRiskChange={setRiskTags}
            />
          </div>

          {/* 追加項目 */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdditional(!showAdditional)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {showAdditional ? "追加項目を非表示" : "追加項目を表示"}
            </button>
          </div>

          {showAdditional && (
            <div className="space-y-4 bg-slate-100 p-4 rounded-lg">
              {/* 結果・成果 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  7. 結果・成果
                </label>
                <textarea
                  value={values.additional_1}
                  onChange={(e) => setValues({ ...values, additional_1: e.target.value })}
                  placeholder="判断の結果"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 学び・教訓 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  8. 学び・教訓
                </label>
                <textarea
                  value={values.additional_2}
                  onChange={(e) => setValues({ ...values, additional_2: e.target.value })}
                  placeholder="得た学び"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 次のアクション */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  9. 次のアクション
                </label>
                <textarea
                  value={values.additional_3}
                  onChange={(e) => setValues({ ...values, additional_3: e.target.value })}
                  placeholder="次のアクション"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 関連事例 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  10. 関連事例
                </label>
                <textarea
                  value={values.additional_4}
                  onChange={(e) => setValues({ ...values, additional_4: e.target.value })}
                  placeholder="関連事例"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* ボタン */}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "保存中..." : "保存する"}
            </Button>
            <Button
              type="button"
              onClick={handleCancel}
              variant="outline"
              className="flex-1"
            >
              キャンセル
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
