import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy vers football-data.org en dev pour contourner CORS
    proxy: {
      '/football-api': {
        target: 'https://api.football-data.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/football-api/, ''),
      },
    },
  },
})
