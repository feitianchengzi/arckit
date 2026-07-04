# OSS Bucket CORS 配置指南

## 📋 问题说明

当从浏览器直接上传文件到阿里云 OSS 时，如果 OSS Bucket 没有正确配置 CORS（跨域资源共享）规则，会出现以下错误：

```
Access to XMLHttpRequest at 'https://feitianchengziworkshop.oss-cn-beijing.aliyuncs.com/...' 
from origin 'https://workshop.feitianchengzi.com' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 🔧 解决方案：配置 OSS Bucket CORS 规则

### 步骤 1：登录阿里云 OSS 控制台

1. 访问 [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
2. 登录你的阿里云账号
3. 找到 Bucket：`feitianchengziworkshop`

### 步骤 2：进入 CORS 配置页面

1. 点击 Bucket 名称进入详情页
2. 在左侧菜单中找到 **"权限管理"** → **"跨域设置（CORS）"**
3. 点击 **"创建规则"** 或 **"添加规则"**

### 步骤 3：配置 CORS 规则

填写以下配置：

#### 基础配置

- **来源（AllowedOrigin）**：
  ```
  https://workshop.feitianchengzi.com
  http://localhost:3000
  http://127.0.0.1:3000
  http://localhost:5173
  http://127.0.0.1:5173
  ```
  
  > 💡 **提示**：可以添加多个来源，每行一个。如果需要允许所有来源（不推荐生产环境），可以填写 `*`

- **允许 Methods（AllowedMethod）**：
  ```
  GET
  PUT
  POST
  DELETE
  HEAD
  OPTIONS
  ```
  
  > ⚠️ **重要**：必须包含 `PUT` 和 `OPTIONS`，因为文件上传使用 PUT 方法，预检请求使用 OPTIONS

- **允许 Headers（AllowedHeader）**：
  ```
  *
  ```
  
  > 💡 **提示**：设置为 `*` 表示允许所有请求头，这是最简单的方式

- **暴露 Headers（ExposeHeader）**：
  ```
  ETag
  x-oss-request-id
  Content-Length
  ```
  
  > 💡 **提示**：这些是浏览器可以访问的响应头

- **缓存时间（MaxAgeSeconds）**：
  ```
  3600
  ```
  
  > 💡 **提示**：3600 秒 = 1 小时，表示浏览器可以缓存预检请求结果 1 小时

### 步骤 4：保存配置

1. 检查所有配置项是否正确
2. 点击 **"确定"** 或 **"保存"**
3. 等待配置生效（通常几秒钟内生效）

## 📝 完整配置示例（JSON 格式）

如果你使用 API 或命令行配置，可以使用以下 JSON：

```json
{
  "CORSRule": [
    {
      "AllowedOrigin": [
        "https://workshop.feitianchengzi.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
      ],
      "AllowedMethod": [
        "GET",
        "PUT",
        "POST",
        "DELETE",
        "HEAD",
        "OPTIONS"
      ],
      "AllowedHeader": [
        "*"
      ],
      "ExposeHeader": [
        "ETag",
        "x-oss-request-id",
        "Content-Length"
      ],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

## ✅ 验证配置

配置完成后，可以通过以下方式验证：

### 方法 1：浏览器测试

1. 打开前端应用：`https://workshop.feitianchengzi.com`
2. 尝试上传头像
3. 打开浏览器开发者工具（F12）
4. 查看 Network 标签：
   - 如果看到 `OPTIONS` 请求返回 `200` 状态码，且响应头包含 `Access-Control-Allow-Origin`，说明配置成功
   - 如果仍然看到 CORS 错误，检查配置是否正确

### 方法 2：使用 curl 测试预检请求

```bash
curl -X OPTIONS \
  -H "Origin: https://workshop.feitianchengzi.com" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: content-type" \
  -v \
  https://feitianchengziworkshop.oss-cn-beijing.aliyuncs.com/
```

如果配置正确，响应应该包含：
```
< HTTP/1.1 200 OK
< Access-Control-Allow-Origin: https://workshop.feitianchengzi.com
< Access-Control-Allow-Methods: GET, PUT, POST, DELETE, HEAD, OPTIONS
< Access-Control-Allow-Headers: *
< Access-Control-Max-Age: 3600
```

## 🐛 常见问题

### Q1: 配置后仍然报 CORS 错误？

**可能原因**：
1. 配置未保存或未生效（等待几分钟后重试）
2. 来源（Origin）不匹配（检查浏览器 Network 标签中的实际 Origin）
3. 浏览器缓存了旧的 CORS 响应（清除浏览器缓存或使用无痕模式）

**解决方法**：
- 检查浏览器 Network 标签中的实际请求 Origin
- 确保 CORS 规则中的 `AllowedOrigin` 包含该 Origin
- 清除浏览器缓存后重试

### Q2: 开发环境和生产环境需要分别配置吗？

**答**：可以在同一个 CORS 规则中添加多个来源，包括：
- 开发环境：`http://localhost:3000`、`http://127.0.0.1:3000`、`http://localhost:5173`、`http://127.0.0.1:5173`
- 生产环境：`https://workshop.feitianchengzi.com`

### Q3: 可以设置 `AllowedOrigin: *` 吗？

**答**：可以，但不推荐在生产环境使用，因为：
- 安全性较低（允许任何网站访问）
- 某些浏览器可能不支持 `*`（需要明确指定来源）

**建议**：明确列出所有需要的前端域名

### Q4: 为什么需要 `OPTIONS` 方法？

**答**：浏览器在发送跨域请求前会先发送一个 `OPTIONS` 预检请求（preflight request），检查服务器是否允许该跨域请求。如果 OSS 没有配置允许 `OPTIONS` 方法，预检请求会失败，导致实际请求无法发送。

### Q5: 配置后多久生效？

**答**：通常几秒钟内生效，最长不超过 5 分钟。如果配置后立即测试仍然失败，可以：
1. 等待 1-2 分钟后重试
2. 清除浏览器缓存
3. 使用无痕模式测试

## 📚 相关文档

- [阿里云 OSS CORS 配置文档](https://help.aliyun.com/document_detail/31988.html)
- [MDN CORS 文档](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)

## 🔗 快速链接

- [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
- [OSS Bucket: feitianchengziworkshop](https://oss.console.aliyun.com/bucket/oss-cn-beijing/feitianchengziworkshop/cors)

---

**配置完成后，头像上传功能应该可以正常工作了！** 🎉
