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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Welcome, {user?.email || 'User'}!</h2>
          <p className="text-green-600">{successMessage || 'You are logged in.'}</p>
          <button
            onClick={handleLogout}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {successMessage && !isAuthenticated && ( // Only show general success if not yet "redirected" by auth state
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Success: </strong>
              <span className="block sm:inline">{successMessage}</span>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="organizationIdentifier" className="sr-only">Organization Identifier (Name or ID)</label>
              <input
                id="organizationIdentifier"
                name="organizationIdentifier"
                type="text"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${validationErrors.organizationIdentifier ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Organization Identifier (Name or ID)"
                value={formData.organizationIdentifier}
                onChange={handleChange}
              />
              {validationErrors.organizationIdentifier && <p className="text-red-500 text-xs mt-1">{validationErrors.organizationIdentifier}</p>}
            </div>
            <div className="pt-2">
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${validationErrors.email ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
              {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
            </div>
            <div className="pt-2">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${validationErrors.password ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
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
