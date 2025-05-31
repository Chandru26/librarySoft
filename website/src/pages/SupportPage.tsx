import React from 'react';

// Basic styling for the page elements
const pageStyle: React.CSSProperties = {
  paddingTop: '20px', // Only vertical padding
  paddingBottom: '20px', // Only vertical padding
  lineHeight: '1.6',
};

const placeholderImageStyle: React.CSSProperties = {
  height: '200px',
  backgroundColor: '#e0e0e0', // Light grey placeholder
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#555',
  fontSize: '1.5em',
  borderRadius: '8px',
  marginBottom: '30px',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '30px',
  padding: '20px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
};

const SupportPage: React.FC = () => {
  return (
    <div style={pageStyle}>
      <div style={placeholderImageStyle}>
        <span>[Placeholder for Support Page Image]</span>
      </div>

      <section style={sectionStyle}>
        <h2>Contact Our Support Team</h2>
        <p>
          Have questions or need help with LibrarySoft? Our team is here to assist you.
        </p>
        <p>
          You can reach us via email for any inquiries or support requests. We aim to respond
          within 24-48 business hours.
        </p>
        <a
          href="mailto:support@librarysoft.example.com"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            marginTop: '10px',
          }}
        >
          Email Support
        </a>
      </section>

      <section style={sectionStyle}>
        <h2>Our Office</h2>
        <p>If you prefer to reach out by mail or visit us (by appointment), here is our address:</p>
        <address style={{ fontStyle: 'normal' }}>
          <strong>LibrarySoft India Pvt. Ltd.</strong><br />
          123 Tech Park Road<br />
          Whitefield, Bangalore<br />
          Karnataka, 560066<br />
          India
        </address>
      </section>
    </div>
  );
};

export default SupportPage;
