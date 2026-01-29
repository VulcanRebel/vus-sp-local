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
  
  return (
    <main className="font-sans pb-20 bg-gray-900 min-h-screen text-white"> 
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        
        {/* 1. Data Importer (Replaces Add Part Form) */}
        <DataImporter />

        {/* 2. Calculator Section */}
        <div id="calculatorWrap" className="mb-8 bg-gray-800 p-6 rounded-lg shadow-lg">
          <Calculator
            onSearchTermChange={setSearchPrefill}
            onAutoGenerateChange={setAutoGenOn}
          />
        </div>
        
        {/* 3. Search Section */}
        <div id="searchWrap" className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <PartSearch
            prefillSearchTerm={searchPrefill}
            autoGenerateOn={autoGenOn}
          /> 
        </div>

      </div>
    </main>
  );
}

export default App;