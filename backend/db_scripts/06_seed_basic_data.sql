-- 06_seed_basic_data.sql
-- This script seeds the database with a sample organization and a test user.

-- Ensure pgcrypto extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create a sample organization
INSERT INTO public.organizations (name) VALUES ('Test University') ON CONFLICT (name) DO NOTHING;

-- 2. Define the schema name based on the organization name
-- 'Test University' becomes 'test_university'
DO $$
DECLARE
  org_name TEXT := 'Test University';
  schema_name TEXT := lower(replace(org_name, ' ', '_'));
  user_email TEXT := 'testuser@example.com';
  -- Bcrypt hash for 'password123'.
  -- This is a known example hash for 'password123': $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
  user_password_hash TEXT := '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
BEGIN
  -- 3. Create a schema for the organization if it doesn't exist
  EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || quote_ident(schema_name);

  -- 4. Create the users table within the organization's schema
  -- This structure is based on 03_create_users_table_template.sql
  EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(schema_name) || '.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT ''normal'',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )';

  -- 5. Create an index on the email column for faster lookups
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_users_email ON ' || quote_ident(schema_name) || '.users(email)';

  -- 6. Insert a sample user into the new users table
  EXECUTE 'INSERT INTO ' || quote_ident(schema_name) || '.users (email, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING'
  USING user_email, user_password_hash, 'admin'; -- Assigning 'admin' role

  RAISE NOTICE 'Successfully seeded data for organization: %', org_name;
  RAISE NOTICE 'Created schema: %', schema_name;
  RAISE NOTICE 'Created user: % in schema %', user_email, schema_name;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error during seeding: %', SQLERRM;
END $$;

-- Instructions to run this script (these should already be in backend/README.md):
-- psql -U your_db_user -d your_database_name -f db_scripts/06_seed_basic_data.sql
```
