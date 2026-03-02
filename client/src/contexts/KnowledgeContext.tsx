// ============================================================
// 判断資産（ナレッジ）管理システム - コンテキスト
// ============================================================

import { createContext, useContext, useState, type ReactNode } from "react";
import { useKnowledge, type KnowledgeFormData } from "@/hooks/useKnowledge";
import type { KnowledgeEntry, FilterState } from "@/lib/types";

interface KnowledgeContextValue {
  entries: KnowledgeEntry[];
  totalCount: number;
  addEntry: (data: KnowledgeFormData) => KnowledgeEntry;
  updateEntry: (id: string, data: Partial<KnowledgeFormData>) => void;
  deleteEntry: (id: string) => void;
  getEntry: (id: string) => KnowledgeEntry | undefined;
  filterEntries: (filter: FilterState) => KnowledgeEntry[];
  // 編集中のエントリID
  editingId: string | null;
  setEditingId: (id: string | null) => void;
}

const KnowledgeContext = createContext<KnowledgeContextValue | null>(null);

export function KnowledgeProvider({ children }: { children: ReactNode }) {
  const knowledge = useKnowledge();
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <KnowledgeContext.Provider value={{ ...knowledge, editingId, setEditingId }}>
      {children}
    </KnowledgeContext.Provider>
  );
}

export function useKnowledgeContext() {
  const ctx = useContext(KnowledgeContext);
  if (!ctx) throw new Error("useKnowledgeContext must be used within KnowledgeProvider");
  return ctx;
}
