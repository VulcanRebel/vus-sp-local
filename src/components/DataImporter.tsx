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
    <div className="max-w-4xl mx-auto mb-8">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm bg-gray-700 hover:bg-gray-600 text-white py-1 px-3 rounded mb-2"
      >
        {isOpen ? 'Close Importer' : '📂 Import PLEX Data'}
      </button>

      {isOpen && (
        <div className="bg-gray-800 p-6 rounded shadow-lg border border-gray-700 text-left">
          <h3 className="text-xl font-bold mb-4 text-white">Import Data from PLEX</h3>
          <p className="text-gray-400 text-sm mb-4">
            Upload a JSON export. The system will automatically map "Name" or "Part No" to the search index.
          </p>
          
          <div className="border-2 border-dashed border-gray-600 rounded p-8 text-center hover:bg-gray-750 transition">
            <input 
              type="file" 
              accept=".json"
              onChange={handleFileUpload}
              disabled={loading}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                file:cursor-pointer hover:file:bg-blue-700"
            />
          </div>

          {message && (
            <div className={`mt-4 font-bold ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}