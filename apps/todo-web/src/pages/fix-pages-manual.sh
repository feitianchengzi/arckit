#!/bin/bash

# 修复所有页面文件的导出和函数名

for file in *.tsx; do
  # 移除 Client 后缀的函数名
  sed -i '' 's/export function \([A-Z][a-zA-Z]*\)PageClient/export default function \1Page/g' "$file"
  
  # 移除重复的 params 声明
  sed -i '' '0,/const params = useParams()/!{/const params = useParams()/d;}' "$file"
  sed -i '' '0,/const \[searchParams\] = useSearchParams()/!{/const \[searchParams\] = useSearchParams()/d;}' "$file"
  
  # 修复 projectId 类型
  sed -i '' 's/const projectId = params\.id as string/const projectId = Number(params.id!)/g' "$file"
  sed -i '' 's/const inviteCode = params\.code as string/const inviteCode = params.code!/g' "$file"
  sed -i '' 's/const taskId = params\.taskId as string/const taskId = Number(params.taskId!)/g' "$file"
done

echo "Manual fixes applied!"
