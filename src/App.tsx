// src/App.tsx
import { useState } from 'react';
import './App.css';
import Navbar from './Navbar';
import Calculator from './components/Calculator';
import PartSearch from './components/PartSearch';
import DataImporter from './components/DataImporter';

function App() {
  const [searchPrefill, setSearchPrefill] = useState('');
  const [autoGenOn, setAutoGenOn] = useState(false);
  const [autoPartType, setAutoPartType] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  
  return (
    <main className="font-sans min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-600 selection:text-white"> 
      <Navbar />
      
      {/* Reduced vertical padding (py-8 instead of py-12) to pull content up */}
      <div className="container mx-auto px-8 py-8 max-w-7xl">
        
        {/* Compact Header: Reduced mb-8 instead of mb-12, tighter pb-6 */}
        <div className="grid grid-cols-12 gap-8 mb-8 items-end border-b border-slate-800 pb-6">
          <div className="col-span-12 lg:col-span-8">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Standard Procedures</h1>
            <p className="text-slate-400 text-base">Operational Calculator & Database</p>
          </div>
          <div className="col-span-12 lg:col-span-4 flex justify-start lg:justify-end">
             <DataImporter />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
          
          {/* CALCULATOR */}
          <section id="calculatorWrap" className="col-span-12 lg:col-span-5 bg-slate-900 border border-slate-800 p-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 border-b border-slate-800 pb-2">
              01 / Specifications
            </h2>
            <Calculator
              onSearchTermChange={setSearchPrefill}
              onAutoGenerateChange={setAutoGenOn}
              onPartTypeChange={setAutoPartType}
              onTriggerSearch={() => setSearchTrigger(prev => prev + 1)}
            />
          </section>
          
          {/* SEARCH */}
          <section id="searchWrap" className="col-span-12 lg:col-span-7 bg-slate-900 border border-slate-800 p-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 border-b border-slate-800 pb-2">
              02 / Search Results
            </h2>
            <PartSearch
              prefillSearchTerm={searchPrefill}
              autoGenerateOn={autoGenOn}
              autoSelectedPartType={autoPartType}
              searchTrigger={searchTrigger}
            /> 
          </section>

        </div>
      </div>
    </main>
  );
}

export default App;