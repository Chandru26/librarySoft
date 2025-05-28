import React from 'react';
import LoginPage from './components/LoginPage'; // Assuming LoginPage.jsx is in src/components
// import RegistrationPage from './components/RegistrationPage'; // Can switch to test this too

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <header className="App-header">
        <h1 className="text-4xl font-bold text-blue-600 underline mb-6">
          Library Management System
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          Frontend is running with Vite, React, and TailwindCSS!
        </p>
      </header>
      {/* You can render one of the placeholder components here to test routing later */}
      <LoginPage />
      {/* <RegistrationPage /> */}
    </div>
  );
}

export default App;
