# 线上 404 问题诊断报告

## 诊断时间
2026-01-16

## 测试环境
- **网站**: https://workshop.feitianchengzi.com/
- **工具**: Chrome DevTools
- **测试方法**: 真实浏览器测试

---

## 测试结果

### ✅ 测试 1：主页加载（正常）

**URL**: `https://workshop.feitianchengzi.com/`

**结果**: ✅ **成功**

- 自动重定向到 `/login?redirect=%2F`（认证守卫正常工作）
- 所有静态资源加载成功：
  - ✅ `/assets/index-B70Qae8x.js` - 200
  - ✅ `/assets/react-vendor-BDjJ6pKf.js` - 200
  - ✅ `/assets/ui-vendor-5aoJHJQD.js` - 200
  - ✅ `/assets/index-D7LuqJED.css` - 200
- 登录页面正常显示
- CSS 样式完整加载
- UI 功能正常

**截图**: 登录页面正常显示，包含完整的表单和样式

---

### ❌ 测试 2：邀请链接（失败）

**URL**: `https://workshop.feitianchengzi.com/join/DE5EC737C37047B5BC819A4F579DC10E`

**结果**: ❌ **失败 - 404 错误**

#### 关键发现

1. ✅ **地址栏保持不变**
   - 浏览器地址栏显示：`/join/DE5EC737C37047B5BC819A4F579DC10E`
   - 没有发生 HTTP 重定向（301/302）

2. ❌ **返回 404 错误**
   - HTTP 状态码：`404`
   - 响应类型：`application/xml`（不是 `text/html`）
   - 服务器标识：`AliyunOSS`

3. ❌ **OSS 错误响应**
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <Error>
     <Code>NoSuchKey</Code>
     <Message>The specified key does not exist.</Message>
     <RequestId>696A579AF357BB36324A65CA</RequestId>
     <HostId>workshop.feitianchengzi.com</HostId>
     <Key>join/DE5EC737C37047B5BC819A4F579DC10E</Key>
   </Error>
   ```

#### 网络请求详情

```
Request URL: https://workshop.feitianchengzi.com/join/DE5EC737C37047B5BC819A4F579DC10E
Request Method: GET
Status Code: 404
Response Type: application/xml
Server: AliyunOSS
X-OSS-Request-ID: 696A579AF357BB36324A65CA
```

**截图**: 显示 XML 格式的 OSS 错误页面

---

## 问题分析

### 问题根本原因

**确认**: OSS 的"错误文档"配置**没有生效**或**没有配置**

### 问题流程

**当前实际流程**：
```
1. 用户访问: /join/DE5EC737C37047B5BC819A4F579DC10E
2. OSS 尝试查找文件: join/DE5EC737C37047B5BC819A4F579DC10E
3. 文件不存在
4. OSS 返回: 404 错误（XML 格式）❌
5. 浏览器显示: OSS 错误页面
```

**期望正确流程**：
```
1. 用户访问: /join/DE5EC737C37047B5BC819A4F579DC10E
2. OSS 尝试查找文件: join/DE5EC737C37047B5BC819A4F579DC10E
3. 文件不存在
4. OSS 返回: index.html（200）✅
5. 浏览器加载 index.html
6. React Router 匹配路由 /join/:code
7. 显示: JoinProjectPage 或登录提示
```

### 为什么不是代码问题？

我们已经确认：

1. ✅ **构建配置正确**
   - `vite.config.ts`: `base: '/'`
   - 所有资源使用绝对路径（`/assets/...`）

2. ✅ **路由配置正确**
   - `App.tsx`: `<Route path="/join/:code" element={<JoinProjectPage />} />`
   - 路由可以匹配 `/join/` 加任意邀请码

3. ✅ **没有 HTTP 重定向问题**
   - 浏览器地址栏保持不变
   - 不是 301/302 重定向

4. ✅ **主页访问正常**
   - 所有静态资源正确加载
   - React 应用正常运行

**结论**: 代码和构建配置都是正确的，问题在于 OSS 的配置。

---

## 解决方案

### 方案 1：配置 OSS 错误文档（推荐）

#### 步骤

1. **登录阿里云 OSS 控制台**
   - 网址: https://oss.console.aliyun.com/

2. **选择 Bucket**
   - 找到并点击: `workshop.feitianchengzi.com`（或对应的 bucket 名称）

3. **进入静态页面设置**
   - 左侧菜单: **基础设置** → **静态页面**

4. **配置错误文档**
   ```
   默认首页（Index Document）: index.html
   错误文档（Error Document）: index.html  ← 关键！
   ```

5. **保存配置**
   - 点击"保存"按钮
   - 等待 1-2 分钟配置生效

6. **清除缓存并测试**
   - 清除浏览器缓存（或使用无痕模式）
   - 重新访问: `https://workshop.feitianchengzi.com/join/测试码`

