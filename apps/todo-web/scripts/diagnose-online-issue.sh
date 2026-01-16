#!/bin/bash

echo "=========================================="
echo "🔍 线上 404 问题诊断脚本"
echo "=========================================="
echo ""

# 切换到 frontend 目录
cd "$(dirname "$0")/.."

# 检查构建产物
echo "📦 步骤 1：检查构建产物"
echo "----------------------------------------"
if [ ! -d "dist" ]; then
  echo "❌ dist 目录不存在，请先运行 npm run build"
  exit 1
fi

echo "✅ dist 目录存在"
echo ""

# 检查 index.html
echo "📄 步骤 2：检查 index.html 资源路径"
echo "----------------------------------------"
echo "静态资源引用："
grep -E "(src=|href=)" dist/index.html | head -5
echo ""

# 检查是否使用绝对路径
if grep -q 'src="/' dist/index.html && grep -q 'href="/' dist/index.html; then
  echo "✅ 所有资源使用绝对路径（正确）"
else
  echo "⚠️  发现相对路径，可能导致多级路由资源加载失败"
fi
echo ""

# 检查 API URL
echo "🌐 步骤 3：检查 API URL 配置"
echo "----------------------------------------"
if grep -rq "api.feitianchengzi.com" dist/assets/*.js; then
  echo "✅ 找到 API 地址配置"
  grep -r "api.feitianchengzi.com" dist/assets/*.js | head -1
else
  echo "⚠️  未找到 API 地址，可能使用了环境变量"
  echo "请检查构建时是否正确设置了 VITE_API_URL"
fi
echo ""

# 检查环境变量配置
echo "🔧 步骤 4：检查环境变量配置"
echo "----------------------------------------"
if [ -f ".env.production" ]; then
  echo "✅ 找到 .env.production 文件："
  cat .env.production
else
  echo "⚠️  未找到 .env.production 文件"
  echo "建议创建该文件并添加："
  echo "  VITE_API_URL=https://api.feitianchengzi.com/workshop/v1"
  echo "  VITE_GATEWAY_URL=https://api.feitianchengzi.com"
fi
echo ""

# 本地模拟测试
echo "🧪 步骤 5：本地模拟静态环境测试"
echo "----------------------------------------"
echo "即将启动 Vite preview 服务器（端口 3000，与开发环境一致）..."
echo "请在浏览器中访问以下地址进行测试："
echo ""
echo "  主页面: http://localhost:3000/"
echo "  邀请链接测试: http://localhost:3000/join/TESTCODE"
echo ""
echo "观察以下几点："
echo "  1. 浏览器地址栏是否保持 /join/TESTCODE"
echo "  2. 页面是否正常加载（或显示登录提示）"
echo "  3. Console 是否有错误信息"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""
echo "=========================================="
echo "按 Enter 键启动预览服务器，或按 Ctrl+C 取消"
read

npm run preview

