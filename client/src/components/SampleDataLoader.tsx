// ============================================================
// サンプルデータローダー（初回起動時のみ）
// ============================================================

import { useEffect } from "react";
import { SAMPLE_ENTRIES } from "@/lib/sampleData";

const STORAGE_KEY = "knowledge_asset_entries";
const SAMPLE_LOADED_KEY = "knowledge_asset_sample_loaded";

export function SampleDataLoader() {
  useEffect(() => {
    // サンプルデータが未ロードかつエントリが空の場合のみ投入
    const alreadyLoaded = localStorage.getItem(SAMPLE_LOADED_KEY);
    const existing = localStorage.getItem(STORAGE_KEY);
    
    if (!alreadyLoaded && (!existing || JSON.parse(existing).length === 0)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_ENTRIES));
      localStorage.setItem(SAMPLE_LOADED_KEY, "true");
      // ページリロードして状態を反映
      window.location.reload();
    }
  }, []);

  return null;
}
