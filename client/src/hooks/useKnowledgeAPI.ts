import { useState, useCallback, useEffect } from "react";
import { entriesAPI, tagsAPI, CreateEntryRequest, KnowledgeEntry as APIEntry, Tag } from "@/lib/api";
import { toast } from "sonner";

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
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface FilterState {
  searchQuery: string;
  selectedTags: number[];
}

export type KnowledgeFormData = Omit<KnowledgeEntry, "id" | "created_at" | "updated_at">;

export function useKnowledgeAPI() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await entriesAPI.getAll();
      setEntries(response.data as KnowledgeEntry[]);
    } catch (error) {
      console.error("Failed to fetch entries:", error);
      toast.error("エントリの読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch tags
  const fetchTags = useCallback(async () => {
    try {
      const response = await tagsAPI.getAll();
      setTags(response.data);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchEntries();
    fetchTags();
  }, [fetchEntries, fetchTags]);

  const addEntry = useCallback(
    async (data: Omit<KnowledgeFormData, "tags"> & { tags: number[] }): Promise<KnowledgeEntry | null> => {
      try {
        const response = await entriesAPI.create(data as CreateEntryRequest);
        const newEntry = response.data as KnowledgeEntry;
        setEntries((prev) => [newEntry, ...prev]);
        toast.success("エントリを作成しました");
        return newEntry;
      } catch (error) {
        console.error("Failed to create entry:", error);
        toast.error("エントリの作成に失敗しました");
        return null;
      }
    },
    []
  );

  const updateEntry = useCallback(
    async (id: number, data: Partial<KnowledgeFormData> & { tags?: number[] }): Promise<boolean> => {
      try {
        const response = await entriesAPI.update(id, data as any);
        const updatedEntry = response.data as KnowledgeEntry;
        setEntries((prev) =>
          prev.map((entry) => (entry.id === id ? updatedEntry : entry))
        );
        toast.success("エントリを更新しました");
        return true;
      } catch (error) {
        console.error("Failed to update entry:", error);
        toast.error("エントリの更新に失敗しました");
        return false;
      }
    },
    []
  );

  const deleteEntry = useCallback(async (id: number): Promise<boolean> => {
    try {
      await entriesAPI.delete(id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      toast.success("エントリを削除しました");
      return true;
    } catch (error) {
      console.error("Failed to delete entry:", error);
      toast.error("エントリの削除に失敗しました");
      return false;
    }
  }, []);

  const getEntry = useCallback(
    (id: number): KnowledgeEntry | undefined => {
      return entries.find((entry) => entry.id === id);
    },
    [entries]
  );

  const filterEntries = useCallback(
    (filter: FilterState): KnowledgeEntry[] => {
      return entries.filter((entry) => {
        // Search query filter
        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          const matchesSearch =
            entry.title.toLowerCase().includes(query) ||
            entry.phenomenon.toLowerCase().includes(query) ||
            entry.background.toLowerCase().includes(query) ||
            entry.judgment.toLowerCase().includes(query);
          if (!matchesSearch) return false;
        }

        // Tags filter
        if (filter.selectedTags.length > 0) {
          const entryTagIds = entry.tags.map((t) => t.id);
          const matchesTags = filter.selectedTags.some((tagId) =>
            entryTagIds.includes(tagId)
          );
          if (!matchesTags) return false;
        }

        return true;
      });
    },
    [entries]
  );

  return {
    entries,
    tags,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    filterEntries,
    fetchEntries,
    fetchTags,
  };
}
