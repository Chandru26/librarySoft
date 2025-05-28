-- This script serves as a template for creating the users table.
-- It will be executed for each new organization within its own dedicated schema.
-- For example, if a new organization 'hawking_university' is created,
-- this script will be run to create a table named 'hawking_university.users'.
-- The organization_id is implicitly handled by this schema separation.

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'normal', -- e.g., 'admin', 'normal_user', 'librarian'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Note: The actual schema name will replace 'organization_schema_name'
-- when the application dynamically creates the schema and this table.
-- Example: CREATE TABLE organization_schema_name.users (...)

-- It's also recommended to create an index on the email column for faster lookups.
-- CREATE INDEX idx_users_email ON users(email);
-- This index creation should also be part of the dynamic schema setup process.
