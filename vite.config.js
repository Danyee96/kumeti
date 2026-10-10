import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the build works in public_html or any sub-folder on Hostinger.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
})
