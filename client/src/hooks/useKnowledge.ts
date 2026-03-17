// ============================================================
// 判断資産（ナレッジ）管理システム - API フック
// ============================================================

import { useState, useCallback, useEffect } from "react";
import { entriesAPI } from "@/lib/api";
import type { KnowledgeEntry, FilterState, FieldTag, PhaseTag, RiskTag } from "@/lib/types";

export type KnowledgeFormData = Omit<KnowledgeEntry, "id" | "created_at" | "updated_at">;

export function useKnowledge() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化時に API からデータを取得
  useEffect(() => {
    const loadEntries = async () => {
      try {
        setIsLoading(true);
        const response = await entriesAPI.getAll();
        // API レスポンスのデータをフロントエンド型に変換
        const convertedEntries = response.data.map((entry: any) => {
          const fieldTags: FieldTag[] = [];
          const phaseTags: PhaseTag[] = [];
          const riskTags: RiskTag[] = [];

          if (Array.isArray(entry.tags) && entry.tags.length > 0) {
            entry.tags.forEach((tag: any) => {
              if (tag && tag.name) {
                if (tag.category === "field") fieldTags.push(tag.name as FieldTag);
                else if (tag.category === "phase") phaseTags.push(tag.name as PhaseTag);
                else if (tag.category === "risk") riskTags.push(tag.name as RiskTag);
              }
            });
          }

          return {
            id: entry.id.toString(),
            title: entry.title,
            phenomenon: entry.phenomenon,
            background: entry.background,
            decision: entry.judgment,
            decisionReason: entry.judgment_reason,
            alternatives: entry.alternative_options,
            laterVerification: entry.future_verification,
            outcome: entry.additional_1 || "",
            learnings: entry.additional_2 || "",
            nextAction: entry.additional_3 || "",
            relatedCases: entry.additional_4 || "",
            fieldTags,
            phaseTags,
            riskTags,
            createdAt: entry.created_at,
            updatedAt: entry.updated_at,
          } as KnowledgeEntry;
        });
        setEntries(convertedEntries);
      } catch (error) {
        console.error("Failed to load entries:", error);
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, []);

  const addEntry = useCallback(async (data: KnowledgeFormData): Promise<KnowledgeEntry | null> => {
    try {
      const allTags = [...data.fieldTags, ...data.phaseTags, ...data.riskTags];
      const payload = {
        title: data.title,
        phenomenon: data.phenomenon,
        background: data.background,
        judgment: data.decision,
        judgment_reason: data.decisionReason,
        alternative_options: data.alternatives,
        future_verification: data.laterVerification,
        additional_1: data.outcome || "",
        additional_2: data.learnings || "",
        additional_3: data.nextAction || "",
        additional_4: data.relatedCases || "",
        tags: allTags,
      };

      const response = await entriesAPI.create(payload as any);
      const newEntry = response.data;

      // 新しいエントリを状態に追加
      const convertedEntry: KnowledgeEntry = {
        id: newEntry.id.toString(),
        title: newEntry.title,
        phenomenon: newEntry.phenomenon,
        background: newEntry.background,
        decision: newEntry.judgment,
        decisionReason: newEntry.judgment_reason,
        alternatives: newEntry.alternative_options,
        laterVerification: newEntry.future_verification,
        outcome: newEntry.additional_1 || "",
        learnings: newEntry.additional_2 || "",
        nextAction: newEntry.additional_3 || "",
        relatedCases: newEntry.additional_4 || "",
        fieldTags: data.fieldTags,
        phaseTags: data.phaseTags,
        riskTags: data.riskTags,
        createdAt: newEntry.created_at,
        updatedAt: newEntry.updated_at,
      };

      setEntries((prev) => [convertedEntry, ...prev]);
      return convertedEntry;
    } catch (error) {
      console.error("Failed to add entry:", error);
      return null;
    }
  }, []);

  const updateEntry = useCallback(async (id: string, data: Partial<KnowledgeFormData>): Promise<void> => {
    try {
      const allTags = [
        ...(data.fieldTags || []),
        ...(data.phaseTags || []),
        ...(data.riskTags || []),
      ];

      const payload = {
        title: data.title,
        phenomenon: data.phenomenon,
        background: data.background,
        judgment: data.decision,
        judgment_reason: data.decisionReason,
        alternative_options: data.alternatives,
        future_verification: data.laterVerification,
        additional_1: data.outcome || "",
        additional_2: data.learnings || "",
        additional_3: data.nextAction || "",
        additional_4: data.relatedCases || "",
        tags: allTags,
      };

      await entriesAPI.update(parseInt(id), payload as any);

      // 状態を更新
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                ...data,
                updatedAt: new Date().toISOString(),
              }
            : e
        )
      );
    } catch (error) {
      console.error("Failed to update entry:", error);
    }
  }, []);

  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    try {
      await entriesAPI.delete(parseInt(id));
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
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
    isLoading,
  };
}
