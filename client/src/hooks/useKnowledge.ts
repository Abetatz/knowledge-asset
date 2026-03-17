// ============================================================
// 判断資産（ナレッジ）管理システム - API フック
// シンプルで堅牢な実装
// ============================================================

import { useState, useEffect } from "react";
import { entriesAPI, tagsAPI } from "@/lib/api";

export interface KnowledgeEntry {
  id: number;
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
  tags: Array<{ id: number; name: string; category: string; color: string }>;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  category: string;
  color: string;
}

export function useKnowledge() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初期化: API からデータを取得
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // エントリとタグを並行取得
        const [entriesRes, tagsRes] = await Promise.all([
          entriesAPI.getAll(),
          tagsAPI.getAll(),
        ]);

        setEntries(entriesRes.data);
        setTags(tagsRes.data);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("データの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // エントリを追加
  const addEntry = async (data: {
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
    tags: number[];
  }) => {
    try {
      const response = await entriesAPI.create(data as any);
      const newEntry = response.data;

      // 状態を更新
      setEntries((prev) => [newEntry, ...prev]);
      return newEntry;
    } catch (err) {
      console.error("Failed to add entry:", err);
      throw err;
    }
  };

  // エントリを更新
  const updateEntry = async (
    id: number,
    data: {
      title?: string;
      phenomenon?: string;
      background?: string;
      judgment?: string;
      judgment_reason?: string;
      alternative_options?: string;
      future_verification?: string;
      additional_1?: string;
      additional_2?: string;
      additional_3?: string;
      additional_4?: string;
      tags?: number[];
    }
  ) => {
    try {
      const response = await entriesAPI.update(id, data as any);
      const updatedEntry = response.data;

      // 状態を更新
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? updatedEntry : e))
      );
      return updatedEntry;
    } catch (err) {
      console.error("Failed to update entry:", err);
      throw err;
    }
  };

  // エントリを削除
  const deleteEntry = async (id: number) => {
    try {
      await entriesAPI.delete(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Failed to delete entry:", err);
      throw err;
    }
  };

  // エントリを取得
  const getEntry = (id: number) => {
    return entries.find((e) => e.id === id);
  };

  // タグを取得（カテゴリ別）
  const getTagsByCategory = (category: string) => {
    return tags.filter((t) => t.category === category);
  };

  return {
    entries,
    tags,
    isLoading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    getTagsByCategory,
    totalCount: entries.length,
  };
}
