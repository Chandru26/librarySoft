import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // string shorthand: '/foo' -> 'http://localhost:4567/foo'
      // '/api': 'http://localhost:3001',
      // Proxying /api to http://localhost:3001/api
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true, // Recommended for most cases, sets the host header to the target URL
        // rewrite: (path) => path.replace(/^\/api/, ''), // Uncomment if your backend doesn't expect /api prefix
      }
    }
  }
})
