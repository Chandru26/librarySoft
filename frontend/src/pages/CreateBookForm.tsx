import React, { useState } from 'react';
import { createBook } from '../services/bookService'; // Adjust path as needed
import { BookFormData, Book, ApiErrorResponse } from '../types'; // Adjust path as needed

interface CreateBookFormProps {
  onBookCreated?: (newBook: Book) => void; // Optional callback after successful creation
}

const CreateBookForm: React.FC<CreateBookFormProps> = ({ onBookCreated }) => {
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    isbn: '',
    cover_image_url: '',
    publication_year: undefined, // Use undefined for optional number fields
    quantity: 1,
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Partial<BookFormData>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'publication_year' || name === 'quantity'
               ? (value === '' ? undefined : Number(value)) // Convert to number or undefined if empty
               : value,
    }));
    if (validationErrors[name as keyof BookFormData]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<BookFormData> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required.';
    if (!formData.author.trim()) newErrors.author = 'Author is required.';
    if (formData.quantity === undefined || formData.quantity < 0) newErrors.quantity = 'Quantity must be a non-negative number.';
    if (formData.publication_year !== undefined && isNaN(formData.publication_year)) newErrors.publication_year = 'Publication year must be a number.';
    // Basic ISBN validation (length, can be improved with checksum for ISBN-10/13)
    if (formData.isbn && !/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/.test(formData.isbn)) {
        newErrors.isbn = 'ISBN is invalid. Should be 10 or 13 digits, optionally with hyphens.';
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
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Authentication token not found. Please login.');
      setIsLoading(false);
      return;
    }

    // Prepare data, ensuring optional fields are handled
    const dataToSubmit: BookFormData = {
        ...formData,
        publication_year: formData.publication_year === undefined || isNaN(formData.publication_year) ? undefined : Number(formData.publication_year),
        quantity: formData.quantity === undefined || isNaN(formData.quantity) ? 1 : Number(formData.quantity),
        isbn: formData.isbn?.trim() === '' ? undefined : formData.isbn?.trim(),
        cover_image_url: formData.cover_image_url?.trim() === '' ? undefined : formData.cover_image_url?.trim(),
    };


    try {
      const newBook = await createBook(dataToSubmit, token);
      setSuccessMessage(`Book "${newBook.title}" created successfully!`);
      if (onBookCreated) {
        onBookCreated(newBook);
      }
      // Reset form
      setFormData({ title: '', author: '', isbn: '', cover_image_url: '', publication_year: undefined, quantity: 1 });
      setValidationErrors({});
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      if (apiError && apiError.message) {
        setError(apiError.message);
      } else {
        setError('An unexpected error occurred while creating the book.');
      }
      console.error('Create book error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Add New Book</h2>
      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
            <strong className="font-bold">Error: </strong>{error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">
            <strong className="font-bold">Success: </strong>{successMessage}
          </div>
        )}

        {/* Title Field */}
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="title"
            id="title"
            required
            value={formData.title}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${validationErrors.title ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
          {validationErrors.title && <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>}
        </div>

        {/* Author Field */}
        <div className="mb-4">
          <label htmlFor="author" className="block text-sm font-medium text-gray-700">Author <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="author"
            id="author"
            required
            value={formData.author}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${validationErrors.author ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
          {validationErrors.author && <p className="text-red-500 text-xs mt-1">{validationErrors.author}</p>}
        </div>

        {/* ISBN Field */}
        <div className="mb-4">
          <label htmlFor="isbn" className="block text-sm font-medium text-gray-700">ISBN</label>
          <input
            type="text"
            name="isbn"
            id="isbn"
            value={formData.isbn}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${validationErrors.isbn ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
          {validationErrors.isbn && <p className="text-red-500 text-xs mt-1">{validationErrors.isbn}</p>}
        </div>
        
        {/* Cover Image URL Field */}
        <div className="mb-4">
          <label htmlFor="cover_image_url" className="block text-sm font-medium text-gray-700">Cover Image URL</label>
          <input
            type="url"
            name="cover_image_url"
            id="cover_image_url"
            value={formData.cover_image_url}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
        </div>

        {/* Publication Year Field */}
        <div className="mb-4">
          <label htmlFor="publication_year" className="block text-sm font-medium text-gray-700">Publication Year</label>
          <input
            type="number"
            name="publication_year"
            id="publication_year"
            value={formData.publication_year === undefined ? '' : formData.publication_year}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${validationErrors.publication_year ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
           {validationErrors.publication_year && <p className="text-red-500 text-xs mt-1">{validationErrors.publication_year}</p>}
        </div>

        {/* Quantity Field */}
        <div className="mb-4">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity <span className="text-red-500">*</span></label>
          <input
            type="number"
            name="quantity"
            id="quantity"
            required
            min="0"
            value={formData.quantity}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${validationErrors.quantity ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
          {validationErrors.quantity && <p className="text-red-500 text-xs mt-1">{validationErrors.quantity}</p>}
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Add Book'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBookForm;
