import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SupportPage from './pages/SupportPage';
import Navbar from './components/Navbar'; // Import Navbar
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <Navbar /> {/* Add Navbar here */}
      <div style={{ padding: '20px' }}> {/* Added some padding for content visibility */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/support" element={<SupportPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
