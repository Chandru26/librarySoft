import React, { useState, useEffect } from 'react';
import { getOrganizationDetails } from '../services/organizationService';
import { ApiErrorResponse, isApiErrorResponse } from '../types';

const DashboardStatistics: React.FC = () => {
  const [totalBooks, setTotalBooks] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Placeholder for books borrowed, as this data isn't in getOrganizationDetails
  const booksBorrowedPlaceholder = 75;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');

      if (!token) {
        setError('Authentication token not found. Please log in.');
        setLoading(false);
        return;
      }

      try {
        const result = await getOrganizationDetails(token);
        if (result.success && result.data) {
          setTotalBooks(result.data.bookCount);
          setTotalUsers(result.data.userCount);
        } else if (!result.success && result.error) {
          if (isApiErrorResponse(result.error)) {
            setError(result.error.message || 'Failed to fetch organization details.');
          } else {
            setError(String(result.error) || 'An unknown error occurred.');
          }
        } else {
            setError('Failed to fetch organization details. No data or error returned.');
        }
      } catch (err: any) {
        console.error('Error fetching organization details:', err);
        if (isApiErrorResponse(err)) {
          setError(err.message || 'An unexpected error occurred while fetching data.');
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="my-6 p-6 bg-white shadow-lg rounded-lg text-center">
        <p className="text-gray-700">Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-6 p-6 bg-white shadow-lg rounded-lg text-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="my-6 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Dashboard Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-100 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Total Books</h3>
          <p className="text-3xl font-bold text-blue-600">{totalBooks !== null ? totalBooks : 'N/A'}</p>
        </div>
        <div className="p-4 bg-green-100 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Total Users</h3>
          <p className="text-3xl font-bold text-green-600">{totalUsers !== null ? totalUsers : 'N/A'}</p>
        </div>
        <div className="p-4 bg-yellow-100 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800">Books Currently Borrowed</h3>
          <p className="text-3xl font-bold text-yellow-600">{booksBorrowedPlaceholder}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-500">
        Note: "Books Currently Borrowed" is placeholder data. Actual data for Total Books and Total Users is fetched from the system.
      </p>
    </div>
  );
};

export default DashboardStatistics;
