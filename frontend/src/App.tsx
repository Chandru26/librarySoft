import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode'; // Corrected import
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login';
import RegistrationPage from './pages/Registration'; // Keep for potential routing
import BookList from './pages/Books';
import CreateBookForm from './pages/CreateBookForm';
import SubscriptionInfo from './pages/SubscriptionInfo'; // Import SubscriptionInfo
import AdminReportsPage from './pages/Reports';
import ProfilePage from './pages/ProfilePage';
import DashboardStatistics from './pages/Dashboard';
import MainLayout from './components/layout/MainLayout';
import SettingsPage from './pages/Settings';

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
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} /> {/* <-- Add this line */}
      <Route path="/" element={<MainLayout />}>
        <Route path="dashboard" element={<DashboardStatistics />} />
        <Route path="books" element={<BookList />} />
        <Route path="users" element={<SubscriptionInfo />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="settings" element={<SettingsPage />} /> {/* <-- Add this line */}
        {/* Add other routes here */}
      </Route>
    </Routes>
  );
};

export default App;
