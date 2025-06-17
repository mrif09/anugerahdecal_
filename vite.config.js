import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {visualizer} from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), visualizer()],
  build:{
    rollupOptions:{
      output:{
        manualChunks: {
          firebase:['@firebase/app', '@firebase/auth', '@firebase/firestore'],
          react:['react','react-dom'],
          recharts:['recharts']
        }
      }
    }
  }
})