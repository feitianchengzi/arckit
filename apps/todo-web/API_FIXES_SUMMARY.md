# API 路由修复总结

## 🔧 已修复的问题

### 1. 任务 API
- ✅ `GET /user/tasks?project_id={id}` - 修复：使用查询参数
- ✅ `POST /user/tasks` - 修复：请求体包含 project_id
- ✅ `PUT /user/tasks/:id` - 修复：路径参数是任务ID
- ✅ `DELETE /user/tasks` - 修复：批量删除，请求体包含 task_ids

### 2. 项目 API
- ✅ `GET /user/projects` - 修复：处理后端返回的 {projects: [], total: 0} 格式
- ✅ 获取项目详情：从项目列表中查找（后端无单独接口）

### 3. 邀请 API
- ✅ `POST /user/projects/:id/invitations` - 修复：参数名 expires_in（不是 expires_in_hours）
- ✅ `POST /user/projects/join` - 修复：请求体 {invite_code: string}

## ⚠️ 已知限制

- 后端不支持获取邀请列表和删除邀请
- 后端不支持任务历史接口
- 任务详情需要从列表查找（性能稍差）

## ✅ 准备测试

所有 API 路由已修复，可以开始测试！
