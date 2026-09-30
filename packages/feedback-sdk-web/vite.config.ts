import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Shell-provided values take precedence so the isolated V2 build cannot
  // accidentally inherit the V1 `/sdk` base from an env file.
  const base = process.env.VITE_PUBLIC_BASE || env.VITE_PUBLIC_BASE || '/'
  const buildId = process.env.VITE_BUILD_ID || env.VITE_BUILD_ID || new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)

  return {
    plugins: [react()],
    base,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3100,
      host: true,
      open: false,
      proxy: {
        // 本地开发演示：指向本地 workshop-api，并模拟网关注入用户身份头。
        // 如需连回生产网关，设置 VITE_DEV_GATEWAY_TARGET=https://api.feitianchengzi.com。
        '/gateway': {
          target: process.env.VITE_DEV_GATEWAY_TARGET || 'http://localhost:8081',
          changeOrigin: true,
          secure: true,
          // Agent 问答走 OpenHands + DeepSeek，同步响应可达 1-2 分钟，
          // 放宽代理超时避免长请求被中途断开。
          timeout: 300000,
          proxyTimeout: 300000,
          rewrite: (path) => path.replace(/^\/gateway/, ''),
          configure: (proxy) => {
            const demoUserID = process.env.VITE_DEV_DEMO_USER_ID || '11111111-1111-1111-1111-111111111111'
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('X-User-ID', demoUserID)
            })
          },
        },
      },
    },
    preview: {
      port: 3100,
      host: true,
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name]-${buildId}-[hash].js`,
          chunkFileNames: `assets/[name]-${buildId}-[hash].js`,
          assetFileNames: `assets/[name]-${buildId}-[hash][extname]`,
        },
      },
    },
  }
})
