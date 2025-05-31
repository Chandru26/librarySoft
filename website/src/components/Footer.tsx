import React from 'react';

const footerStyle: React.CSSProperties = {
  padding: '20px',
  marginTop: 'auto', // Pushes footer to bottom if content is short
  backgroundColor: '#333',
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const Footer: React.FC = () => {
  return (
    <footer style={footerStyle}>
      <span style={{ marginRight: '15px' }}>&copy; {new Date().getFullYear()} LibrarySoft. All rights reserved.</span>
      <a href="#privacy" style={{ color: 'white', textDecoration: 'none', marginRight: '15px' }}>Privacy Policy</a>
      <a href="#terms" style={{ color: 'white', textDecoration: 'none' }}>Terms of Service</a>
    </footer>
  );
};

export default Footer;
