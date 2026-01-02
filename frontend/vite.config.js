import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // No base path needed for Vercel - it serves from root
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
