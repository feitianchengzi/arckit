import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_PUBLIC_BASE || '/'
  const buildId = env.VITE_BUILD_ID || new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)

  return {
    plugins: [react()],
    base,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: true, // 允许通过局域网IP访问（手机可以连接）
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
      port: 3000, // 使用 3000 端口，与开发环境一致（网关认证需要）
      host: true,
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
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name]-${buildId}-[hash].js`,
          chunkFileNames: `assets/[name]-${buildId}-[hash].js`,
          assetFileNames: `assets/[name]-${buildId}-[hash][extname]`,
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'tiptap-vendor': [
              '@tiptap/react',
              '@tiptap/starter-kit',
              '@tiptap/extension-link',
              '@tiptap/extension-mention',
              '@tiptap/extension-placeholder',
              '@tiptap/suggestion'
            ],
            'utils-vendor': [
              'axios',
              'zustand',
              '@tanstack/react-query',
              'zod',
              'i18next',
              'react-i18next',
              'react-hook-form'
            ],
            'ui-vendor': ['@headlessui/react'],
          },
        },
      },
    },
  }
})
