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
  user_password_hash TEXT := '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
  organization_id INTEGER; -- Will hold the SERIAL ID from organizations table
  v_action TEXT;
BEGIN
  -- 1. Create a sample organization and capture its ID
  -- Ensure schema_name is also inserted as it's a NOT NULL column.
  INSERT INTO public.organizations (name, schema_name)
  VALUES (org_name, schema_name)
  ON CONFLICT (name)
  DO UPDATE SET schema_name = EXCLUDED.schema_name
  RETURNING id INTO organization_id;

  -- Fallback if the DO UPDATE did not execute due to no conflict, but we want to ensure organization_id is set
  -- This is more relevant if DO NOTHING was used, but good for robustness.
  IF organization_id IS NULL THEN
    SELECT id INTO organization_id FROM public.organizations WHERE name = org_name AND schema_name = schema_name;
  END IF;

  -- Ensure organization_id is not null before proceeding
  IF organization_id IS NULL THEN
    RAISE EXCEPTION 'Failed to find or create organization: %', org_name;
  END IF;

  -- 2. Create a schema for the organization if it doesn't exist
  EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || quote_ident(schema_name);

  -- 3. Create the users table within the organization's schema
  EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(schema_name) || '.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT ''normal'',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )';
  RAISE NOTICE 'Executed CREATE TABLE IF NOT EXISTS for %.users', schema_name;

  -- 4. Create an index on the email column for faster lookups
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_users_email ON ' || quote_ident(schema_name) || '.users(email)';

  -- 5. Insert or Update sample user
  BEGIN
    EXECUTE 'WITH upsert AS (' ||
    '  INSERT INTO ' || quote_ident(schema_name) || '.users (email, password_hash, role) ' ||
    '  VALUES ($1, $2, $3) ' ||
    '  ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP ' ||
    '  RETURNING xmax ' || -- xmax is 0 for an insert, non-0 for an update
    ') ' ||
    'SELECT CASE WHEN xmax = 0 THEN ''INSERT'' ELSE ''UPDATE'' END FROM upsert'
    INTO v_action
    USING user_email, user_password_hash, 'admin';

    IF v_action = 'INSERT' THEN
      RAISE NOTICE 'User % INSERTED in schema %.', user_email, schema_name;
    ELSIF v_action = 'UPDATE' THEN
      RAISE NOTICE 'User % UPDATED in schema %.', user_email, schema_name;
    ELSE
      RAISE NOTICE 'User % action result was ''%'' in schema %.', user_email, COALESCE(v_action, 'NULL_OR_UNSET'), schema_name;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'SPECIFIC ERROR during user INSERT/UPDATE in %.users: % (SQLSTATE: %)', schema_name, SQLERRM, SQLSTATE;
      -- We are not re-raising here to allow the main script's notices to still fire if possible,
      -- but this warning should be a clear indicator if the user upsert itself failed.
  END; -- End of nested block for user insertion

  -- Using ::TEXT to be safe with NOTICE formatting for UUID
  RAISE NOTICE 'Successfully seeded data for organization: % (ID: %)', org_name, organization_id::TEXT;
  RAISE NOTICE 'Created/Ensured schema: %', schema_name;

EXCEPTION
  WHEN OTHERS THEN
    -- Using ::TEXT for organization_id here too, if it was set.
    RAISE WARNING 'Error during seeding for organization % (ID: %): %', org_name, organization_id::TEXT, SQLERRM;
    RAISE WARNING 'SQLSTATE: %', SQLSTATE;
    -- Re-raise the exception to ensure the script fails if there's an issue
    RAISE;
END $$;
-- End of script. Ensure no characters follow this line.
