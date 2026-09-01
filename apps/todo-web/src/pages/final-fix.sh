#!/bin/bash

# 修复剩余的导入和类型错误

# 移除 useRouter 导入
sed -i '' 's/, useRouter//g' *.tsx
sed -i '' '/import.*useRouter.*from.*react-router-dom/d' *.tsx

# 移除未使用的导入
sed -i '' 's/, useParams, useSearchParams/, useParams/g' ProjectsPage.tsx
sed -i '' 's/, useParams, useSearchParams/, useParams/g' SettingsPage.tsx
sed -i '' 's/, useParams, useSearchParams/, useParams/g' TasksPage.tsx

# 修复 router 变量名
sed -i '' 's/router\./navigate(/g' *.tsx

# 修复 hooks 类型（接受 string）
sed -i '' 's/useProject(projectId)/useProject(String(projectId))/g' *.tsx
sed -i '' 's/useTaskList(projectId)/useTaskList(String(projectId))/g' *.tsx
sed -i '' 's/useUpdateTaskStatus(projectId)/useUpdateTaskStatus(String(projectId))/g' *.tsx
sed -i '' 's/useProjectMembers(projectId)/useProjectMembers(String(projectId))/g' *.tsx
sed -i '' 's/useRemoveMember(projectId)/useRemoveMember(String(projectId))/g' *.tsx
sed -i '' 's/useUpdateMemberRole(projectId)/useUpdateMemberRole(String(projectId))/g' *.tsx
sed -i '' 's/useTask(projectId, taskId)/useTask(String(projectId), String(taskId))/g' *.tsx
sed -i '' 's/useUpdateTask(projectId, taskId)/useUpdateTask(String(projectId), String(taskId))/g' *.tsx
sed -i '' 's/useDeleteTask(projectId, taskId)/useDeleteTask(String(projectId), String(taskId))/g' *.tsx
sed -i '' 's/useTaskHistory(projectId, taskId)/useTaskHistory(String(projectId), String(taskId))/g' *.tsx
sed -i '' 's/useSubtasks(projectId, taskId)/useSubtasks(String(projectId), String(taskId))/g' *.tsx
sed -i '' 's/useCreateTask(projectId)/useCreateTask(String(projectId))/g' *.tsx

echo "Final fixes applied!"
