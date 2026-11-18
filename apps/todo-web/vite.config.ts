import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 本地联调：.env.local 设置 API_PROXY_TARGET=http://127.0.0.1:8081 指向本机后端；缺省走线上网关
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.API_PROXY_TARGET || 'https://api.feitianchengzi.com'
  const proxy = {
    '/api-proxy': {
      target: proxyTarget,
      changeOrigin: true,
      secure: proxyTarget.startsWith('https://'),
      ws: true,
      rewrite: (path: string) => path.replace(/^\/api-proxy/, ''),
    },
  }
  return {
    plugins: [react()],
    base: '/',
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
      proxy,
    },
    preview: {
      port: 3000, // 使用 3000 端口，与开发环境一致（网关认证需要）
      host: true,
      // 预览环境代理配置（避免 CORS 问题）
      proxy,
    },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
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
