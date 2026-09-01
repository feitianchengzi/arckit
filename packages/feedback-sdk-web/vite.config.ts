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
        '/gateway': {
          target: 'https://api.feitianchengzi.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/gateway/, ''),
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
