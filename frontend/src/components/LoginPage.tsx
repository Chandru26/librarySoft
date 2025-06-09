import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { LoginFormData, LoginSuccessResponse, ApiErrorResponse, isApiErrorResponse } from '../types'; // Adjust path as needed

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    organizationIdentifier: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Partial<LoginFormData>>({});

  // Simulate a simple auth state for demonstration
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('authToken'));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (validationErrors[e.target.name as keyof LoginFormData]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: undefined });
    }
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};
    if (!formData.organizationIdentifier.trim()) newErrors.organizationIdentifier = 'Organization identifier is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid.';
    }
    if (!formData.password) newErrors.password = 'Password is required.';

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post<LoginSuccessResponse>('/api/auth/login', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.token) {
        // Store the JWT in localStorage
        localStorage.setItem('authToken', response.data.token);
        // Store user info (optional, but useful for UI)
        localStorage.setItem('authUser', JSON.stringify(response.data.user));

        setSuccessMessage(response.data.message || 'Login successful! Redirecting...');
        setIsAuthenticated(true); // Update auth state

        // TODO: Implement actual redirection to a dashboard or protected route
        console.log('Login successful, token:', response.data.token);
        console.log('User details:', response.data.user);
        // Example: setTimeout(() => { router.push('/dashboard'); }, 1000);
        setFormData({ organizationIdentifier: '', email: '', password: '' }); // Clear form
      } else {
        setError('Login successful, but no token received.'); // Should not happen with correct backend setup
      }

    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      if (axiosError.response && isApiErrorResponse(axiosError.response.data)) {
        setError(axiosError.response.data.message);
      } else if (axiosError.request) {
        setError('No response from server. Please check your network connection.');
      } else {
        setError('An unexpected error occurred during login.');
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setIsAuthenticated(false);
    setSuccessMessage('You have been logged out.');
  };

  if (isAuthenticated) {
    const storedUser = localStorage.getItem('authUser');
    const user = storedUser ? JSON.parse(storedUser) : null;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border border-gray-200 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 leading-tight">Welcome, {user?.email || 'User'}!</h2>
          <div className="flex items-center justify-center text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6 mr-2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMessage || 'You are logged in.'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-150 ease-in-out"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border border-gray-200">
        <div className="text-center">
          {/* Placeholder for a logo - can be an <img> tag */}
          {/* <img className="mx-auto h-12 w-auto" src="/path-to-your-logo.svg" alt="Application Logo" /> */}
          <h1 className="text-4xl font-bold text-violet-700 tracking-tight leading-tight">
            MyAppName
          </h1>
        </div>
        <div>
          <h2 className="mt-2 text-center text-3xl font-bold text-gray-900 leading-tight"> {/* Changed mt-6 to mt-2, font-extrabold to font-bold */}
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="flex items-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6 mr-2 text-red-500">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            </div>
          )}
          {successMessage && !isAuthenticated && ( // Only show general success if not yet "redirected" by auth state
            <div className="flex items-center bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6 mr-2 text-green-500">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <strong className="font-bold">Success: </strong>
                <span className="block sm:inline">{successMessage}</span>
              </div>
            </div>
          )}
          <div className="rounded-md shadow-sm"> {/* Removed -space-y-px, will manage spacing with pt-2 or similar if needed later */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-5 h-5 text-gray-400">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6.75M9 12.75h6.75M9 18.75h6.75" />
                </svg>
              </div>
              <label htmlFor="organizationIdentifier" className="sr-only">Organization Identifier (Name or ID)</label>
              <input
                id="organizationIdentifier"
                name="organizationIdentifier"
                type="text"
                required
                className={`appearance-none rounded-none relative block w-full pl-10 px-3 py-2 border ${validationErrors.organizationIdentifier ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:ring-2 focus:z-10 sm:text-sm`}
                placeholder="Organization Identifier (Name or ID)"
                value={formData.organizationIdentifier}
                onChange={handleChange}
              />
              {validationErrors.organizationIdentifier && <p className="text-red-500 text-xs mt-1">{validationErrors.organizationIdentifier}</p>}
            </div>
            <div className="pt-2 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full pl-10 px-3 py-2 border ${validationErrors.email ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:ring-2 focus:z-10 sm:text-sm`}
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
              {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
            </div>
            <div className="pt-2 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                </svg>
              </div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`appearance-none rounded-none relative block w-full pl-10 px-3 py-2 border ${validationErrors.password ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:ring-2 focus:z-10 sm:text-sm`}
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              {validationErrors.password && <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:bg-violet-400 transition-all duration-150 ease-in-out"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
