# Website Project Structure

This directory contains the React application for the website.

## Folder Structure:

- **`public/`**: Contains static assets that are publicly accessible.
- **`src/`**: Contains the source code for the React application.
  - **`assets/`**: For static assets like images, fonts, etc., that are imported into components. (This was created by Vite)
  - **`components/`**: Contains reusable UI components (e.g., buttons, navigation bars, cards). These components are generally not tied to specific routes.
  - **`pages/`**: Contains page-level components. Each file typically represents a distinct route/view in the application (e.g., HomePage, SupportPage).
  - **`App.tsx`**: The main application component, responsible for layout and routing.
  - **`main.tsx`**: The entry point of the application, where the React app is mounted to the DOM.
  - **`index.css`**: Global styles. (Created by Vite)
  - **`App.css`**: App-specific styles. (Created by Vite)
- **`index.html`**: The main HTML file for the React application.
- **`package.json`**: Lists project dependencies and scripts.
- **`vite.config.js`**: Configuration file for Vite.
- **`tsconfig.json`**: TypeScript configuration.
```
