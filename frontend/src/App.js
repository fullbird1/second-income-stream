import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import StocksByTier from './pages/StocksByTier';
import DividendTracker from './pages/DividendTracker';
import CurrencyConverter from './pages/CurrencyConverter';
import './App.css';

function App() {
  return (
    <div className="App">
      <Navigation />
      <div className="container-fluid mt-3">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/stocks/:tier" element={<StocksByTier />} />
          <Route path="/dividends" element={<DividendTracker />} />
          <Route path="/currency" element={<CurrencyConverter />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
