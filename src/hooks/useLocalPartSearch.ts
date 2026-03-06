import { useState, useCallback } from 'react';

export interface LocalSearchConfig {
  serverFilters: {
    field: string;
    op: string;
    value: string | number;
  }[];
  clientFilterField?: string;
  clientFilterValues?: string[];
}

export function useLocalPartSearch({
  config,
  searchName,
  targetCount = 100,
}: {
  config: LocalSearchConfig;
  searchName: string;
  targetCount?: number;
}) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const runFetch = useCallback(
    async (mode: 'fresh' | 'more') => {
      setLoading(true);
      setError('');
      
      const currentOffset = mode === 'fresh' ? 0 : offset;

      try {
        // import.meta.env.DEV is true on your office PC, false on Vercel
        const API_URL = import.meta.env.DEV 
          ? 'http://127.0.0.1:3000/api/parts/search' 
          : '/api/parts/search';
          
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: searchName,
            config: {
              ...config,
              clientFilterField: config.clientFilterField,
              clientFilterValues: config.clientFilterValues
            },
            limit: targetCount,
            offset: currentOffset,
          }),
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const data = await response.json();
        const items = Array.isArray(data) ? data : (data.items || []);
        
        if (mode === 'fresh') {
          setResults(items);
          setOffset(items.length);
        } else {
          setResults((prev) => [...prev, ...items]);
          setOffset((prev) => prev + items.length);
        }

        setHasMore(items.length === targetCount);
      } catch (err: any) {
        setError(err.message || 'An error occurred during the search.');
        console.error('Search Hook Error:', err);
      } finally {
        setLoading(false);
      }
    },
    [config, searchName, targetCount, offset]
  );

  const search = useCallback(() => runFetch('fresh'), [runFetch]);
  const loadMore = useCallback(() => runFetch('more'), [runFetch]);

  return {
    results,
    loading,
    error,
    hasMore,
    search,
    loadMore,
  };
}