// src/components/PartSearch.tsx

import { useEffect, useState } from 'react';
import { auth, db, analytics } from '../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import type { WhereFilterOp } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';

import { useProgressivePartSearch } from '../hooks/useProgressivePartSearch';
import type { SearchConfig as HookSearchConfig } from '../hooks/useProgressivePartSearch';

// --- CONFIGURATION INTERFACE (local, structurally compatible with hook) ---
interface SearchConfig {
  serverFilters: {
    field: string;
    op: WhereFilterOp;
    value: string;
  }[];

  clientFilterField?: string;
  clientFilterValues?: string[];
}

// --- SEARCH CONFIG MAP ---
const SEARCH_CONFIG_MAP: Record<string, SearchConfig> = {
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
};

export default function PartSearch({ prefillSearchTerm = '', autoGenerateOn = false }: PartSearchProps) {

  // --- AUTH STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- SEARCH INPUTS ---
  const [searchName, setSearchName] = useState('');
  const [searchNameSuffix, setSearchNameSuffix] = useState('');
useEffect(() => {
  if (!autoGenerateOn) return;
  if (!prefillSearchTerm) return;

  // Keep the generated prefix in sync, preserve user suffix
  setSearchName(`${prefillSearchTerm}${searchNameSuffix}`);
}, [autoGenerateOn, prefillSearchTerm, searchNameSuffix]);

  useEffect(() => {
    if (autoGenerateOn) return;
    setSearchNameSuffix('');
  }, [autoGenerateOn]);
  
  const [searchType, setSearchType] = useState('');

  // --- UI VALIDATION ERROR (separate from hook/network errors) ---
  const [uiError, setUiError] = useState('');

  // --- AUTH LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  // --- PROGRESSIVE SEARCH HOOK ---
  const selectedConfig = searchType ? SEARCH_CONFIG_MAP[searchType] : undefined;

  // Structural typing makes this safe; we still guard searching when no type selected.
  const hookConfig: HookSearchConfig =
    (selectedConfig as unknown as HookSearchConfig) ?? ({ serverFilters: [] } satisfies HookSearchConfig);

  const {
    results,
    loading,
    error: searchError,
    hasMore,
    search,
    loadMore,
  } = useProgressivePartSearch({
    db,
    config: hookConfig,
    searchName,
    targetCount: 100, // how many *filtered* results to show per click/page
    serverChunkSize: 100, // how many raw docs to fetch per Firestore request
    maxServerPagesPerRequest: 10, // safety cap to control read costs
  });

  // --- ACTIONS ---
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      logEvent(analytics, 'login', { method: 'email' });
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError('Failed to sign in. Check your email and password.');
    }
  };

  const handleSearchClick = () => {
    setUiError('');

    if (!user) return;

    if (!searchType) {
      setUiError('Please select a part type.');
      return;
    }

    if (!SEARCH_CONFIG_MAP[searchType]) {
      setUiError('No data available for this part type.');
      return;
    }

    // Restore analytics logging for searches (fresh searches only)
    logEvent(analytics, 'search', { part_type: searchType, search_term: searchName });

    search();
  };

  // --- RENDER ---
  if (!user) {
    return (
      <div className="p-5 max-w-md mx-auto border rounded mt-10">
        <h2 className="text-xl font-bold mb-4">Sign In to Search Parts</h2>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded bg-gray-700"
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded bg-gray-700"
              required
            />
          </div>
          {authError && <p className="text-red-600">{authError}</p>}
          <button
            type="submit"
            className="cursor-pointer w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Sign In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-4xl mx-auto mt-8 border-t">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Part Search</h2>
        <div className="text-sm text-gray-600">Signed in as: {user.email}</div>
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
        
              // auto-gen ON: preserve prefix, store suffix
              if (prefillSearchTerm && next.startsWith(prefillSearchTerm)) {
                setSearchNameSuffix(next.slice(prefillSearchTerm.length));
              } else if (!prefillSearchTerm) {
                setSearchNameSuffix(next);
              } else {
                // user edited prefix; treat whole value as suffix attempt
                setSearchNameSuffix(next);
              }
            }}
            placeholder="Enter part name to filter"
            className="w-full p-2 border rounded bg-gray-700"
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
