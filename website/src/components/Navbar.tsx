import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav style={{ padding: '10px', borderBottom: '1px solid #ccc', marginBottom: '20px' }}>
      <ul style={{ listStyleType: 'none', margin: 0, padding: 0, display: 'flex' }}>
        <li style={{ marginRight: '15px' }}>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/support">Support</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
