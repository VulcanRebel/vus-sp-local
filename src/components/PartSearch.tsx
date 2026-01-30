// src/components/PartSearch.tsx
import { useEffect, useState } from 'react';
import { useLocalPartSearch } from '../hooks/useLocalPartSearch';
import type { LocalSearchConfig } from '../hooks/useLocalPartSearch';

// --- STYLES ---
// Defined as constants to keep the JSX clean while maintaining the strict Swiss grid
const STYLES = {
    select: `
        w-full h-10 px-3
        bg-slate-950 border border-slate-700 
        text-slate-100 text-sm 
        focus:border-blue-600 focus:ring-0 
        transition-colors rounded-none appearance-none cursor-pointer 
        bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] 
        bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat
    `,
    input: `
        w-full h-10 px-3 
        bg-slate-950 border border-slate-700 
        text-slate-100 placeholder-slate-600 text-sm font-mono
        focus:border-blue-600 focus:ring-0 
        transition-colors rounded-none
    `,
    label: `
        block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1
    `,
    checkbox: `
        peer h-4 w-4 bg-slate-950 border border-slate-700 
        checked:bg-blue-600 checked:border-blue-600 
        focus:ring-0 transition-colors rounded-none cursor-pointer
    `,
    button: `
        w-full h-12 
        bg-blue-600 hover:bg-blue-500 
        text-white font-bold text-xs uppercase tracking-widest 
        transition-colors shadow-none rounded-none cursor-pointer
    `
};

// --- SEARCH CONFIG MAP ---
const SEARCH_CONFIG_MAP: Record<string, LocalSearchConfig> = {
  // --- Signs ---
  hdpe_sign: {
    serverFilters: [
      { field: 'Part Group', op: '==', value: 'Signs' },
      { field: 'Grade', op: '==', value: 'HDPE' },
    ],
    clientFilterField: 'Part Type',
    clientFilterValues: ['Small Signs', 'Large Signs'],
  },
  acm_sign: {
    serverFilters: [
      { field: 'Part Group', op: '==', value: 'Signs' },
      { field: 'Name', op: '>=', value: '3mm' },
      { field: 'Name', op: '<=', value: '3mm\uf8ff' },
    ],
    clientFilterField: 'Part Type',
    clientFilterValues: ['Small Signs', 'Large Signs'],
  },
  aluminum_sign: {
    serverFilters: [{ field: 'Part Group', op: '==', value: 'Signs' }],
  },
  corrugated: {
    serverFilters: [
      { field: 'Part Group', op: '==', value: 'Signs' },
      { field: 'Part Type', op: '==', value: 'Temporary Markings' },
    ],
    clientFilterField: 'Name',
    clientFilterValues: ['Coroplast'],
  },

  // --- Decals ---
  magnet: {
    serverFilters: [
      { field: 'Part Group', op: '==', value: 'Signs' },
      { field: 'Part Type', op: '==', value: 'Decal/Media' },
    ],
    clientFilterField: 'Name',
    clientFilterValues: ['magnet'],
  },
  opus_cut_decal: {
    serverFilters: [
      { field: 'Part Group', op: '==', value: 'Signs' },
      { field: 'Part Type', op: '==', value: 'Decal/Media' },
    ],
    clientFilterField: 'Name',
    clientFilterValues: ['opus', 'pmps'],
  },
  banner: {
    serverFilters: [
      { field: 'Part Group', op: '==', value: 'Signs' },
      { field: 'Part Type', op: '==', value: 'Decal/Media' },
    ],
    clientFilterField: 'Name',
    clientFilterValues: ['banner'],
  },
  digital_print: {
    serverFilters: [
      { field: 'Part Group', op: '==', value: 'Signs' },
      { field: 'Part Type', op: '==', value: 'Decal/Media' },
    ],
  },
  screenDecal: {
    serverFilters: [
      { field: 'Part Group', op: '==', value: 'Decals' },
      { field: 'Part Type', op: '==', value: 'Screen Decal' },
    ],
  },

  // --- Other Groups ---
  delta: { serverFilters: [{ field: 'Part Group', op: '==', value: 'Deltas' }] },
  bullet: { serverFilters: [{ field: 'Part Group', op: '==', value: 'Bullets' }] },
  drv: { serverFilters: [{ field: 'Part Group', op: '==', value: 'DRVs' }] },
};

type PartSearchProps = {
  prefillSearchTerm?: string;
  autoGenerateOn?: boolean;
  autoSelectedPartType?: string;
  searchTrigger?: number; // New prop
};

