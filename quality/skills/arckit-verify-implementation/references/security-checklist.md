# 安全验证检查清单

> 基于 OWASP Top 10 (2021) 的安全验证清单。每项标注严重级别和检查命令。

---

## 一、OWASP Top 10 检查

### A01:2021 — 失效的访问控制

| 严重级别 | 检查项 | 检查方法 | 修复建议 |
|---------|--------|---------|---------|
| Critical | 水平越权（用户A访问用户B的数据） | 用用户A的token请求用户B的资源URL | API层校验资源归属，不只校验登录状态 |
| Critical | 垂直越权（普通用户访问管理员接口） | 用普通用户token请求/admin/*接口 | 后端校验角色，不依赖前端隐藏 |
| Critical | IDOR（不安全的直接对象引用） | 遍历/ orders/1→/orders/2→... | 用UUID替代自增ID + 校验归属 |
| Important | JWT未校验签名 | 修改JWT payload后重放请求 | 服务端严格验签，不接受alg=none |
| Important | CORS配置过宽 | 检查Access-Control-Allow-Origin是否为* | 限制为具体域名 |

### A02:2021 — 加密机制失败

| 严重级别 | 检查项 | 检查方法 | 修复建议 |
|---------|--------|---------|---------|
| Critical | 密码明文存储 | 检查数据库user表密码字段 | bcrypt/scrypt/argon2 哈希+盐 |
| Critical | 敏感数据HTTP传输 | curl -v 确认所有API走HTTPS | 强制HTTPS，HSTS头 |
| Important | 弱加密算法 | grep -r "MD5\|SHA1\|DES\|RC4" | AES-256-GCM / ChaCha20 |
| Important | 密钥硬编码 | grep -rE "(password|secret|key)\s*=" 源码 | 环境变量/密钥管理服务 |
| Minor | 日志中打印敏感数据 | 检查日志输出是否含手机号/身份证/密码 | 脱敏处理：138****1234 |

### A03:2021 — 注入

| 严重级别 | 检查项 | 检查方法 | 修复建议 |
|---------|--------|---------|---------|
| Critical | SQL注入 | 在输入框输入 `' OR 1=1 --` | 参数化查询，禁止字符串拼接SQL |
| Critical | 命令注入 | 输入 `; rm -rf /` 或 `$(cat /etc/passwd)` | 禁止直接拼接shell命令，用白名单 |
| Critical | XSS（存储型） | 在输入框输入 `<script>alert(1)</script>` | 输出编码 + CSP头 + HttpOnly Cookie |
| Important | XSS（反射型） | URL参数注入 `<img onerror=alert(1) src=x>` | 输入校验 + 输出编码 |
| Important | SSRF | 请求 `http://127.0.0.1:6379/` 等内网地址 | URL白名单 + 禁止内网地址 + DNS重绑定防护 |
| Important | LDAP注入 | 输入 `*)(|(cn=*` | LDAP参数转义 |
| Minor | 模板注入 | 输入 `${7*7}` 或 `{{7*7}}` | 沙箱化模板引擎，不执行用户输入 |

### A04:2021 — 不安全设计

| 严重级别 | 检查项 | 检查方法 | 修复建议 |
|---------|--------|---------|---------|
| Critical | 无速率限制 | 短时间发送100+请求 | 限流：IP+用户维度，429响应 |
| Important | 批量操作无确认 | 一次API调用删除所有数据 | 确认步骤 + 操作审计 |
| Important | 信任客户端数据 | 后端使用前端传来的price字段 | 后端从数据库读取，不信任客户端 |
| Minor | 错误信息泄露 | 触发500错误，检查响应含堆栈信息 | 生产环境返回通用错误，详情记日志 |

### A05:2021 — 安全配置错误

| 严重级别 | 检查项 | 检查方法 | 修复建议 |
|---------|--------|---------|---------|
| Critical | 默认凭据未改 | 尝试 admin/admin, root/root | 首次启动强制改密码 |
| Important | 调试接口未关闭 | 访问 /actuator, /debug, /swagger-ui | 生产环境关闭调试端点 |
| Important | 目录列表 | 访问 /static/, /uploads/ | 禁用目录列表，放index.html |
| Minor | 不必要的HTTP方法 | curl -X OPTIONS URL | 只允许GET/POST/PUT/DELETE |
| Minor | 缺少安全头 | curl -I URL | 补全安全响应头 |

### A06:2021 — 易受攻击和过时的组件

| 严重级别 | 检查项 | 检查方法 | 修复建议 |
|---------|--------|---------|---------|
| Critical | 已知CVE的依赖 | `npm audit` / `snyk test` / `trivy` | 升级到安全版本 |
| Important | 不再维护的依赖 | 检查npm/github最后更新时间 | 替换为活跃维护的替代品 |
| Minor | 过多依赖 | `ls node_modules | wc -l` | 删除不必要的依赖 |

### A07:2021 — 身份识别和认证失败

| 严重级别 | 检查项 | 检查方法 | 修复建议 |
|---------|--------|---------|---------|
| Critical | 暴力破解无防护 | 用错误密码尝试100次 | 账号锁定 + 验证码 + 速率限制 |
| Critical | 会话固定攻击 | 登录后Session ID不变 | 登录成功后重新生成Session ID |
| Important | 密码强度不够 | 尝试设置 `123456` / `password` | 最小8位+大小写+数字+特殊字符 |
| Important | Token无过期 | 获取Token后等待24小时仍可用 | Access Token 15min + Refresh Token 7天 |

### A08:2021 — 软件和数据完整性失败

| 严重级别 | 检查项 | 检查方法 | 修复建议 |
|---------|--------|---------|---------|
| Critical | CI/CD管道未保护 | 检查谁可以push到main/触发部署 | 分支保护 + 审批 + 签名提交 |
| Important | 更新无签名验证 | npm install --ignore-scripts 不检查 | 锁定版本(lockfile) + 验证签名 |

### A09:2021 — 安全日志和监控失败

| 严重级别 | 检查项 | 检查方法 | 修复建议 |
|---------|--------|---------|---------|
| Important | 登录失败无日志 | 故意输错密码，检查日志 | 记录时间/IP/用户名/结果 |
| Important | 关键操作无审计 | 执行删除/修改，检查审计日志 | 关键操作记录：谁+何时+做了什么 |
| Minor | 日志保留时间过短 | 检查日志保留策略 | 安全日志至少保留90天 |

### A10:2021 — 服务器端请求伪造 (SSRF)

| 严重级别 | 检查项 | 检查方法 | 修复建议 |
|---------|--------|---------|---------|
| Critical | 用户输入作为URL请求 | 提交 `http://169.254.169.254/` (云元数据) | URL白名单 + 内网IP黑名单 |
| Important | DNS重绑定 | 提交域名先解析为公网IP后解析为内网IP | 解析后校验IP + 禁止跟随重定向 |

---

## 二、安全响应头检查

| Header | 作用 | 推荐值 | 检查命令 |
|--------|------|--------|---------|
| Strict-Transport-Security | 强制HTTPS | `max-age=31536000; includeSubDomains` | `curl -sI URL \| grep -i strict` |
| Content-Security-Policy | 防XSS | `default-src 'self'; script-src 'self'` | `curl -sI URL \| grep -i content-security` |
| X-Content-Type-Options | 防MIME嗅探 | `nosniff` | `curl -sI URL \| grep -i x-content` |
| X-Frame-Options | 防点击劫持 | `DENY` 或 `SAMEORIGIN` | `curl -sI URL \| grep -i x-frame` |
| X-XSS-Protection | 浏览器XSS过滤 | `1; mode=block` | `curl -sI URL \| grep -i x-xss` |
| Referrer-Policy | 控制Referer泄露 | `strict-origin-when-cross-origin` | `curl -sI URL \| grep -i referrer` |
| Permissions-Policy | 控制浏览器API | `camera=(), microphone=(), geolocation=()` | `curl -sI URL \| grep -i permissions` |

---

## 三、依赖漏洞扫描

```bash
# Node.js
npm audit
npm audit fix            # 自动修复
npx snyk test            # Snyk扫描

# Python
pip audit
safety check
bandit -r .

# Go
go vuln ./...
trivy fs .

# Docker镜像
trivy image myapp:latest

# 持续监控（CI中）
npx snyk monitor         # 持续监控新漏洞
```

---

## 四、认证/授权专项检查

### JWT最佳实践

| 检查项 | 正确做法 | 常见错误 |
|--------|---------|---------|
| 算法 | 服务端指定算法，不接受alg头 | 允许alg=none |
| 密钥 | ≥256bit随机密钥 | 使用简单字符串 |
| 过期 | Access 15min + Refresh 7天 | 永不过期 |
| 存储 | HttpOnly + Secure + SameSite Cookie | localStorage |
| Payload | 只放用户ID和角色 | 放敏感数据 |
| 撤销 | 维护黑名单或短过期 | 无法撤销 |

### Session管理

| 检查项 | 正确做法 |
|--------|---------|
| 登录后重新生成Session ID | 防止会话固定 |
| Session超时 | 绝对超时30min + 空闲超时15min |
| Cookie属性 | HttpOnly + Secure + SameSite=Lax |
| 并发控制 | 同一用户同时最多N个有效Session |
| 登出 | 服务端销毁Session，不仅清客户端Cookie |
