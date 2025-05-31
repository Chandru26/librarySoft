-- 06_seed_basic_data.sql
-- This script seeds the database with a sample organization and a test user.

-- Ensure pgcrypto extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  org_name TEXT := 'Test University';
  -- Define schema_name based on organization name, ensuring it's a valid identifier
  schema_name TEXT := lower(regexp_replace(org_name, '[^a-zA-Z0-9_]+', '_', 'g'));
  user_email TEXT := 'testuser@example.com';
  -- Bcrypt hash for 'password123'.
  -- This is a known example hash for 'password123': $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
  user_password_hash TEXT := '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
  organization_id UUID;
BEGIN
  -- 1. Create a sample organization and capture its ID
  -- Ensure schema_name is also inserted as it's a NOT NULL column.
  INSERT INTO public.organizations (name, schema_name)
  VALUES (org_name, schema_name)
  ON CONFLICT (name) DO UPDATE SET schema_name = EXCLUDED.schema_name -- Or simply DO NOTHING if name collision means it's already set up
  RETURNING id INTO organization_id;

  -- If ON CONFLICT DO NOTHING and it conflicted, organization_id might be null.
  -- Optionally, select it if it's null:
  IF organization_id IS NULL THEN
    SELECT id INTO organization_id FROM public.organizations WHERE name = org_name;
  END IF;

  -- 2. Create a schema for the organization if it doesn't exist
  EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || quote_ident(schema_name);

  -- 3. Create the users table within the organization's schema
  -- This structure is based on 03_create_users_table_template.sql
  EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(schema_name) || '.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT ''normal'',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )';

  -- 4. Create an index on the email column for faster lookups
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_users_email ON ' || quote_ident(schema_name) || '.users(email)';

  -- 5. Insert a sample user into the new users table
  EXECUTE 'INSERT INTO ' || quote_ident(schema_name) || '.users (email, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING'
  USING user_email, user_password_hash, 'admin'; -- Assigning 'admin' role

  RAISE NOTICE 'Successfully seeded data for organization: % (ID: %)', org_name, organization_id;
  RAISE NOTICE 'Created/Ensured schema: %', schema_name;
  RAISE NOTICE 'Created/Ensured user: % in schema %', user_email, schema_name;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error during seeding for organization %: %', org_name, SQLERRM;
    RAISE WARNING 'SQLSTATE: %', SQLSTATE;
END $$;
```