#### 注意事项

- ⚠️ **必须是"错误文档"，不是"重定向规则"**
  - 错误文档 = 内部重写（地址栏不变）✅
  - 重定向规则 = HTTP 重定向（地址栏变化）❌

- ⚠️ **文件名区分大小写**
  - 正确: `index.html`（小写）
  - 错误: `Index.html`、`INDEX.HTML`

- ⚠️ **只填写文件名，不要添加路径**
  - 正确: `index.html`
  - 错误: `/index.html`、`dist/index.html`

---

### 方案 2：检查 CDN 配置

如果在 OSS 前面使用了 CDN（如阿里云 CDN、Cloudflare）：

1. **检查 CDN 缓存**
   - 404 响应可能被 CDN 缓存
   - 需要清除 `/join/*` 路径的缓存

2. **刷新 CDN 缓存**
   - 登录 CDN 控制台
   - 刷新目录: `/join/`
   - 或刷新整个站点

3. **检查 CDN 配置**
   - 确认 CDN 没有覆盖 OSS 的错误页配置
   - 确认 CDN 的"回源规则"正确

---

### 方案 3：验证 Bucket 基本设置

检查以下配置项：

1. **Bucket 权限**
   - 读写权限: 公共读
   - 确保匿名用户可以读取文件

2. **静态网站托管**
   - 状态: 已开启
   - 默认首页: `index.html`
   - 错误文档: `index.html`

3. **自定义域名**
   - 绑定域名: `workshop.feitianchengzi.com`
   - CNAME 记录: 正确指向 OSS bucket

4. **访问方式**
   - 确认使用自定义域名访问
   - 不使用 OSS 默认域名（可能有限制）

---

## 对比分析

| 项目 | 本地开发 (localhost:3000) | 线上 OSS |
|------|--------------------------|---------|
| 主页访问 (`/`) | ✅ 正常 | ✅ 正常 |
| 静态资源加载 | ✅ 正常 | ✅ 正常 |
| 登录页 (`/login`) | ✅ 正常 | ✅ 正常 |
| 邀请链接 (`/join/xxx`) | ✅ 正常 | ❌ 404 错误 |
| SPA Fallback | ✅ Vite 内置 | ❌ 未配置 |
| 地址栏行为 | 保持不变 | 保持不变 |
| 错误类型 | - | XML (NoSuchKey) |

---

## 确认清单

### ✅ 已确认正确的项

- [x] 代码配置正确（`vite.config.ts`: `base: '/'`）
- [x] 构建产物正确（资源路径为绝对路径 `/assets/...`）
- [x] React 路由配置正确（`path="/join/:code"`）
- [x] 没有 HTTP 重定向问题（地址栏保持不变）
- [x] 主页和静态资源访问正常
- [x] 本地预览正常（`npm run preview`）

### ❌ 需要修复的项

- [ ] OSS "错误文档" 配置缺失或未生效
- [ ] 可能存在 CDN 缓存问题（如果使用了 CDN）

---

## 配置验证步骤

完成配置后，按以下步骤验证：

1. **清除缓存**
   - 清除浏览器缓存
   - 或使用无痕/隐私模式

2. **测试主页**
   - 访问: `https://workshop.feitianchengzi.com/`
   - 应该能正常显示登录页

