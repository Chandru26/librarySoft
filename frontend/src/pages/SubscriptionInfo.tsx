import React, { useEffect, useState } from 'react';
import { getOrganizationDetails } from '../services/organizationService'; // Adjust path as needed
import { OrganizationDetails, ApiErrorResponse } from '../types'; // Adjust path as needed

const SubscriptionInfo: React.FC = () => {
  const [orgDetails, setOrgDetails] = useState<OrganizationDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');

      if (!token) {
        setError('Authentication token not found. Please login.');
        setIsLoading(false);
        return;
      }

      try {
        const details = await getOrganizationDetails(token);
        setOrgDetails(details);
      } catch (err) {
        const apiError = err as ApiErrorResponse; // Type assertion
        if (apiError && apiError.message) {
          setError(apiError.message);
        } else {
          setError('An unexpected error occurred while fetching organization details.');
        }
        console.error('Fetch organization details error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 bg-white shadow-md rounded-lg animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg shadow-md" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!orgDetails) {
    return <p className="p-4 bg-white shadow-md rounded-lg text-gray-500">No subscription information available.</p>;
  }

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg border border-gray-200">
      <h3 className="text-xl font-semibold text-indigo-700 mb-4">Subscription Details</h3>
      <div className="space-y-3">
        <p className="text-gray-700">
          <span className="font-medium">Tier:</span> 
          <span className={`ml-2 px-3 py-1 text-sm font-semibold rounded-full ${
            orgDetails.subscriptionTier === 'Premium' ? 'bg-yellow-200 text-yellow-800' :
            orgDetails.subscriptionTier === 'Basic' ? 'bg-blue-200 text-blue-800' :
            'bg-green-200 text-green-800' // Default for Free or other tiers
          }`}>
            {orgDetails.subscriptionTier}
          </span>
        </p>
        <p className="text-gray-700">
          <span className="font-medium">Book Usage:</span> {orgDetails.bookCount} / {orgDetails.bookLimit === -1 ? 'Unlimited' : orgDetails.bookLimit}
        </p>
        {/* Display a progress bar for book usage */}
        {orgDetails.bookLimit !== -1 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full" 
              style={{ width: `${(orgDetails.bookCount / orgDetails.bookLimit) * 100}%` }}
            ></div>
          </div>
        )}
         <p className="text-gray-700">
          <span className="font-medium">User Limit:</span> {orgDetails.userCount} / {orgDetails.userLimit === -1 ? 'Unlimited' : orgDetails.userLimit}
        </p>
         {/* Display a progress bar for user usage */}
         {orgDetails.userLimit !== -1 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className="bg-green-500 h-2.5 rounded-full" 
              style={{ width: `${(orgDetails.userCount / orgDetails.userLimit) * 100}%` }}
            ></div>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-2">
          Organization: {orgDetails.name} (ID: {orgDetails.id})
        </p>
      </div>
    </div>
  );
};

export default SubscriptionInfo;
