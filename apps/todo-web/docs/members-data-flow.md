# 项目成员信息数据流说明

## 📋 问题

从项目详情页面进入某个待办详情页面后，项目成员信息是否可以带过去？如何获取？是否保存在内存或本地？

## 🔍 当前实现机制

### 1. 数据获取方式

**项目详情页面** (`ProjectDetailPage.tsx`):
```typescript
const { data: members } = useProjectMembers(String(projectId))
```

**待办详情页面** (`TaskDetailPage.tsx`):
```typescript
const { data: members } = useProjectMembers(projectId)
```

两者都使用相同的 Hook：`useProjectMembers(projectId)`

### 2. React Query 缓存机制

**Query Key**:
```typescript
queryKey: ['projects', projectId, 'members']
```

**缓存行为**:
- ✅ **自动复用缓存**：如果两个页面使用相同的 `queryKey`，React Query 会自动复用缓存数据
- ✅ **内存缓存**：数据保存在 React Query 的内存缓存中（不是 localStorage）
- ⚠️ **默认过期时间**：没有设置 `staleTime`，使用默认值 `0`（立即过期）

### 3. 当前配置

**React Query 全局配置** (`main.tsx`):
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,  // 窗口聚焦时不重新获取
      // 没有设置 staleTime，默认值为 0（立即过期）
    },
  },
})
```

**useProjectMembers Hook** (`useProjects.ts`):
```typescript
export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: async () => {
      const members = await projectsApi.getMembers(projectId)
      return members
    },
    enabled: !!projectId && isAuthenticated,
    // 没有设置 staleTime，使用默认值 0
  })
}
```

## ✅ 答案

### 成员信息可以带过去吗？

**可以，但有限制**：

1. ✅ **如果缓存未过期**：
   - 从项目详情页面进入待办详情页面时
   - React Query 会直接使用内存中的缓存数据
   - **不会重新请求 API**
   - 数据立即可用

2. ⚠️ **如果缓存已过期**：
   - React Query 会在后台重新获取数据
   - 待办详情页面可能需要等待数据加载完成

3. ⚠️ **当前问题**：
   - 默认 `staleTime: 0`，意味着数据立即过期
   - 即使有缓存，React Query 也会在后台重新获取
   - 可能导致不必要的 API 请求

### 数据存储位置

- ✅ **内存缓存**：React Query 的内存缓存（应用运行期间有效）
- ❌ **不是 localStorage**：不会保存到本地存储
- ❌ **不是 sessionStorage**：不会保存到会话存储
- ✅ **页面刷新后失效**：刷新页面后缓存会清空

## 💡 优化建议

### 方案1：设置 staleTime（推荐）

**优点**：
- 减少不必要的 API 请求
- 提升用户体验（数据立即可用）
- 简单易实现

**实现**：
```typescript
export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: async () => {
      const members = await projectsApi.getMembers(projectId)
      return members
    },
    enabled: !!projectId && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5分钟内认为数据新鲜，直接使用缓存
  })
}
```

### 方案2：使用 React Query 的 prefetch

**优点**：
- 可以在导航前预加载数据
- 确保数据可用

**实现**：
```typescript
// 在项目详情页面，点击待办时预加载成员信息
const queryClient = useQueryClient()

const handleTaskClick = (taskId: string) => {
  // 预加载成员信息
  queryClient.prefetchQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: () => projectsApi.getMembers(projectId),
  })
  
  // 导航到待办详情页面
  navigate(`/projects/${projectId}/tasks/${taskId}`)
}
```

### 方案3：通过路由状态传递（不推荐）

**缺点**：
- 需要修改路由结构
- 数据传递复杂
- 不符合 React Query 的最佳实践

## 📊 数据流图

```
项目详情页面
    ↓
useProjectMembers(projectId)
    ↓
React Query 缓存 (queryKey: ['projects', projectId, 'members'])
    ↓
    ├─→ 缓存命中 → 直接使用缓存数据 ✅
    │
    └─→ 缓存未命中/过期 → 调用 API → 更新缓存 → 返回数据
                                    ↓
                            待办详情页面
                                    ↓
                        useProjectMembers(projectId)
                                    ↓
                        使用相同的 queryKey
                                    ↓
                        复用缓存数据 ✅
```

## 🎯 总结

### 当前状态

- ✅ **成员信息可以带过去**：通过 React Query 的内存缓存
- ✅ **自动复用**：相同的 queryKey 会自动复用缓存
- ⚠️ **可能重新请求**：由于 `staleTime: 0`，可能会在后台重新获取

### 推荐优化

1. **设置 `staleTime`**：5-10 分钟内认为数据新鲜
2. **保持当前架构**：使用 React Query 缓存机制，无需额外存储
3. **不需要 localStorage**：成员信息变化不频繁，内存缓存足够

### 最佳实践

- ✅ 使用 React Query 的内存缓存（当前实现）
- ✅ 设置合理的 `staleTime`（建议添加）
- ❌ 不要使用 localStorage（数据可能过期）
- ❌ 不要通过路由状态传递（复杂且不必要）

