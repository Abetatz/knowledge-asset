// ============================================================
// 入力フォームページ
// Design: Field Command / War Room Aesthetic
// - Single column scroll form, mobile-first
// - Section dividers with numbered steps
// - Auto-resize textareas
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Save, X, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AllTagSelector } from "@/components/TagSelector";
import { useKnowledgeContext } from "@/contexts/KnowledgeContext";
import type { FieldTag, PhaseTag, RiskTag } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FormField {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  hint?: string;
}

const MAIN_FIELDS: FormField[] = [
  {
    key: "phenomenon",
    label: "1. 事象",
    placeholder: "何が起きたか、具体的な状況を記述してください",
    required: true,
    hint: "5W1Hを意識して記述すると後で検索しやすくなります",
  },
  {
    key: "background",
    label: "2. 背景",
    placeholder: "その事象が起きた背景・文脈・前提条件を記述してください",
    required: true,
    hint: "チームの状況、選手のコンディション、外部環境など",
  },
  {
    key: "decision",
    label: "3. 判断",
    placeholder: "最終的にどのような判断・決定を下したかを記述してください",
    required: true,
  },
  {
    key: "decisionReason",
    label: "4. 判断理由",
    placeholder: "なぜその判断を下したのか、根拠・理由を記述してください",
    required: true,
    hint: "データ、経験則、専門知識など判断の根拠を明記",
  },
  {
    key: "alternatives",
    label: "5. 代替案",
    placeholder: "検討したが採用しなかった代替案を記述してください",
    required: false,
    hint: "なぜ採用しなかったかの理由も合わせて記述",
  },
  {
    key: "laterVerification",
    label: "6. 後日検証",
    placeholder: "後日この判断を検証した結果・振り返りを記述してください",
    required: false,
    hint: "判断が正しかったか、改善点はあるかなど",
  },
];

const ADDITIONAL_FIELDS: FormField[] = [
  {
    key: "outcome",
    label: "7. 結果・成果",
    placeholder: "この判断の結果として何が起きたか、成果を記述してください",
    required: false,
  },
  {
    key: "learnings",
    label: "8. 学び・教訓",
    placeholder: "この経験から得た学び・教訓を記述してください",
    required: false,
    hint: "次回同様の状況が発生した際に活かせる知見",
  },
  {
    key: "nextAction",
    label: "9. 次のアクション",
    placeholder: "この判断を踏まえた今後のアクション・対応策を記述してください",
    required: false,
  },
  {
    key: "relatedCases",
    label: "10. 関連事例",
    placeholder: "類似する過去の事例や参考になる事例を記述してください",
    required: false,
  },
];

type FormValues = {
  title: string;
  phenomenon: string;
  background: string;
  decision: string;
  decisionReason: string;
  alternatives: string;
  laterVerification: string;
  outcome: string;
  learnings: string;
  nextAction: string;
  relatedCases: string;
};

const INITIAL_VALUES: FormValues = {
  title: "",
  phenomenon: "",
  background: "",
  decision: "",
  decisionReason: "",
  alternatives: "",
  laterVerification: "",
  outcome: "",
  learnings: "",
  nextAction: "",
  relatedCases: "",
};

function AutoTextarea({
  value,
  onChange,
  placeholder,
  required,
  minRows = 3,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  minRows?: number;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      rows={minRows}
      className={cn(
        "w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3",
        "text-sm text-slate-800 placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
        "transition-all duration-150",
        "min-h-[80px]",
        className
      )}
    />
  );
}

