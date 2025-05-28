// frontend/src/types/index.ts

/**
 * Represents the data structure for the organization registration form.
 */
export interface RegistrationFormData {
  organizationName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword?: string; // Optional, for client-side validation
}

/**
 * A generic API response structure for success.
 * Can be extended or used as a base for more specific responses.
 */
export interface ApiSuccessResponse<T = unknown> {
  message: string;
  data?: T; // Optional data payload (e.g., user details, organization details)
  // Add other common success fields if needed, e.g., organizationId, schemaName for registration
  organizationId?: number;
  schemaName?: string;
}

/**
 * A generic API response structure for errors.
 */
export interface ApiErrorResponse {
  message: string;
  errors?: Array<{ field?: string; message: string }>; // Optional detailed errors
}

/**
 * Type guard to check if the response is an ApiErrorResponse
 */
export function isApiErrorResponse(response: any): response is ApiErrorResponse {
  return response && typeof response.message === 'string';
}

// You can also define more specific response types if needed, e.g.:
// export interface RegistrationSuccessResponse extends ApiSuccessResponse {
//   organizationId: number;
//   schemaName: string;
// }

/**
 * Represents the data structure for the login form.
 */
export interface LoginFormData {
  organizationIdentifier: string;
  email: string;
  password: string;
}

/**
 * Represents the expected successful response from the login API.
 */
export interface LoginSuccessResponse extends ApiSuccessResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    organizationId: number;
    organizationName: string;
  };
}

/**
 * Represents the data structure for a Book.
 * Matches the backend model.
 */
export interface Book {
  id: string; // UUID
  title: string;
  author: string;
  isbn?: string | null;
  cover_image_url?: string | null;
  publication_year?: number | null;
  quantity: number;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Represents the data structure for the book creation/update form.
 */
export interface BookFormData {
  title: string;
  author: string;
  isbn?: string;
  cover_image_url?: string;
  publication_year?: number;
  quantity?: number;
}

/**
 * Represents the structure of the paginated response for books.
 */
export interface PaginatedBookResponse {
  message: string;
  data: Book[];
  pagination: {
    totalItems: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * Represents the detailed information about an organization's subscription and usage.
 */
export interface OrganizationDetails {
  id: number;
  name: string;
  schemaName: string;
  subscriptionTier: string; // Changed from subscriptionTierName for consistency
  bookCount: number;      // Changed from currentBookCount
  bookLimit: number;
  userCount: number;      // Anticipating user count might be useful
  userLimit: number;
  createdAt: string; // ISO date string
  // any other relevant details can be added here
}
