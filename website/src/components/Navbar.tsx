import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <NavLink to="/">
          LibrarySoft
        </NavLink>
      </div>
      <ul className="navbar-links">
        <li>
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Home</NavLink>
        </li>
        <li>
          <NavLink to="/support" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Support</NavLink>
        </li>
        <li>
          <NavLink to="/faq" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>FAQ</NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
