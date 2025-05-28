-- This script serves as a template for creating the books table.
-- It will be executed for an organization within its own dedicated schema
-- when the first book is attempted to be added for that organization,
-- if the table does not already exist.
-- For example, if organization 'hawking_university' adds a book,
-- this script might run to create 'hawking_university.books'.

CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Using UUID for consistency with users table
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE, -- International Standard Book Number, can be NULL
    cover_image_url TEXT, -- URL to the book's cover image, NULLable
    publication_year INTEGER, -- Year of publication, NULLable
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity >= 0), -- Number of copies available
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Note: The actual schema name will replace 'organization_schema_name'
-- when the application dynamically creates the schema and this table.
-- Example: CREATE TABLE organization_schema_name.books (...)

-- It's also recommended to create indexes for frequently queried columns,
-- e.g., title and author, if performance becomes an issue.
-- Example (to be adapted by application logic if needed):
-- CREATE INDEX idx_books_title ON organization_schema_name.books(title);
-- CREATE INDEX idx_books_author ON organization_schema_name.books(author);

-- A function to update the updated_at column automatically on row update.
-- This function should be created once per database or in the public schema.
-- If not already present from other table setups (like users), it can be created.
-- Example:
-- CREATE OR REPLACE FUNCTION public.update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--    NEW.updated_at = NOW();
--    RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- Then, a trigger would be created for the books table (dynamically by the app):
-- CREATE TRIGGER update_books_updated_at
-- BEFORE UPDATE ON organization_schema_name.books
-- FOR EACH ROW
-- EXECUTE FUNCTION public.update_updated_at_column();
