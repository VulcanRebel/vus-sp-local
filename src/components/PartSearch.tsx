// src/components/PartSearch.tsx
import { useEffect, useState } from 'react';
import { useLocalPartSearch } from '../hooks/useLocalPartSearch';
import type { LocalSearchConfig } from '../hooks/useLocalPartSearch';

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
  autoSelectedPartType?: string; // New prop for auto-selection
};

export default function PartSearch({ prefillSearchTerm = '', autoGenerateOn = false, autoSelectedPartType = '' }: PartSearchProps) {

  // --- MOCK AUTH STATE ---
  const user = { email: 'local-admin@vus.com', uid: 'local' }; 

  // --- SEARCH INPUTS ---
  const [searchName, setSearchName] = useState('');
  const [searchNameSuffix, setSearchNameSuffix] = useState('');
  
  // FIX: Sync Part Type automatically when Auto-Generate is ON
  useEffect(() => {
    if (autoGenerateOn && autoSelectedPartType && SEARCH_CONFIG_MAP[autoSelectedPartType]) {
      setSearchType(autoSelectedPartType);
    }
  }, [autoGenerateOn, autoSelectedPartType]);

  // FIX: Update Search Name dynamically
  // Removed the 'if (!prefillSearchTerm) return' guard clause.
  // This allows the field to update even if the calculator temporarily sends an empty string,
  // preventing the "lock" behavior when typing dimensions.
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
  
  // Safe default
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
    <div className="p-5 max-w-4xl mx-auto mt-8 border-t">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Part Search (Local)</h2>
        <div className="text-sm text-gray-600">Mode: Local Admin</div>
      </div>

      <div className="flex gap-4 mb-6 items-end">
        <div className="flex-1">
          <label className="block font-semibold mb-1">Part Type:</label>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="w-full p-2 border rounded bg-gray-700 text-white"
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
          <label className="block font-semibold mb-1">Part Name (Optional):</label>
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
            className="w-full p-2 border rounded bg-gray-700 text-white"
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
          <div key={index} className="p-4 text-left border rounded shadow-sm text-sm">
            <div className="grid grid-cols-2 gap-2">
              <p>
                <strong>Part No:</strong> {part['Part No'] || 'N/A'}
              </p>
              <p>
                <strong>Rev:</strong> {part.Rev || 'N/A'}
              </p>
              <p className="col-span-2">
                <strong>Name:</strong> {part.Name || 'N/A'}
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