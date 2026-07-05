import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // All /api/* calls in dev are forwarded to NestJS on :3000
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Static uploads (photos) served by NestJS
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