export default function EntryForm() {
  const [, navigate] = useLocation();
  const { addEntry, getEntry, updateEntry, editingId, setEditingId } = useKnowledgeContext();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [fieldTags, setFieldTags] = useState<FieldTag[]>([]);
  const [phaseTags, setPhaseTags] = useState<PhaseTag[]>([]);
  const [riskTags, setRiskTags] = useState<RiskTag[]>([]);
  const [showAdditional, setShowAdditional] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 編集モードの初期化
  useEffect(() => {
    if (editingId) {
      const entry = getEntry(editingId);
      if (entry) {
        setValues({
          title: entry.title,
          phenomenon: entry.phenomenon,
          background: entry.background,
          decision: entry.decision,
          decisionReason: entry.decisionReason,
          alternatives: entry.alternatives,
          laterVerification: entry.laterVerification,
          outcome: entry.outcome,
          learnings: entry.learnings,
          nextAction: entry.nextAction,
          relatedCases: entry.relatedCases,
        });
        setFieldTags(entry.fieldTags);
        setPhaseTags(entry.phaseTags);
        setRiskTags(entry.riskTags);
        if (entry.outcome || entry.learnings || entry.nextAction || entry.relatedCases) {
          setShowAdditional(true);
        }
      }
    }
  }, [editingId, getEntry]);

  const set = (key: keyof FormValues) => (val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormValues, string>> = {};
    if (!values.title.trim()) newErrors.title = "タイトルは必須です";
    if (!values.phenomenon.trim()) newErrors.phenomenon = "事象は必須です";
    if (!values.background.trim()) newErrors.background = "背景は必須です";
    if (!values.decision.trim()) newErrors.decision = "判断は必須です";
    if (!values.decisionReason.trim()) newErrors.decisionReason = "判断理由は必須です";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("必須項目を入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        ...values,
        fieldTags,
        phaseTags,
        riskTags,
      } as any;

      if (editingId) {
        await updateEntry(editingId, data);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ページヘッダー */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {editingId ? "判断資産を編集" : "判断資産を記録"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              現場での判断・意思決定を記録・蓄積します
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="gap-1.5"
            >
              <X className="w-4 h-4" />
              キャンセル
            </Button>
            <Button
              type="submit"
              form="entry-form"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white"
            >
              <Save className="w-4 h-4" />
              {editingId ? "更新する" : "保存する"}
            </Button>
          </div>
        </div>
      </div>

      <form id="entry-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* タイトル */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <label className="block text-sm font-bold text-slate-800 mb-2">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={values.title}
            onChange={(e) => set("title")(e.target.value)}
            placeholder="この判断の要約タイトルを入力（例：主力選手の試合直前負傷対応）"
            className={cn(
              "w-full rounded-lg border px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all",
              errors.title ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"
            )}
          />
          {errors.title && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.title}
            </p>
          )}
        </div>

        {/* タグ選択 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-700 text-white text-xs flex items-center justify-center font-bold">T</span>
            タグ設定
          </h2>
          <AllTagSelector
            selectedField={fieldTags}
            selectedPhase={phaseTags}
            selectedRisk={riskTags}
            onFieldChange={setFieldTags}
            onPhaseChange={setPhaseTags}
            onRiskChange={setRiskTags}
          />
        </div>

        {/* メイン入力フィールド */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-700 text-white text-xs flex items-center justify-center font-bold">1</span>
              基本記録項目
              <span className="ml-auto text-xs text-slate-400 font-normal">※ 1〜4は必須</span>
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {MAIN_FIELDS.map((field) => (
              <div key={field.key} className="px-5 py-4">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.hint && (
                  <p className="text-xs text-slate-400 mb-2">{field.hint}</p>
                )}
                <AutoTextarea
                  value={values[field.key as keyof FormValues]}
                  onChange={set(field.key as keyof FormValues)}
                  placeholder={field.placeholder}
                  required={field.required}
                />
                {errors[field.key as keyof FormValues] && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors[field.key as keyof FormValues]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 追加項目（折りたたみ） */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdditional(!showAdditional)}
            className="w-full px-5 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              追加記録項目
              <span className="ml-2 text-xs text-slate-400 font-normal">（任意）</span>
            </h2>
            {showAdditional ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {showAdditional && (
            <div className="divide-y divide-slate-100">
              {ADDITIONAL_FIELDS.map((field) => (
                <div key={field.key} className="px-5 py-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {field.label}
                  </label>
                  {field.hint && (
                    <p className="text-xs text-slate-400 mb-2">{field.hint}</p>
                  )}
                  <AutoTextarea
                    value={values[field.key as keyof FormValues]}
                    onChange={set(field.key as keyof FormValues)}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 送信ボタン（下部） */}
        <div className="flex gap-3 pb-8">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleCancel}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-indigo-700 hover:bg-indigo-800 text-white gap-2"
          >
            <Save className="w-4 h-4" />
            {editingId ? "更新する" : "判断資産を保存する"}
          </Button>
        </div>
      </form>
    </div>
  );
}
