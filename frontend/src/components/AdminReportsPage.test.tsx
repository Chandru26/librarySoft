import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminReportsPage from './AdminReportsPage';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock fetch
global.fetch = jest.fn();

const mockReportData = {
  users: { total: 10, newLast30Days: 2, activeLast30Days: 8 },
  books: { total: 100, addedLast30Days: 5 },
  organizationSubscriptions: { freeTier: 3, standardTier: 1, premiumTier: 1 },
};

describe('AdminReportsPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
    localStorage.clear();
    localStorage.setItem('authToken', 'fake-admin-token'); // Needs a token to attempt fetch
  });

  test('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {})); // Never resolves
    render(<AdminReportsPage />);
    expect(screen.getByText(/Loading report data.../i)).toBeInTheDocument();
  });

  test('renders title and fetched data successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReportData,
    } as Response);

    render(<AdminReportsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Admin Reports Summary/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('users-total')).toHaveTextContent('Total Users: 10');
    expect(screen.getByTestId('users-new')).toHaveTextContent('New Users (Last 30 Days): 2');
    expect(screen.getByTestId('users-active')).toHaveTextContent('Active Users (Last 30 Days): 8');

    expect(screen.getByTestId('books-total')).toHaveTextContent('Total Books: 100');
    expect(screen.getByTestId('books-added')).toHaveTextContent('Books Added (Last 30 Days): 5');

    expect(screen.getByTestId('subs-free')).toHaveTextContent('Free Tier: 3');
    expect(screen.getByTestId('subs-standard')).toHaveTextContent('Standard Tier: 1');
    expect(screen.getByTestId('subs-premium')).toHaveTextContent('Premium Tier: 1');
  });

  test('displays an error message if fetching data fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    render(<AdminReportsPage />);
    await waitFor(() => {
      expect(screen.getByText(/Error: Network error/i)).toBeInTheDocument();
    });
  });

   test('displays an error message if response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized',
    } as Response);
    render(<AdminReportsPage />);
    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to fetch reports: Unauthorized/i)).toBeInTheDocument();
    });
  });

  test('displays an error message if no auth token is present', async () => {
    localStorage.removeItem('authToken');
    render(<AdminReportsPage />);
    await waitFor(() => {
      expect(screen.getByText(/Error: Authentication token not found./i)).toBeInTheDocument();
    });
     // Ensure fetch was not called
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
