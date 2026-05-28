import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        auth: resolve(__dirname, 'app/auth.html'),
        home: resolve(__dirname, 'app/home.html'),
        guest: resolve(__dirname, 'guest/guest.html'),
      },
    },
  },
})
