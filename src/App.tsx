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
      
      {/* GRID ARCHITECTURE 
        - 12-column grid for desktop (lg)
        - gap-8 (32px) for consistent vertical/horizontal rhythm
        - max-w-7xl ensures optimal line length on wide screens
      */}
      <div className="container mx-auto px-8 py-12 max-w-7xl">
        
        {/* Header Area with Action */}
        <div className="grid grid-cols-12 gap-8 mb-12 items-end border-b border-slate-800 pb-8">
          <div className="col-span-12 lg:col-span-8">
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Standard Procedures</h1>
            <p className="text-slate-400 text-lg">Operational Calculator & Database</p>
          </div>
          <div className="col-span-12 lg:col-span-4 flex justify-start lg:justify-end">
             {/* Importer moved to header aligned with grid */}
             <DataImporter />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-8 items-start">
          
          {/* CALCULATOR: Spans 5 columns (approx 40%) */}
          <section id="calculatorWrap" className="col-span-12 lg:col-span-5 bg-slate-900 border border-slate-800 p-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 border-b border-slate-800 pb-2">
              01 / Specifications
            </h2>
            <Calculator
              onSearchTermChange={setSearchPrefill}
              onAutoGenerateChange={setAutoGenOn}
              onPartTypeChange={setAutoPartType}
              onTriggerSearch={() => setSearchTrigger(prev => prev + 1)}
            />
          </section>
          
          {/* SEARCH: Spans 7 columns (approx 60%) */}
          <section id="searchWrap" className="col-span-12 lg:col-span-7 bg-slate-900 border border-slate-800 p-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 border-b border-slate-800 pb-2">
              02 / Database Results
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