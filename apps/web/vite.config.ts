import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

const API = process.env.VITE_API_URL ?? 'http://localhost:3000';

// El frontend llama a /api y /socket.io en su mismo origen (localhost:5173); Vite los reenvía al
// API, así la cookie de sesión SameSite=Strict funciona sin configuración adicional.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: API, changeOrigin: false },
      '/socket.io': { target: API, ws: true },
    },
  },
});
