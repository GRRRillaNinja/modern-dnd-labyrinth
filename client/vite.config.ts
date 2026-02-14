import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  envDir: './',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    host: '0.0.0.0', // Allow access from network
    port: 3000,
    // open: true, // Disabled for production
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disabled for production to protect source code
  },
});
