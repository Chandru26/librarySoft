import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { RegistrationFormData, ApiSuccessResponse, ApiErrorResponse, isApiErrorResponse } from '../types'; // Adjust path as needed

const RegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    organizationName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Partial<RegistrationFormData>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear specific validation error when user starts typing
    if (validationErrors[e.target.name as keyof RegistrationFormData]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: undefined });
    }
    // Clear general error messages when user interacts with the form
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegistrationFormData> = {};
    if (!formData.organizationName.trim()) newErrors.organizationName = 'Organization name is required.';
    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = 'Admin email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) {
      newErrors.adminEmail = 'Admin email is invalid.';
    }
    if (!formData.adminPassword) {
      newErrors.adminPassword = 'Admin password is required.';
    } else if (formData.adminPassword.length < 8) {
      newErrors.adminPassword = 'Password must be at least 8 characters long.';
    }
    if (formData.adminPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

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
      // Exclude confirmPassword from the data sent to the backend
      const { confirmPassword, ...dataToSubmit } = formData;

      const response = await axios.post<ApiSuccessResponse>('/api/organizations/register', dataToSubmit, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setSuccessMessage(response.data.message || 'Organization registered successfully! You can now try logging in.');
      // Optionally, redirect or clear form
      setFormData({ organizationName: '', adminEmail: '', adminPassword: '', confirmPassword: '' });

    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      if (axiosError.response && isApiErrorResponse(axiosError.response.data)) {
        setError(axiosError.response.data.message);
      } else if (axiosError.request) {
        setError('No response from server. Please check your network connection.');
      } else {
        setError('An unexpected error occurred during registration.');
      }
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Register New Organization
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Success: </strong>
              <span className="block sm:inline">{successMessage}</span>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="organizationName" className="sr-only">Organization Name</label>
              <input
                id="organizationName"
                name="organizationName"
                type="text"
                autoComplete="organization"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${validationErrors.organizationName ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Organization Name"
                value={formData.organizationName}
                onChange={handleChange}
              />
              {validationErrors.organizationName && <p className="text-red-500 text-xs mt-1">{validationErrors.organizationName}</p>}
            </div>
            <div className="pt-2"> {/* Added padding-top for spacing */}
              <label htmlFor="adminEmail" className="sr-only">Admin Email address</label>
              <input
                id="adminEmail"
                name="adminEmail"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${validationErrors.adminEmail ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Admin Email address"
                value={formData.adminEmail}
                onChange={handleChange}
              />
              {validationErrors.adminEmail && <p className="text-red-500 text-xs mt-1">{validationErrors.adminEmail}</p>}
            </div>
            <div className="pt-2">
              <label htmlFor="adminPassword" className="sr-only">Admin Password</label>
              <input
                id="adminPassword"
                name="adminPassword"
                type="password"
                autoComplete="new-password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${validationErrors.adminPassword ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Admin Password (min. 8 characters)"
                value={formData.adminPassword}
                onChange={handleChange}
              />
              {validationErrors.adminPassword && <p className="text-red-500 text-xs mt-1">{validationErrors.adminPassword}</p>}
            </div>
            <div className="pt-2">
              <label htmlFor="confirmPassword" className="sr-only">Confirm Admin Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Confirm Admin Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {validationErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>}
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
                'Register Organization'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationPage;
