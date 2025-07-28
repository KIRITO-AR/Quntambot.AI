import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Qunfront from './components/qunfront';
  const App = () => {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Qunfront />} />
        {/* Add more routes here as needed */}
      </Routes>
    </div>
  );
};

export default App
