import axios, { AxiosError } from 'axios';
import { OrganizationDetails, ApiErrorResponse, isApiErrorResponse } from '../types'; // Adjust path as needed

const API_BASE_URL = '/api/organizations'; // Specific base for organization-related endpoints

/**
 * Creates an Axios instance with common configuration.
 * This could be a shared instance if other services use similar base URLs or headers.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetches detailed information about the user's organization, including subscription tier and usage.
 *
 * @param token - The JWT token for authorization.
 * @returns A promise that resolves to OrganizationDetails.
 */
export const getOrganizationDetails = async (token: string): Promise<OrganizationDetails> => {
  // // --- MOCKED DATA IMPLEMENTATION ---
  // console.warn("Using MOCKED data for getOrganizationDetails in organizationService.ts");
  // // Simulate an API call delay
  // await new Promise(resolve => setTimeout(resolve, 500));

  // // Retrieve user details from localStorage to make mock data slightly more dynamic if needed
  // const authUserString = localStorage.getItem('authUser');
  // let organizationName = "Mocked Organization";
  // let organizationId = 0; // Default mock ID

  // if (authUserString) {
  //   try {
  //     const authUser = JSON.parse(authUserString);
  //     organizationName = authUser.organizationName || organizationName;
  //     organizationId = authUser.organizationId || organizationId;
  //   } catch (e) {
  //     console.error("Error parsing authUser from localStorage for mock data:", e);
  //   }
  // }


  // // Example: Randomly pick a tier or base it on something simple for mock variety
  // const tiers = [
  //   { name: 'Free', bookLimit: 100, userLimit: 3 },
  //   { name: 'Basic', bookLimit: 1000, userLimit: 10 },
  //   { name: 'Premium', bookLimit: -1, userLimit: -1 }
  // ];
  // const randomTier = tiers[Math.floor(Math.random() * tiers.length)];

  // const mockData: OrganizationDetails = {
  //   id: organizationId,
  //   name: organizationName,
  //   schemaName: `org_${organizationName.toLowerCase().replace(/\s+/g, '_')}`, // Simulated schema name
  //   subscriptionTier: randomTier.name,
  //   bookCount: Math.floor(Math.random() * (randomTier.bookLimit === -1 ? 2000 : randomTier.bookLimit)), // Mock current book count
  //   bookLimit: randomTier.bookLimit,
  //   userCount: Math.floor(Math.random() * (randomTier.userLimit === -1 ? 50 : randomTier.userLimit)), // Mock current user count
  //   userLimit: randomTier.userLimit,
  //   createdAt: new Date().toISOString(),
  // };
  // return Promise.resolve(mockData);
  // // --- END OF MOCKED DATA IMPLEMENTATION ---

  // --- REAL API CALL STRUCTURE ---
  try {
    // The endpoint is GET /api/organizations/me/details
    // The apiClient has baseURL: '/api/organizations'
    const response = await apiClient.get<OrganizationDetails>('/me/details', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // Map backend response to frontend OrganizationDetails type if names differ
    // Backend uses currentBookCount, currentUserCount
    // Frontend OrganizationDetails uses bookCount, userCount
    return {
        ...response.data,
        bookCount: response.data.currentBookCount, // Remap
        userCount: response.data.currentUserCount, // Remap
    } as OrganizationDetails; // Ensure type assertion if remapping
  } catch (err) {
    const axiosError = err as AxiosError<ApiErrorResponse>;
    if (axiosError.response && isApiErrorResponse(axiosError.response.data)) {
      throw axiosError.response.data;
    }
    throw new Error('Failed to fetch organization details. An unexpected error occurred.');
  }
  // --- END OF REAL API CALL STRUCTURE ---
};
