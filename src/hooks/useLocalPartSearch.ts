import { useCallback, useState } from "react";

// Re-using your existing interface structure
export interface LocalSearchConfig {
  serverFilters: {
    field: string;
    op: string;
    value: string;
  }[];
  clientFilterField?: string;
  clientFilterValues?: string[];
}

type PartData = {
  id: number;
  Name: string;
  [key: string]: any;
};

export function useLocalPartSearch({
  config,
  searchName,
  targetCount = 100,
}: {
  config: LocalSearchConfig;
  searchName: string;
  targetCount?: number;
}) {
  const [results, setResults] = useState<PartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const runFetch = useCallback(
    async (mode: "fresh" | "more") => {
      setLoading(true);
      setError("");
      
      const currentOffset = mode === "fresh" ? 0 : offset;

      try {
        const response = await fetch(`http://127.0.0.1:3000/api/parts/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: searchName,
            limit: targetCount,
            offset: currentOffset,
            config: config // Send the full config to the server
          })
        });
        
        if (!response.ok) throw new Error('Failed to fetch from local server');
        
        const data = await response.json();

        if (mode === "fresh") {
          setResults(data);
          setOffset(data.length);
        } else {
          setResults((prev) => [...prev, ...data]);
          setOffset((prev) => prev + data.length);
        }

        setHasMore(data.length === targetCount);

      } catch (err: any) {
        console.error("Local search error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [config, searchName, targetCount, offset]
  );

  const search = useCallback(() => runFetch("fresh"), [runFetch]);
  const loadMore = useCallback(() => runFetch("more"), [runFetch]);

  return {
    results,
    loading,
    error,
    hasMore,
    search,
    loadMore,
  };
}