#!/bin/bash

# 批量替换所有页面文件中的导入和路由

for file in *.tsx; do
  echo "Processing $file..."
  
  # 移除 'use client' 指令
  sed -i '' "/^'use client'$/d" "$file"
  sed -i '' '/^"use client"$/d' "$file"
  
  # 替换 Next.js 路由导入为 React Router
  sed -i '' "s/import { useRouter } from 'next\/navigation'/import { useNavigate, useParams, useSearchParams } from 'react-router-dom'/g" "$file"
  sed -i '' "s/import { useRouter, useSearchParams } from 'next\/navigation'/import { useNavigate, useParams, useSearchParams } from 'react-router-dom'/g" "$file"
  sed -i '' 's/from '\''next\/navigation'\''/from '\''react-router-dom'\''/g' "$file"
  
  # 替换 router 变量为 navigate
  sed -i '' 's/const router = useRouter()/const navigate = useNavigate()\n  const params = useParams()\n  const [searchParams] = useSearchParams()/g' "$file"
  
  # 替换 router.push 为 navigate
  sed -i '' 's/router\.push(/navigate(/g' "$file"
  sed -i '' 's/router\.replace(/navigate(, { replace: true })/g' "$file"
  
  # 替换动态路由参数
  sed -i '' 's/params\.id/params.id/g' "$file"
  sed -i '' 's/params\.code/params.code/g' "$file"
  sed -i '' 's/params\.taskId/params.taskId/g' "$file"
done

echo "All files processed!"
