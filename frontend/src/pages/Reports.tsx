import React, { useEffect, useState } from 'react';

interface ReportData {
  users: {
    total: number;
    newLast30Days: number;
    activeLast30Days: number;
  };
  books: {
    total: number;
    addedLast30Days: number;
  };
  organizationSubscriptions: {
    freeTier: number;
    standardTier: number;
    premiumTier: number;
  };
}

const AdminReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');

      if (!token) {
        setError('Authentication token not found.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/reports/summary', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch reports: ${response.statusText}`);
        }

        const data: ReportData = await response.json();
        setReportData(data);
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, []);

  if (isLoading) {
    return (
      <div className="my-6 p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Admin Reports</h2>
        <p className="text-gray-600">Loading report data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-6 p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Admin Reports</h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="my-6 p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Admin Reports</h2>
        <p className="text-gray-600">No report data available.</p>
      </div>
    );
  }

  return (
    <div className="my-6 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Admin Reports Summary</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Users Section */}
        <div className="p-4 bg-indigo-100 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-indigo-700 mb-2">User Statistics</h3>
          <p data-testid="users-total"><strong>Total Users:</strong> {reportData.users.total}</p>
          <p data-testid="users-new"><strong>New Users (Last 30 Days):</strong> {reportData.users.newLast30Days}</p>
          <p data-testid="users-active"><strong>Active Users (Last 30 Days):</strong> {reportData.users.activeLast30Days}</p>
        </div>

        {/* Books Section */}
        <div className="p-4 bg-green-100 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-green-700 mb-2">Book Statistics</h3>
          <p data-testid="books-total"><strong>Total Books:</strong> {reportData.books.total}</p>
          <p data-testid="books-added"><strong>Books Added (Last 30 Days):</strong> {reportData.books.addedLast30Days}</p>
        </div>

        {/* Subscriptions Section */}
        <div className="p-4 bg-yellow-100 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-yellow-700 mb-2">Organization Subscriptions</h3>
          <p data-testid="subs-free"><strong>Free Tier:</strong> {reportData.organizationSubscriptions.freeTier}</p>
          <p data-testid="subs-standard"><strong>Standard Tier:</strong> {reportData.organizationSubscriptions.standardTier}</p>
          <p data-testid="subs-premium"><strong>Premium Tier:</strong> {reportData.organizationSubscriptions.premiumTier}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
