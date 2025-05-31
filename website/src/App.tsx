import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SupportPage from './pages/SupportPage';
import FAQPage from './pages/FAQPage'; // Import FAQPage
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css'; // Main CSS file

const App: React.FC = () => {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flexGrow: 1 }}> {/* Removed padding here */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/faq" element={<FAQPage />} /> {/* Add FAQPage route */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
