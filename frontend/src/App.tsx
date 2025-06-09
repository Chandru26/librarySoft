import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode'; // Corrected import
import LoginPage from './components/LoginPage';
import RegistrationPage from './components/RegistrationPage'; // Keep for potential routing
import BookList from './components/BookList';
import CreateBookForm from './components/CreateBookForm';
import SubscriptionInfo from './components/SubscriptionInfo'; // Import SubscriptionInfo

import AdminReportsPage from './components/AdminReportsPage';

import ProfilePage from './components/ProfilePage';

import Footer from './components/Footer'; // Import Footer

import DashboardStatistics from './components/DashboardStatistics';


interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  organizationId: number;
  organizationSchema: string;
  iat: number;
  exp: number;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState<boolean>(true); // To toggle between Login and Registration
  const [showProfilePage, setShowProfilePage] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        // Check if token is expired
        if (decodedToken.exp * 1000 > Date.now()) {
          setIsAuthenticated(true);
          setUserRole(decodedToken.role);
        } else {
          // Token expired, clear it
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Invalid token:", error);
        // Clear invalid token
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setIsAuthenticated(false);
        setUserRole(null);
      }
    }
  }, []); // Runs once on component mount

  // This effect will run when isAuthenticated changes, e.g., after login/logout
  // It re-checks the token and role. LoginPage now handles this internally for its own state.
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        if (decodedToken.exp * 1000 > Date.now()) {
          if(!isAuthenticated) setIsAuthenticated(true); // Update if changed by login page
          setUserRole(decodedToken.role);
        } else {
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    } else {
        setIsAuthenticated(false);
        setUserRole(null);
    }
  }, [isAuthenticated]);


  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setIsAuthenticated(false);
    setUserRole(null);
    setShowLogin(true); // Show login page after logout
  };
  
  // This function can be passed to LoginPage to update App's auth state
  // Or LoginPage can manage its own display and this App component can just react to localStorage changes
  const handleLoginSuccess = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const decodedToken = jwtDecode<DecodedToken>(token);
             if (decodedToken.exp * 1000 > Date.now()) {
                setIsAuthenticated(true);
                setUserRole(decodedToken.role);
            }
        } catch (e) { console.error("Error decoding token after login", e)}
    }
  };


  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        {showLogin ? (
          <LoginPage /> // LoginPage now internally handles setting isAuthenticated on successful login via localStorage
        ) : (
          <RegistrationPage />
        )}
        <button
          onClick={() => setShowLogin(!showLogin)}
          className="mt-4 text-indigo-600 hover:text-indigo-500"
        >
          {showLogin ? 'Need to register an organization?' : 'Already have an account? Sign in'}
        </button>
      </div>
    );
  }

  // Authenticated view
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-indigo-700 text-white p-6 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Library System Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Welcome, {localStorage.getItem('authUser') ? JSON.parse(localStorage.getItem('authUser')!).email : 'User'}! (Role: {userRole})</span>
            <button
              onClick={() => setShowProfilePage(true)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-2"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-4">
        {showProfilePage && <ProfilePage onClose={() => setShowProfilePage(false)} />}

        {userRole === 'admin' && !showProfilePage && (
          <div className="my-6 p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Admin Controls</h2>
            <CreateBookForm onBookCreated={() => {
              // Potentially refresh book list or show a global notification
              // For now, BookList will refetch on its own if currentPage changes,
              // or could add a manual refresh mechanism if needed.
              console.log("A new book has been created, BookList might need a refresh trigger.");
            }} />
            <DashboardStatistics /> {/* Add dashboard statistics here */}
          </div>
        )}

        {userRole === 'admin' && (
          <AdminReportsPage />
        )}

        <div className="mt-8">
          { !showProfilePage && <SubscriptionInfo /> } {/* Display subscription info conditionally */}
        </div>



        {/* Ensure only one Admin Controls section exists and is conditional */}
        {/* The duplicated section below was removed. The first one is kept. */}
        {/* {userRole === 'admin' && !showProfilePage && (
          <div className="my-6 p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Admin Controls</h2>
            <CreateBookForm onBookCreated={() => {
              // Potentially refresh book list or show a global notification
              // For now, BookList will refetch on its own if currentPage changes,
              // or could add a manual refresh mechanism if needed.
              console.log("A new book has been created, BookList might need a refresh trigger.");
            }} />
          </div>
        )} */}



        <div className="mt-8">
          {!showProfilePage && <BookList />}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default App;
