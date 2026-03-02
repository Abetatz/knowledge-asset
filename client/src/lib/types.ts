// ============================================================
// 判断資産（ナレッジ）管理システム - 型定義
// Design: Field Command / War Room Aesthetic
// Colors: Indigo (#312E81) + Coral (#EF4444) + Teal (#0D9488)
// ============================================================

export type FieldTag =
  | "コーチ"
  | "S&C"
  | "メディカル"
  | "マネジメント"
  | "アナリスト"
  | "選手";

export type PhaseTag =
  | "プレシーズン"
  | "インシーズン"
  | "ケガからの復帰"
  | "移籍"
  | "試合週";

export type RiskTag =
  | "戦術"
  | "再発"
  | "契約"
  | "心理"
  | "成長";

export type AllTag = FieldTag | PhaseTag | RiskTag;

export interface KnowledgeEntry {
  id: string;
  // 必須入力項目
  phenomenon: string;       // 1. 事象
  background: string;       // 2. 背景
  decision: string;         // 3. 判断
  decisionReason: string;   // 4. 判断理由
  alternatives: string;     // 5. 代替案
  laterVerification: string; // 6. 後日検証
  // 追加項目 +4
  outcome: string;          // 7. 結果・成果
  learnings: string;        // 8. 学び・教訓
  nextAction: string;       // 9. 次のアクション
  relatedCases: string;     // 10. 関連事例
  // タグ
  fieldTags: FieldTag[];
  phaseTags: PhaseTag[];
  riskTags: RiskTag[];
  // メタ
  createdAt: string;
  updatedAt: string;
  title: string;            // タイトル（事象の要約）
}

export const FIELD_TAGS: FieldTag[] = [
  "コーチ", "S&C", "メディカル", "マネジメント", "アナリスト", "選手"
];

export const PHASE_TAGS: PhaseTag[] = [
  "プレシーズン", "インシーズン", "ケガからの復帰", "移籍", "試合週"
];

export const RISK_TAGS: RiskTag[] = [
  "戦術", "再発", "契約", "心理", "成長"
];

// タグカテゴリの色定義
export const FIELD_TAG_COLORS: Record<FieldTag, { bg: string; text: string; border: string }> = {
  "コーチ":     { bg: "bg-indigo-600",  text: "text-white", border: "border-indigo-600" },
  "S&C":        { bg: "bg-violet-600",  text: "text-white", border: "border-violet-600" },
  "メディカル": { bg: "bg-teal-600",    text: "text-white", border: "border-teal-600" },
  "マネジメント":{ bg: "bg-blue-700",   text: "text-white", border: "border-blue-700" },
  "アナリスト": { bg: "bg-cyan-700",    text: "text-white", border: "border-cyan-700" },
  "選手":       { bg: "bg-emerald-600", text: "text-white", border: "border-emerald-600" },
};

export const PHASE_TAG_COLORS: Record<PhaseTag, { bg: string; text: string; border: string }> = {
  "プレシーズン":    { bg: "bg-amber-500",  text: "text-white", border: "border-amber-500" },
  "インシーズン":    { bg: "bg-orange-500", text: "text-white", border: "border-orange-500" },
  "ケガからの復帰":  { bg: "bg-rose-500",   text: "text-white", border: "border-rose-500" },
  "移籍":           { bg: "bg-purple-600",  text: "text-white", border: "border-purple-600" },
  "試合週":         { bg: "bg-red-600",     text: "text-white", border: "border-red-600" },
};

export const RISK_TAG_COLORS: Record<RiskTag, { bg: string; text: string; border: string }> = {
  "戦術": { bg: "bg-slate-700",  text: "text-white", border: "border-slate-700" },
  "再発": { bg: "bg-red-700",    text: "text-white", border: "border-red-700" },
  "契約": { bg: "bg-zinc-700",   text: "text-white", border: "border-zinc-700" },
  "心理": { bg: "bg-pink-600",   text: "text-white", border: "border-pink-600" },
  "成長": { bg: "bg-green-700",  text: "text-white", border: "border-green-700" },
};

// カードのボーダーカラー（最初の分野タグに基づく）
export const CARD_BORDER_COLORS: Record<FieldTag, string> = {
  "コーチ":     "border-l-indigo-600",
  "S&C":        "border-l-violet-600",
  "メディカル": "border-l-teal-600",
  "マネジメント":"border-l-blue-700",
  "アナリスト": "border-l-cyan-700",
  "選手":       "border-l-emerald-600",
};

export type SortOrder = "newest" | "oldest";

export interface FilterState {
  keyword: string;
  fieldTags: FieldTag[];
  phaseTags: PhaseTag[];
  riskTags: RiskTag[];
  sortOrder: SortOrder;
}
