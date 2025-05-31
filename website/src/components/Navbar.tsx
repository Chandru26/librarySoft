import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 20px',
      backgroundColor: '#333', // Dark background
      color: 'white'
    }}>
      <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
          LibrarySoft
        </Link>
      </div>
      <ul style={{ listStyleType: 'none', margin: 0, padding: 0, display: 'flex' }}>
        <li style={{ marginRight: '15px' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
        </li>
        <li style={{ marginRight: '15px' }}>
          <Link to="/support" style={{ color: 'white', textDecoration: 'none' }}>Support</Link>
        </li>
        <li>
          <Link to="/faq" style={{ color: 'white', textDecoration: 'none' }}>FAQ</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
