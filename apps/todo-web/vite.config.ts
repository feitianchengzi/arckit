import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
    // 开发环境代理配置（避免 CORS 问题）
    proxy: {
      '/api-proxy': {
        target: 'https://api.feitianchengzi.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, ''),
      },
    },
  },
  preview: {
    port: 4173,
    // 预览环境代理配置（避免 CORS 问题）
    proxy: {
      '/api-proxy': {
        target: 'https://api.feitianchengzi.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['zustand', '@tanstack/react-query', 'axios'],
        },
      },
    },
  },
})

