# Database Initialization Scripts

This directory contains SQL scripts for setting up the PostgreSQL database for the Library System application.

## Scripts

1.  **`01_create_database.sql`**:
    *   **Purpose**: Creates the main database (e.g., `library_system`).
    *   **Usage**: This script should be run once by a PostgreSQL superuser if the database does not already exist.
        ```sql
        -- Example:
        -- psql -U postgres -c "CREATE DATABASE library_system;"
        CREATE DATABASE library_system;
        ```
    *   **Note**: You might need to adjust the database name if you prefer a different one.

2.  **`02_create_organizations_table.sql`**:
    *   **Purpose**: Creates the `organizations` table in the `public` schema. This table stores information about each participating organization or college.
    *   **Usage**: Run this script after the database has been created and you are connected to it.
        ```sql
        -- Connect to the library_system database first: \c library_system
        CREATE TABLE public.organizations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ```

3.  **`03_create_users_table_template.sql`**:
    *   **Purpose**: This script is a **template** for creating the `users` table. It is **not run directly** during initial setup.
    *   **Usage**: The application backend will use this template to dynamically create a new `users` table within a dedicated schema for each new organization that registers. For example, if an organization named "Grand University" signs up, the application will:
        1.  Create a new schema (e.g., `grand_university`).
        2.  Execute the DDL from this template, adapting it to create `grand_university.users`.
    *   **Content**:
        ```sql
        CREATE TABLE users ( -- This will be organization_schema_name.users
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'normal',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ```
    *   **Schema Handling**: The `organization_id` is implicitly managed by placing each organization's users table in its own schema. This provides strong data isolation.

## General Order of Application

1.  Run `01_create_database.sql` (as a superuser, if the database doesn't exist).
2.  Connect to the newly created database.
3.  Run `02_create_organizations_table.sql` to set up the shared organizations table.
4.  `03_create_users_table_template.sql` is used by the application logic when new organizations are onboarded and should not be run manually as part of the initial setup.

## Note on `gen_random_uuid()`

The `users` table template uses `gen_random_uuid()` as the default for the `id` column. This function is available in PostgreSQL if the `pgcrypto` extension is enabled. If it's not enabled in your database, you can enable it by running:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

This typically needs to be done once per database by a superuser or a user with appropriate permissions. It's good practice to ensure this extension is available in your `library_system` database. You can add this command to the beginning of `02_create_organizations_table.sql` or run it separately after creating the database.
