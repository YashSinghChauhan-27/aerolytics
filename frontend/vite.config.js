import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/ - Reload Trigger
export default defineConfig({
  plugins: [react()],
})
