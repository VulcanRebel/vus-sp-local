import { useCallback, useRef, useState } from "react";
import {
  collection,
  query,
  getDocs,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type WhereFilterOp,
  type Firestore,
} from "firebase/firestore";

type ServerFilter = { field: string; op: WhereFilterOp; value: string };

export interface SearchConfig {
  serverFilters: ServerFilter[];
  clientFilterField?: string;
  clientFilterValues?: string[];
}

type ClientFilterFn = (doc: DocumentData) => boolean;

function buildClientFilter(config: SearchConfig, searchName: string): ClientFilterFn {
  const lowerSearchName = searchName.trim().toLowerCase();
  const clientKeywords = config.clientFilterValues?.map((k) => k.toLowerCase());
  const clientField = config.clientFilterField;

  return (data: DocumentData) => {
    // Free-text input filter (applies to Name)
    const docNameLower = String(data.Name ?? "").toLowerCase();
    const matchesSearchName = !lowerSearchName || docNameLower.includes(lowerSearchName);

    // Config-driven keyword filter
    let matchesDropdownKeywords = true;
    if (clientKeywords && clientKeywords.length > 0 && clientField) {
      const dataToSearchLower = String(data[clientField] ?? "").toLowerCase();
      matchesDropdownKeywords = clientKeywords.some((kw) => dataToSearchLower.includes(kw));
    }

    return matchesSearchName && matchesDropdownKeywords;
  };
}

function buildServerConstraints(config: SearchConfig): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  // Server filters
  config.serverFilters.forEach((f) => constraints.push(where(f.field, f.op, f.value)));

  // OrderBy must match any range filter field (>=, <=, etc.)
  const rangeFilter = config.serverFilters.find((f) => f.op === ">=" || f.op === ">" || f.op === "<=" || f.op === "<");
  if (rangeFilter) constraints.push(orderBy(rangeFilter.field));
  else constraints.push(orderBy("Name"));

  return constraints;
}

type UseProgressivePartSearchArgs = {
  db: Firestore;
  config: SearchConfig;
  searchName: string;
  /**
   * How many filtered results you want to show per "page" in the UI.
   * (This is independent from serverChunkSize)
   */
  targetCount?: number;
  /**
   * How many docs to fetch from Firestore per request.
   * Keep your existing PAGE_SIZE (100) if you want.
   */
  serverChunkSize?: number;
  /**
   * Safety cap to avoid runaway reads if filter is extremely selective.
   */
  maxServerPagesPerRequest?: number;
};

export function useProgressivePartSearch({
  db,
  config,
  searchName,
  targetCount = 100,
  serverChunkSize = 100,
  maxServerPagesPerRequest = 10,
}: UseProgressivePartSearchArgs) {
  const [results, setResults] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Tracks the Firestore pagination cursor across calls
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  // Tracks whether Firestore has more docs for the underlying server query
  const serverHasMoreRef = useRef<boolean>(true);

  const runFetch = useCallback(
    async (mode: "fresh" | "more") => {
      setLoading(true);
      setError("");

      try {
        if (mode === "fresh") {
          setResults([]);
          lastDocRef.current = null;
          serverHasMoreRef.current = true;
        }

        const clientFilter = buildClientFilter(config, searchName);
        const baseConstraints = buildServerConstraints(config);

        let accumulated: DocumentData[] = [];
        let pagesFetched = 0;

        // We keep pulling Firestore pages until we have enough *filtered* docs
        // or there are no more server docs.
        while (
          accumulated.length < targetCount &&
          serverHasMoreRef.current &&
          pagesFetched < maxServerPagesPerRequest
        ) {
          const constraints: QueryConstraint[] = [...baseConstraints, limit(serverChunkSize)];

          if (lastDocRef.current) constraints.push(startAfter(lastDocRef.current));

          const q = query(collection(db, "parts"), ...constraints);
          const snapshot = await getDocs(q);

          // Update cursor + whether server has more
          lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] ?? lastDocRef.current;
          serverHasMoreRef.current = snapshot.size === serverChunkSize;

          // Apply client filtering to this chunk
          for (const d of snapshot.docs) {
            const data = d.data();
            if (clientFilter(data)) accumulated.push(data);
            if (accumulated.length >= targetCount) break;
          }

          pagesFetched += 1;

          // If snapshot is empty, stop regardless
          if (snapshot.size === 0) {
            serverHasMoreRef.current = false;
            break;
          }
        }

        setResults((prev) => (mode === "more" ? [...prev, ...accumulated] : accumulated));
      } catch (err: any) {
        console.error("Progressive search error:", err);
        if (err?.code === "failed-precondition") {
          setError("A database index is required for this query. Check the console for the index creation link.");
        } else {
          setError(err?.message || "Error occurred during search.");
        }
      } finally {
        setLoading(false);
      }
    },
    [db, config, searchName, targetCount, serverChunkSize, maxServerPagesPerRequest]
  );

  const search = useCallback(() => runFetch("fresh"), [runFetch]);
  const loadMore = useCallback(() => runFetch("more"), [runFetch]);

  return {
    results,
    loading,
    error,
    // If server has more docs, we *might* have more filtered docs too.
    // (We can’t know without fetching because filtering is client-side.)
    hasMore: serverHasMoreRef.current,
    search,
    loadMore,
  };
}

