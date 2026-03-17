// ============================================================
// 判断資産（ナレッジ）管理システム - コンテキスト
// ============================================================

import { createContext, useContext, useState, type ReactNode } from "react";
import { useKnowledge, type KnowledgeEntry, type Tag } from "@/hooks/useKnowledge";

interface User {
  id: number;
  email: string;
  role: string;
}

interface KnowledgeContextValue {
  entries: KnowledgeEntry[];
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  addEntry: (data: any) => Promise<KnowledgeEntry>;
  updateEntry: (id: number, data: any) => Promise<KnowledgeEntry>;
  deleteEntry: (id: number) => Promise<void>;
  getEntry: (id: number) => KnowledgeEntry | undefined;
  getTagsByCategory: (category: string) => Tag[];
  totalCount: number;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

const KnowledgeContext = createContext<KnowledgeContextValue | null>(null);

export function KnowledgeProvider({ children }: { children: ReactNode }) {
  const knowledge = useKnowledge();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  return (
    <KnowledgeContext.Provider value={{ ...knowledge, editingId, setEditingId, currentUser, setCurrentUser }}>
      {children}
    </KnowledgeContext.Provider>
  );
}

export function useKnowledgeContext() {
  const ctx = useContext(KnowledgeContext);
  if (!ctx) throw new Error("useKnowledgeContext must be used within KnowledgeProvider");
  return ctx;
}
