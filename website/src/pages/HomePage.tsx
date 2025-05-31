import React from 'react';
import Slideshow from '../components/Slideshow';
import ProductFeatures from '../components/ProductFeatures';
import PricingTable from '../components/PricingTable';

const HomePage: React.FC = () => {
  return (
    <div>
      <Slideshow />
      <ProductFeatures />
      <PricingTable />
      <div style={{ textAlign: 'center', padding: '30px 20px', backgroundColor: '#e0e0e0', marginTop: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Ready to Get Started?</h2>
        <p style={{ marginBottom: '25px', fontSize: '1.1em' }}>
          Explore the full capabilities of LibrarySoft and transform your library management.
        </p>
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
          }}
        >
          Go to LibrarySoft Product
        </a>
      </div>
    </div>
  );
};

export default HomePage;
