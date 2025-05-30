# Full Stack Library Application

This project is a full-stack application featuring a React frontend, a Node.js/Express backend, and a PostgreSQL database. It simulates a library system where different organizations (e.g., colleges) can manage their own users and book catalogs.

## Architecture Overview

*   **Frontend**: A single-page application built with React and Vite. It interacts with the backend API to display and manage data.
*   **Backend**: A RESTful API built with Node.js, Express, and PostgreSQL. It handles business logic, data storage, and user authentication. Each organization's data (users, books) is isolated within its own database schema.
*   **Database**: PostgreSQL is used for data persistence. A main database stores shared information like organizations, while separate schemas within that database hold data specific to each organization.

## Project Structure

```
.
├── backend/         # Node.js/Express backend application
│   ├── src/
│   ├── db_scripts/  # SQL scripts for database setup
│   ├── .env.example # Example environment variables for backend
│   └── README.md    # Backend setup instructions
├── frontend/        # React/Vite frontend application
│   ├── src/
│   └── README.md    # Frontend setup instructions
└── README.md        # This file (main project overview)
```

## Setup Instructions

Detailed setup instructions for each part of the application can be found in their respective README files:

*   **[Backend Setup](./backend/README.md)**: Instructions for setting up the Node.js server and PostgreSQL database.
*   **[Frontend Setup](./frontend/README.md)**: Instructions for setting up the React client.

Please follow the instructions in the linked READMEs to get the application up and running.

```