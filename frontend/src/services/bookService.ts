import axios, { AxiosError } from 'axios';
import { Book, BookFormData, PaginatedBookResponse, ApiErrorResponse, isApiErrorResponse } from '../types'; // Adjust path as needed

const API_BASE_URL = '/api'; // Assuming your backend is served on the same domain or proxied

/**
 * Creates an Axios instance with common configuration.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetches a list of books, with optional pagination.
 *
 * @param token - The JWT token for authorization.
 * @param page - Optional page number for pagination.
 * @param limit - Optional limit for number of items per page.
 * @returns A promise that resolves to a PaginatedBookResponse.
 */
export const getBooks = async (
  token: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedBookResponse> => {
  try {
    const response = await apiClient.get<PaginatedBookResponse>('/books', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { page, limit },
    });
    return response.data;
  } catch (err) {
    const axiosError = err as AxiosError<ApiErrorResponse>;
    if (axiosError.response && isApiErrorResponse(axiosError.response.data)) {
      throw axiosError.response.data;
    }
    throw new Error('Failed to fetch books. An unexpected error occurred.');
  }
};

/**
 * Creates a new book.
 *
 * @param bookData - The data for the new book.
 * @param token - The JWT token for authorization.
 * @returns A promise that resolves to the created Book object.
 */
export const createBook = async (bookData: BookFormData, token: string): Promise<Book> => {
  try {
    const response = await apiClient.post<{ message: string; book: Book }>('/books', bookData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.book; // Assuming the backend returns { message: string, book: Book }
  } catch (err) {
    const axiosError = err as AxiosError<ApiErrorResponse>;
    if (axiosError.response && isApiErrorResponse(axiosError.response.data)) {
      throw axiosError.response.data;
    }
    throw new Error('Failed to create book. An unexpected error occurred.');
  }
};

/**
 * Fetches a single book by its ID.
 * (Optional for now, but good for future use)
 *
 * @param id - The ID of the book to fetch.
 * @param token - The JWT token for authorization.
 * @returns A promise that resolves to the Book object.
 */
export const getBookById = async (id: string, token: string): Promise<Book> => {
    try {
      const response = await apiClient.get<{ message: string; book: Book }>(`/books/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.book;
    } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        if (axiosError.response && isApiErrorResponse(axiosError.response.data)) {
          throw axiosError.response.data;
        }
        throw new Error(`Failed to fetch book with ID ${id}. An unexpected error occurred.`);
    }
};

/**
 * Updates an existing book.
 * (Optional for now, but good for future use)
 *
 * @param id - The ID of the book to update.
 * @param bookData - The updated data for the book.
 * @param token - The JWT token for authorization.
 * @returns A promise that resolves to the updated Book object.
 */
export const updateBook = async (id: string, bookData: Partial<BookFormData>, token: string): Promise<Book> => {
    try {
      const response = await apiClient.put<{ message: string; book: Book }>(`/books/${id}`, bookData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.book;
    } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        if (axiosError.response && isApiErrorResponse(axiosError.response.data)) {
          throw axiosError.response.data;
        }
        throw new Error(`Failed to update book with ID ${id}. An unexpected error occurred.`);
    }
};

/**
 * Deletes a book.
 * (Optional for now, but good for future use)
 *
 * @param id - The ID of the book to delete.
 * @param token - The JWT token for authorization.
 * @returns A promise that resolves to a success message object.
 */
export const deleteBook = async (id: string, token: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete<{ message: string }>(`/books/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        if (axiosError.response && isApiErrorResponse(axiosError.response.data)) {
          throw axiosError.response.data;
        }
        throw new Error(`Failed to delete book with ID ${id}. An unexpected error occurred.`);
    }
};
