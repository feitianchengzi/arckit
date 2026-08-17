#!/bin/bash

# 复制页面文件到 src/pages
cp app/login/page.tsx src/pages/LoginPage.tsx
cp app/register/page.tsx src/pages/RegisterPage.tsx  
cp app/projects/page.tsx src/pages/ProjectsPage.tsx
cp app/projects/new/page.tsx src/pages/NewProjectPage.tsx
cp app/projects/[id]/ProjectDetailPageClient.tsx src/pages/ProjectDetailPage.tsx
cp app/projects/[id]/members/ProjectMembersPageClient.tsx src/pages/ProjectMembersPage.tsx
cp app/projects/[id]/invite/InviteMemberPageClient.tsx src/pages/InviteMemberPage.tsx
cp app/projects/[id]/tasks/new/NewTaskPageClient.tsx src/pages/NewTaskPage.tsx
cp app/projects/[id]/tasks/[taskId]/TaskDetailPageClient.tsx src/pages/TaskDetailPage.tsx
cp app/tasks/page.tsx src/pages/TasksPage.tsx
cp app/settings/page.tsx src/pages/SettingsPage.tsx
cp app/join/[code]/JoinProjectPageClient.tsx src/pages/JoinProjectPage.tsx

echo "Pages copied successfully!"
