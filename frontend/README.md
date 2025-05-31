# Frontend Setup (React + Vite)

This document provides instructions to set up and run the frontend application.

## Prerequisites

Before you begin, ensure you have the following installed:

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Installation

1.  **Navigate to the frontend directory:**
    If you cloned the main repository, change to the `frontend` directory:
    ```bash
    cd <repository-folder>/frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Environment Configuration

Currently, the frontend application connects to the backend API, which is expected to be running at `http://localhost:3000` by default.

If your backend is running on a different URL, you may need to adjust the API base URL in the frontend code where API calls are made (e.g., in `src/services/`).

For a production environment, you might configure a `.env.production` file if Vite is set up to use it, or use your deployment platform's environment variable settings.

## Running the Development Server

1.  **Start the Vite development server:**
    ```bash
    npm run dev
    ```
    The application will usually be available at `http://localhost:5173` (Vite's default port, but check your terminal output). The server supports Hot Module Replacement (HMR).

### API Proxy Configuration (Development)

When running the frontend with `npm run dev`, the Vite development server is configured to proxy API requests. Any request made to a path starting with `/api` (e.g., `/api/auth/login`) will be automatically forwarded to the backend server, which is expected to be running at `http://localhost:3001`.

This is configured in `vite.config.js`. If your backend server is running on a different port or address during development, you may need to update the `server.proxy.target` setting in `vite.config.js`.

## Building for Production

1.  **Create a production build:**
    ```bash
    npm run build
    ```
    This command will generate a `dist` folder in the `frontend` directory, containing the optimized static assets for deployment.

## Linting

To check the code for linting issues:
```bash
npm run lint
```

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
```
