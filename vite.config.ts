import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  // Tauri 期望固定端口
  server: { port: 1420, strictPort: true },
  clearScreen: false,
  build: { target: 'esnext' },
})
