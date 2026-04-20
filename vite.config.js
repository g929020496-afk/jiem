import { defineConfig } from 'vite'
import vue2 from '@vitejs/plugin-vue2'
import path from 'path'

export default defineConfig({
  plugins: [vue2()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/open-api-proxy': {
        target: 'http://api.d1jiema.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/open-api-proxy/, '')
      }
    }
  }
})
