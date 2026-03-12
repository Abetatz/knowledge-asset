import { KnowledgeEntry } from "./types";

/**
 * CSV エクスポート機能
 * LocalStorage に保存された判断資産データを CSV ファイルとしてエクスポート
 */

export function exportToCSV(knowledgeItems: KnowledgeEntry[]): void {
  // CSV ヘッダー
  const headers = [
    "ID",
    "タイトル",
    "事象",
    "背景",
    "判断",
    "判断理由",
    "代替案",
    "後日検証",
    "追加情報1",
    "追加情報2",
    "追加情報3",
    "追加情報4",
    "分野タグ",
    "フェーズタグ",
    "リスクタグ",
    "作成日時",
    "更新日時",
  ];

  // CSV 行を生成
  const rows = knowledgeItems.map((item) => [
    item.id,
    escapeCSV(item.title),
    escapeCSV(item.phenomenon),
    escapeCSV(item.background),
    escapeCSV(item.decision),
    escapeCSV(item.decisionReason),
    escapeCSV(item.alternatives),
    escapeCSV(item.laterVerification),
    escapeCSV(item.outcome || ""),
    escapeCSV(item.learnings || ""),
    escapeCSV(item.nextAction || ""),
    escapeCSV(item.relatedCases || ""),
    item.fieldTags.join("; "),
    item.phaseTags.join("; "),
    item.riskTags.join("; "),
    new Date(item.createdAt).toLocaleString("ja-JP"),
    new Date(item.updatedAt).toLocaleString("ja-JP"),
  ]);

  // CSV コンテンツを生成
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // BOM を追加（Excel で日本語が正しく表示されるように）
  const bom = "\uFEFF";
  const csvWithBom = bom + csvContent;

  // ファイルをダウンロード
  const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `knowledge-assets-${timestamp}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * CSV 内の特殊文字をエスケープ
 * ダブルクォートと改行を処理
 */
function escapeCSV(value: string): string {
  if (!value) return '""';

  // ダブルクォート、カンマ、改行を含む場合はダブルクォートで囲む
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return `"${value}"`;
}
