import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer style={{
      padding: '20px',
      marginTop: 'auto', // Pushes footer to bottom if content is short
      backgroundColor: '#333',
      color: 'white',
      textAlign: 'center'
    }}>
      <p>&copy; {new Date().getFullYear()} LibrarySoft. All rights reserved.</p>
      <div style={{ marginTop: '10px' }}>
        <a href="#privacy" style={{ color: 'white', textDecoration: 'none', marginRight: '15px' }}>Privacy Policy</a>
        <a href="#terms" style={{ color: 'white', textDecoration: 'none' }}>Terms of Service</a>
      </div>
    </footer>
  );
};

export default Footer;
