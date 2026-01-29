// src/components/DataImporter.tsx
import { useState } from 'react';

export default function DataImporter({ onImportComplete }: { onImportComplete?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
    <div className="mb-8">
      {/* Updated Button Styling to match primary actions */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded shadow-md transition-colors flex items-center gap-2"
      >
        <span>{isOpen ? '✕ Close Importer' : '📂 Import PLEX Data'}</span>
      </button>

      {isOpen && (
        <div className="mt-4 bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 text-left animate-fade-in">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">Import Data from PLEX</h3>
              <p className="text-gray-400 text-sm mt-1">
                Upload a JSON export. The system will automatically map "Name" or "Part No" to the search index.
              </p>
            </div>
          </div>
          
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:bg-gray-750 hover:border-blue-500 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              accept=".json"
              onChange={handleFileUpload}
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-gray-400 pointer-events-none">
                <span className="text-4xl block mb-2">📄</span>
                <span className="font-semibold text-blue-400">Click to upload</span> or drag and drop JSON file here
            </div>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded font-bold text-center ${message.includes('Error') ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}