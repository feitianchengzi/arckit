/** @type {import('next').NextConfig} */
const nextConfig = {
  // 如果需要导出为静态站点，取消下面的注释
  output: 'export',

  basePath: '/workshop',

  trailingSlash: true,
  
  // 图片优化配置
  images: {
    // 如果使用 output: 'export'，需要设置 unoptimized: true
    unoptimized: true, // 静态导出必须设置为 true
  },
  
  // 严格模式
  reactStrictMode: true,
  
  // 环境变量
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}

module.exports = nextConfig



