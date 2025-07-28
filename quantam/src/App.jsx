import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ChatBot from './components/qunfront'; // Make sure path is correct

const App = () => {
  return (
    <div className="app">
     
      
      <Routes>
        <Route path="/" element={<ChatBot />} />
        {/* Add more routes here if needed */}
      </Routes>
    </div>
  );
};

export default App;