export default function PartSearch({ 
  prefillSearchTerm = '', 
  autoGenerateOn = false, 
  autoSelectedPartType = '',
  searchTrigger = 0 
}: PartSearchProps) {

  // --- SEARCH INPUTS ---
  const [searchName, setSearchName] = useState('');
  const [searchNameSuffix, setSearchNameSuffix] = useState('');
  
  // 1. Sync Part Type automatically when Auto-Generate is ON
  useEffect(() => {
    if (autoGenerateOn && autoSelectedPartType && SEARCH_CONFIG_MAP[autoSelectedPartType]) {
      setSearchType(autoSelectedPartType);
    }
  }, [autoGenerateOn, autoSelectedPartType]);

  // 2. Update Search Name Input (BUT DO NOT TRIGGER SEARCH)
  // This just keeps the input field in sync with the calculator
  useEffect(() => {
    if (!autoGenerateOn) return;
    setSearchName(`${prefillSearchTerm}${searchNameSuffix}`);
  }, [autoGenerateOn, prefillSearchTerm, searchNameSuffix]);

  // Reset suffix when auto-gen is disabled
  useEffect(() => {
    if (autoGenerateOn) return;
    setSearchNameSuffix('');
  }, [autoGenerateOn]);
  
  const [searchType, setSearchType] = useState('');
  const [uiError, setUiError] = useState('');

  // --- LOCAL SEARCH HOOK ---
  const selectedConfig = searchType ? SEARCH_CONFIG_MAP[searchType] : undefined;
  const hookConfig = selectedConfig ?? { serverFilters: [] };

  const {
    results,
    loading,
    error: searchError,
    hasMore,
    search,
    loadMore,
  } = useLocalPartSearch({
    config: hookConfig,
    searchName,
    targetCount: 100,
  });

  // --- TRIGGER SEARCH ONLY ON SIGNAL ---
  // This fixes "Search-As-You-Type" issue. 
  // We wait for the user to click "Calculate & Search" (which increments searchTrigger)
  useEffect(() => {
    if (autoGenerateOn && searchTrigger > 0) {
      // Ensure we have a valid config before searching
      if (searchType && SEARCH_CONFIG_MAP[searchType]) {
        // We call search(), which uses the *current* state of searchName and searchType
        search();
      }
    }
  }, [searchTrigger]); // Only depend on searchTrigger, not autoGenerateOn or searchType changes

  // --- ACTIONS ---
  const handleSearchClick = () => {
    setUiError('');

    if (!searchType) {
      setUiError('Please select a part type.');
      return;
    }

    if (!SEARCH_CONFIG_MAP[searchType]) {
      setUiError('No data available for this part type.');
      return;
    }

    search();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-4 mb-4 items-end">
        <div className="flex-1">
          <label className={STYLES.label}>Part Type:</label>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className={STYLES.select}
          >
            <option value="">-- Select Part Type --</option>
            {Object.keys(SEARCH_CONFIG_MAP).map((key) => (
              <option key={key} value={key}>
                {key.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-[2]">
          <label className={STYLES.label}>Part Name (Optional):</label>
          <input
            type="text"
            value={searchName}
            onChange={(e) => {
              const next = e.target.value;
        
              if (!autoGenerateOn) {
                setSearchName(next);
                return;
              }
        
              if (prefillSearchTerm && next.startsWith(prefillSearchTerm)) {
                setSearchNameSuffix(next.slice(prefillSearchTerm.length));
              } else if (!prefillSearchTerm) {
                setSearchNameSuffix(next);
              } else {
                setSearchNameSuffix(next);
              }
            }}
            placeholder="Enter part name to filter"
            className={STYLES.input}
          />
        </div>

        <button
          onClick={handleSearchClick}
          disabled={loading}
          className="bg-blue-600 cursor-pointer text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 h-10"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {uiError && <p className="text-red-600 mb-4 font-bold">{uiError}</p>}
      {searchError && <p className="text-red-600 mb-4 font-bold">{searchError}</p>}

      <div className="space-y-4">
        {results.map((part, index) => (
          <div key={index} className="pt-4 text-left border-t border-slate-800 shadow-sm text-sm">
            <div className="grid grid-cols-2 gap-2">
              <p className="col-span-2">
                <strong>Name:</strong> {part.Name || 'N/A'}
              </p>              
              <p>
                <strong>Part No:</strong> {part['Part No'] || 'N/A'}
              </p>
              <p>
                <strong>Rev:</strong> {part.Rev || 'N/A'}
              </p>
              <p>
                <strong>Old Part No:</strong> {part['Old Part No'] || 'N/A'}
              </p>
              <p>
                <strong>Part Type:</strong> {part['Part Type'] || 'N/A'}
              </p>
              <p>
                <strong>Part Group:</strong> {part['Part Group'] || 'N/A'}
              </p>
              <p>
                <strong>Part Status:</strong> {part['Part Status'] || 'N/A'}
              </p>
              <p>
                <strong>Grade:</strong> {part['Grade'] || 'N/A'}
              </p>
              <p>
                <strong>Note:</strong> {part.Note || 'N/A'}
              </p>
            </div>
          </div>
        ))}

        {results.length === 0 && !loading && !uiError && !searchError && (
          <p className="text-gray-500 text-center">No results found.</p>
        )}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="mt-6 cursor-pointer w-full bg-blue-600 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}