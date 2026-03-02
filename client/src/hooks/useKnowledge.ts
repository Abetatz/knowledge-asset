// ============================================================
// 判断資産（ナレッジ）管理システム - LocalStorage フック
// ============================================================

import { useState, useCallback, useEffect } from "react";
import { nanoid } from "nanoid";
import type { KnowledgeEntry, FilterState } from "@/lib/types";

const STORAGE_KEY = "knowledge_asset_entries";

function loadFromStorage(): KnowledgeEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as KnowledgeEntry[];
  } catch {
    return [];
  }
}

function saveToStorage(entries: KnowledgeEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export type KnowledgeFormData = Omit<KnowledgeEntry, "id" | "createdAt" | "updatedAt">;

export function useKnowledge() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>(() => loadFromStorage());

  // 別タブ・ウィンドウからの変更を同期
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setEntries(loadFromStorage());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const addEntry = useCallback((data: KnowledgeFormData): KnowledgeEntry => {
    const now = new Date().toISOString();
    const entry: KnowledgeEntry = {
      ...data,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
    };
    setEntries((prev) => {
      const next = [entry, ...prev];
      saveToStorage(next);
      return next;
    });
    return entry;
  }, []);

  const updateEntry = useCallback((id: string, data: Partial<KnowledgeFormData>): void => {
    setEntries((prev) => {
      const next = prev.map((e) =>
        e.id === id
          ? { ...e, ...data, updatedAt: new Date().toISOString() }
          : e
      );
      saveToStorage(next);
      return next;
    });
  }, []);

  const deleteEntry = useCallback((id: string): void => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  const getEntry = useCallback(
    (id: string): KnowledgeEntry | undefined => entries.find((e) => e.id === id),
    [entries]
  );

  const filterEntries = useCallback(
    (filter: FilterState): KnowledgeEntry[] => {
      let result = [...entries];

      // キーワード検索
      if (filter.keyword.trim()) {
        const kw = filter.keyword.trim().toLowerCase();
        result = result.filter((e) =>
          [
            e.title,
            e.phenomenon,
            e.background,
            e.decision,
            e.decisionReason,
            e.alternatives,
            e.laterVerification,
            e.outcome,
            e.learnings,
            e.nextAction,
            e.relatedCases,
          ]
            .join(" ")
            .toLowerCase()
            .includes(kw)
        );
      }

      // 分野タグフィルター
      if (filter.fieldTags.length > 0) {
        result = result.filter((e) =>
          filter.fieldTags.some((t) => e.fieldTags.includes(t))
        );
      }

      // フェーズタグフィルター
      if (filter.phaseTags.length > 0) {
        result = result.filter((e) =>
          filter.phaseTags.some((t) => e.phaseTags.includes(t))
        );
      }

      // リスクタグフィルター
      if (filter.riskTags.length > 0) {
        result = result.filter((e) =>
          filter.riskTags.some((t) => e.riskTags.includes(t))
        );
      }

      // ソート
      result.sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return filter.sortOrder === "newest" ? bTime - aTime : aTime - bTime;
      });

      return result;
    },
    [entries]
  );

  return {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    filterEntries,
    totalCount: entries.length,
  };
}
