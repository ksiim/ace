import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      'axios': 'axios'
    }
  },
  server: {
    watch: {
      usePolling: true
    },
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    open: false
  },
  css: {
    preprocessorOptions: {
      scss: {}
    }
  }
})