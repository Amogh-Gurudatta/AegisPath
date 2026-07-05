import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf')) {
              return 'jspdf';
            }
            if (id.includes('html2canvas')) {
              return 'html2canvas';
            }
            if (id.includes('reactflow') || id.includes('@reactflow')) {
              return 'reactflow';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
