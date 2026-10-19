import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-sumopod': {
        target: 'https://ai.sumopod.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-sumopod/, '')
      }
    }
  }
})
