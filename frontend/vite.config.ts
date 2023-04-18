import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import eslintPlugin from 'vite-plugin-eslint';

export default defineConfig({
  plugins: [
    react(),
    eslintPlugin({
      cache: false,
      include: ['./src/**/*.js', './src/**/*.jsx'],
      exclude: []
    })
  ],

  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    // testMatch: ['./tests/**/*.test.tsx'],
    globals: true
  }
});
