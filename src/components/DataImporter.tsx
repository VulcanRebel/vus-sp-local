// src/components/DataImporter.tsx
import { useState } from 'react';

// 🔒 SET YOUR ADMIN PIN HERE
const ADMIN_PIN = "1717";

export default function DataImporter({ onImportComplete }: { onImportComplete?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Handle the Lock Toggle
  const toggleImporter = () => {
    setIsOpen(!isOpen);
    // Automatically re-lock the importer and clear errors if they close the window
    if (isOpen) {
      setIsUnlocked(false);
      setPinInput('');
      setMessage('');
    }
  };

  // Handle the PIN Submit
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsUnlocked(true);
      setMessage(''); // Clear any previous errors
    } else {
      setMessage('Error: Incorrect Admin PIN');
      setPinInput('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage('Reading file...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target?.result;
        if (typeof jsonContent !== 'string') throw new Error('Invalid file content');

        const parsedData = JSON.parse(jsonContent);
        
        // Basic validation: Ensure it's an array
        const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];

        setMessage(`Uploading ${dataArray.length} records to local DB...`);

        // Send to Server
        const res = await fetch('http://127.0.0.1:3000/api/parts/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataArray)
        });

        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error || 'Import failed');

        setMessage(`Success! Imported ${result.count} parts.`);
        if (onImportComplete) onImportComplete();

      } catch (err: any) {
        console.error(err);
        setMessage(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div>
      {/* Importer Toggle Button */}
      <button
        onClick={toggleImporter}
        className="h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest transition-colors shadow-none rounded-none cursor-pointer flex items-center gap-2"
      >
        <span>{isOpen ? '✕ CLOSE IMPORTER' : '📂 IMPORT PLEX DATA'}</span>
      </button>

      {/* Importer Window */}
      {isOpen && (
        <div className="mt-4 bg-slate-900 p-6 shadow-lg border border-slate-700 text-left animate-fade-in">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">Import Data from PLEX</h3>
              <p className="text-slate-400 text-sm mt-1">
                Upload a JSON export. The system will automatically map "Name" or "Part No" to the search index.
              </p>
            </div>
          </div>
          
          {/* CONDITIONAL RENDER: PIN Prompt vs Dropzone */}
          {!isUnlocked ? (
            <form onSubmit={handleUnlock} className="bg-slate-950 border border-slate-800 p-6 text-center">
              <span className="text-3xl block mb-4">🔒</span>
              <p className="text-slate-300 font-bold mb-4">Admin Access Required</p>
              <div className="flex max-w-sm mx-auto gap-2">
                <input 
                  type="password" 
                  value={pinInput} 
                  onChange={(e) => setPinInput(e.target.value)} 
                  placeholder="Enter PIN"
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 text-sm font-mono focus:border-blue-600 focus:ring-0 transition-colors rounded-none"
                  autoFocus
                />
                <button 
                  type="submit" 
                  className="h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest transition-colors shadow-none rounded-none cursor-pointer shrink-0"
                >
                  Unlock
                </button>
              </div>
            </form>
          ) : (
            <div className="border-2 border-dashed border-slate-600 rounded-none p-8 text-center hover:bg-slate-800 hover:border-blue-500 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept=".json"
                onChange={handleFileUpload}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-slate-400 pointer-events-none">
                  <span className="text-4xl block mb-2">📄</span>
                  <span className="font-semibold text-blue-400">Click to upload</span> or drag and drop JSON file here
              </div>
            </div>
          )}

          {/* Messages (Errors & Success) */}
          {message && (
            <div className={`mt-4 p-3 font-bold text-center border text-sm ${message.includes('Error') ? 'bg-red-950/30 border-red-900 text-red-400' : 'bg-green-950/30 border-green-900 text-green-400'}`}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}