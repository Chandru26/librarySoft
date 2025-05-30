# Backend Setup

This document provides instructions to set up and run the backend server for the application.

## Prerequisites

Before you begin, ensure you have the following installed:

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [npm](https://www.npmjs.com/) (usually comes with Node.js)
*   [PostgreSQL](https://www.postgresql.org/) (version 12 or higher recommended)

## Installation

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <repository-url>
    cd <repository-folder>/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Environment Configuration

1.  **Copy the example environment file:**
    ```bash
    cp .env.example .env
    ```

2.  **Edit the `.env` file with your specific configuration:**
    *   `DB_USER`: Your PostgreSQL username.
    *   `DB_HOST`: Your PostgreSQL host (e.g., `localhost`).
    *   `DB_DATABASE`: The name of your main database (e.g., `library_system`).
    *   `DB_PASSWORD`: Your PostgreSQL password.
    *   `DB_PORT`: Your PostgreSQL port (e.g., `5432`).
    *   `JWT_SECRET`: A strong, unique secret key for signing JSON Web Tokens.
    *   `PORT`: The port on which the backend server will run (e.g., `3000`).

    **Example `.env`:**
    ```ini
    DB_USER=your_db_user
    DB_HOST=localhost
    DB_DATABASE=library_system
    DB_PASSWORD=your_db_password
    DB_PORT=5432
    JWT_SECRET=yourSuperSecretKey123!
    PORT=3000
    ```

## Database Setup

The database initialization scripts are located in the `db_scripts` directory.

1.  **Create the Database:**
    *   Ensure your PostgreSQL server is running.
    *   If the main database (e.g., `library_system`) does not exist, you need to create it. You can use the `db_scripts/01_create_database.sql` script or run the command manually:
        ```bash
        psql -U your_postgres_superuser -c "CREATE DATABASE library_system;"
        ```
        *(Replace `your_postgres_superuser` and `library_system` if needed)*

2.  **Enable `pgcrypto` Extension (if not already enabled):**
    Connect to your newly created database (e.g., `library_system`) and run:
    ```sql
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    ```
    This is required for UUID generation. You can do this via `psql` or any SQL client.

3.  **Create Core Tables:**
    Connect to your database (e.g., `psql -U your_db_user -d library_system`) and run the following script:
    ```bash
    psql -U your_db_user -d library_system -f db_scripts/02_create_organizations_table.sql
    ```
    *(Replace `your_db_user` and `library_system` as per your `.env` configuration)*

    *Note: The `users` and `books` tables are created dynamically by the application for each organization. `03_create_users_table_template.sql` and `04_create_books_table_template.sql` are templates used by the backend service and should not be run manually during initial setup.*

### 4. Seed Basic Data (Optional)

To populate the database with a sample organization and a test user for verification, you can run the seeding script. This is useful for initial testing without going through the registration process.

Connect to your database and execute:

```bash
psql -U your_db_user -d your_database_name -f db_scripts/06_seed_basic_data.sql
```
*(Replace `your_db_user` and `your_database_name` with your actual database user and name from your `.env` file.)*

This script will:
*   Create an organization named "Test University".
*   Create a schema named `test_university`.
*   Create a user `testuser@example.com` with the password `password123` within the `test_university` schema. This user will have an `admin` role.

### 5. Verifying Seed Data

After running the seeding script (`06_seed_basic_data.sql`), you can verify that the data was created correctly.

1.  **Connect to your PostgreSQL database:**
    ```bash
    psql -U your_db_user -d your_database_name
    ```
    *(Replace `your_db_user` and `your_database_name` as needed.)*

2.  **Check for the organization:**
    ```sql
    SELECT * FROM public.organizations WHERE name = 'Test University';
    ```
    This should return one row for "Test University".

3.  **Check for the schema:**
    In `psql`, you can list schemas:
    ```sql
    \dn
    ```
    You should see `test_university` in the list.

4.  **Check for the user in the organization's schema:**
    ```sql
    SELECT id, email, role FROM test_university.users WHERE email = 'testuser@example.com';
    ```
    This should return one row for the user `testuser@example.com`.

The seeded user `testuser@example.com` (password: `password123`) can be used to log in to the application (once the frontend and backend are running) or to test authenticated API endpoints directly.

## Running the Server

1.  **Start the server in development mode (with auto-reloading):**
    ```bash
    npm run dev
    ```
    The server will typically be available at `http://localhost:3000` (or the `PORT` you specified in `.env`).

2.  **Start the server in production mode:**
    ```bash
    npm start
    ```

## Testing

To run the automated tests:
```bash
npm run test
```
Make sure you have a separate test database configured in `.env.test` (copy from `.env.test.example` and configure) if your tests require a database.
```
