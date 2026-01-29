// src/App.tsx
import { useState } from 'react';
import './App.css';
import Navbar from './Navbar';
import Calculator from './components/Calculator';
import PartSearch from './components/PartSearch';

function App() {
  const [searchPrefill, setSearchPrefill] = useState('');
  const [autoGenOn, setAutoGenOn] = useState(false);
  
  return (
    <main className="font-sans pb-20"> {/* Added padding bottom for scrolling space */}
      <Navbar /> 
      <div id="calculatorWrap" className="mb-8">
        <Calculator
          onSearchTermChange={setSearchPrefill}
          onAutoGenerateChange={setAutoGenOn}
        />
      </div>
      
      <div id="searchWrap">
        <PartSearch
          prefillSearchTerm={searchPrefill}
          autoGenerateOn={autoGenOn}
        /> {/* <-- Render it */}
      </div>
    </main>
  );
}

export default App;