3. **测试邀请链接**
   - 访问: `https://workshop.feitianchengzi.com/join/TESTCODE`
   - 应该显示登录提示或"加载中"
   - **不应该**显示 XML 错误

4. **检查浏览器控制台**
   - 打开 F12 开发者工具
   - Network 标签: 检查 `/join/TESTCODE` 请求
   - 状态码应该是 **200**（不是 404）
   - 响应类型应该是 **text/html**（不是 application/xml）

5. **检查页面内容**
   - Console 标签: 不应该有 JavaScript 错误
   - 页面应该正常显示（认证提示或加载动画）

---

## 常见问题

### Q1: 配置后还是 404？

**A**: 
1. 等待 1-2 分钟配置生效
2. 清除浏览器缓存（Ctrl+Shift+Delete）
3. 检查 CDN 是否有缓存（刷新 CDN）
4. 检查配置是否真的保存成功

### Q2: 地址栏变成 /index.html 了？

**A**: 
说明配置了"重定向规则"而不是"错误文档"
- 删除重定向规则
- 改用"错误文档"配置

### Q3: 本地 preview 也不行？

**A**: 
1. 检查 `vite.config.ts` 的 `base` 配置
2. 重新构建: `npm run build`
3. 检查路由配置

### Q4: 只有邀请链接 404，其他都正常？

**A**: 
这就是当前的问题，说明 OSS 的"错误文档"没有配置或没有生效

---

## 技术说明

### SPA (Single Page Application) 路由原理

**传统多页应用**：
- `/page1` → 服务器返回 `page1.html`
- `/page2` → 服务器返回 `page2.html`

**SPA 应用**：
- 所有路由都加载同一个 `index.html`
- JavaScript（React Router）根据 URL 决定显示哪个页面

**静态文件托管的 SPA 支持**：
- 用户访问 `/join/xxx`
- 服务器找不到 `join/xxx` 文件
- 服务器应该返回 `index.html`（不是 404）
- React Router 读取 URL `/join/xxx` 并匹配路由

### OSS 错误文档 vs 重定向规则

| 特性 | 错误文档 | 重定向规则 |
|-----|---------|-----------|
| 地址栏 | 保持不变 | 变化（跳转） |
| HTTP 状态码 | 200 | 301/302 |
| 响应内容 | index.html | 重定向响应 |
| SPA 支持 | ✅ 完美支持 | ❌ 路由丢失 |
| React Router | ✅ 可读取路径 | ❌ 丢失路径信息 |

---

## 总结

### 问题确认

**线上 `/join/xxx` 返回 404 的原因**：
- OSS 的"错误文档"配置没有生效
- OSS 直接返回 404 错误（XML 格式）
- 没有返回 `index.html`

### 解决方案

1. **检查 OSS 控制台**
   - 基础设置 → 静态页面
   - 错误文档: `index.html`

2. **保存并等待生效**
   - 等待 1-2 分钟
   - 清除缓存后测试

3. **验证配置**
   - 访问 `/join/TESTCODE`
   - 应该显示登录提示或加载中
   - 不应该显示 XML 错误

### 代码无需修改

- ✅ 代码配置完全正确
- ✅ 构建产物没有问题
- ✅ 路由配置正确
- ⚠️ 只需要修复 OSS 配置

---

## 附录：完整测试日志

### 测试 1: 主页
```
URL: https://workshop.feitianchengzi.com/
Status: 200 (重定向到 /login?redirect=%2F)
Resources:
  - /assets/index-B70Qae8x.js (200)
  - /assets/react-vendor-BDjJ6pKf.js (200)
  - /assets/ui-vendor-5aoJHJQD.js (200)
  - /assets/index-D7LuqJED.css (200)
Result: ✅ Success
```

### 测试 2: 邀请链接
```
URL: https://workshop.feitianchengzi.com/join/DE5EC737C37047B5BC819A4F579DC10E
Status: 404
Content-Type: application/xml
Server: AliyunOSS
Response: XML Error (NoSuchKey)
Result: ❌ Failed
```

---

**报告生成时间**: 2026-01-16  
**诊断工具**: Chrome DevTools via MCP  
**建议优先级**: 🔴 高（影响核心功能）

