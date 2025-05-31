import React from 'react';
import Slideshow from '../components/Slideshow';
import ProductFeatures from '../components/ProductFeatures';
import PricingTable from '../components/PricingTable';

const HomePage: React.FC = () => {
  return (
    <div style={{ paddingLeft: '30px', paddingRight: '30px' }}>
      <Slideshow />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '30px 20px',
        backgroundColor: '#e0e0e0',
        marginTop: '20px'
      }}>
        <div>
          <h2 style={{ marginBottom: '10px' }}>LibrarySoft</h2>
          {/* The descriptive paragraph has been removed */}
        </div>
        <a
          href="#product-link" // Placeholder link
          style={{
            display: 'inline-block',
            padding: '12px 25px',
            backgroundColor: '#007bff', // Primary blue color
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            fontSize: '1.1em',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            whiteSpace: 'nowrap', // Prevent button text from wrapping
          }}
        >
          Go to LibrarySoft Product
        </a>
      </div>
      <ProductFeatures />
      <PricingTable />
    </div>
  );
};

export default HomePage;
