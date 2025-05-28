-- This script creates the organizations table in the public schema.
-- This table holds general information about each organization/college.
-- It also stores the schema name dedicated to that organization.

-- Ensure pgcrypto extension is available for gen_random_uuid() if not already enabled.
-- This is generally good practice if other parts of the system might need it,
-- though the users table template is the primary user in this context.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    schema_name VARCHAR(63) NOT NULL UNIQUE, -- To store the dynamically generated schema name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- It's also a good idea to add an index to schema_name if you query by it often,
-- though with name being unique, it might be redundant if you always have the name.
-- CREATE INDEX idx_organizations_schema_name ON public.organizations(schema_name);
