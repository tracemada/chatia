import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    allowedHosts: [
      'localhost',
      'chat.tracemada.net',
    ]
  },
  preview: {
    host: true,
    port: 3000,
  },
});
