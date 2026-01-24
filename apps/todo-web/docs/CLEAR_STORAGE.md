# 清理本地存储数据指南

本文档说明如何清理应用本地保存的认证数据，使应用回到未登录状态。

## 📦 存储的数据项

应用在本地存储了以下数据：

1. **localStorage**
   - Key: `auth_info`
   - 内容：accessToken, refreshToken, tokenObtainedAt, tokenExpiresIn, userId, username, avatarUrl

2. **Cookie**
   - Name: `auth_token`
   - 用途：供 Next.js 中间件使用

3. **React Query 缓存**
   - 查询缓存可能包含用户信息等数据

---

## 🧹 清理方法

### 方法 1: 浏览器控制台执行清理脚本（推荐）

1. 打开浏览器开发者工具（F12 或 Cmd+Option+I）
2. 切换到 **Console（控制台）** 标签
3. 复制并执行以下脚本：

```javascript
// 清理所有认证相关的本地存储
(function() {
  console.log('🧹 开始清理本地存储数据...');
  
  // 1. 清理 localStorage
  try {
    localStorage.removeItem('auth_info');
    console.log('✅ 已清理 localStorage: auth_info');
  } catch (e) {
    console.error('❌ 清理 localStorage 失败:', e);
  }
  
  // 2. 清理 Cookie
  try {
    // 清理当前域名的 auth_token cookie
    document.cookie = 'auth_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    console.log('✅ 已清理 Cookie: auth_token');
  } catch (e) {
    console.error('❌ 清理 Cookie 失败:', e);
  }
  
  // 3. 清理所有 localStorage（可选，谨慎使用）
  // localStorage.clear();
  
  // 4. 清理所有 Cookie（可选，谨慎使用）
  // document.cookie.split(";").forEach(function(c) { 
  //   document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  // });
  
  console.log('✅ 清理完成！请刷新页面。');
  console.log('💡 提示：刷新页面后，应用将处于未登录状态。');
})();
```

4. 刷新页面（F5 或 Cmd+R）

---

### 方法 2: 使用浏览器开发者工具手动清理

#### Chrome/Edge 浏览器

1. 打开开发者工具（F12）
2. 切换到 **Application（应用）** 标签
3. 清理 localStorage：
   - 左侧栏选择 **Storage → Local Storage → http://localhost:3000**
   - 找到 `auth_info` 项，右键选择 **Delete（删除）**
4. 清理 Cookie：
   - 左侧栏选择 **Storage → Cookies → http://localhost:3000**
   - 找到 `auth_token`，右键选择 **Delete（删除）**
5. 刷新页面

#### Firefox 浏览器

1. 打开开发者工具（F12）
2. 切换到 **存储（Storage）** 标签
3. 清理 localStorage：
   - 左侧栏选择 **本地存储 → http://localhost:3000**
   - 找到 `auth_info` 项，右键删除
4. 清理 Cookie：
   - 左侧栏选择 **Cookie → http://localhost:3000**
   - 找到 `auth_token`，右键删除
5. 刷新页面

#### Safari 浏览器

1. 打开开发者工具（Cmd+Option+I）
2. 切换到 **存储（Storage）** 标签
3. 清理步骤与 Firefox 类似

---

### 方法 3: 使用应用内置的退出登录功能

如果应用中有退出登录按钮，点击退出登录也会自动清理数据：

1. 在设置页面点击"退出登录"按钮
2. 应用会自动调用 `clearAuthInfo()` 清理数据
3. 自动跳转到登录页

---

### 方法 4: 一键清理所有站点数据（谨慎使用）

⚠️ **警告**：这会清理所有该站点的数据，包括其他应用数据。

**Chrome/Edge:**
1. 地址栏左侧点击锁图标或信息图标
2. 选择 **Cookie 和其他网站数据** 或 **网站设置**
3. 点击 **清除数据**

**Firefox:**
1. 地址栏左侧点击锁图标
2. 选择 **清除 Cookie 和站点数据**

---

## 🔍 验证清理结果

清理后，可以执行以下脚本验证：

```javascript
// 检查是否清理成功
console.log('🔍 检查存储数据:');
console.log('localStorage auth_info:', localStorage.getItem('auth_info'));
console.log('Cookie auth_token:', document.cookie.includes('auth_token'));
console.log('预期结果: auth_info 应为 null, auth_token 不应存在');
```

---

## 📝 存储的数据结构

`auth_info` 的数据结构（存储在 localStorage 中）：

```typescript
{
  accessToken: string,          // 访问令牌
  refreshToken: string,         // 刷新令牌
  tokenObtainedAt: number,      // Token 获取时间（时间戳，毫秒）
  tokenExpiresIn: number,       // Token 过期时间（秒）
  userId: string,               // 用户 UUID
  username?: string,            // 用户名（可选）
  avatarUrl?: string            // 头像 URL（可选）
}
```

---

## 🚀 快速清理脚本（最小版本）

如果只需要快速清理，复制以下一行代码到控制台：

```javascript
localStorage.removeItem('auth_info'); document.cookie='auth_token=; path=/; max-age=0'; location.reload();
```

---

## ⚠️ 注意事项

1. **清理后需要刷新页面**才能看到效果
2. **清理 Cookie 时**，确保路径和域名匹配，否则可能无法清理
3. **如果使用 HTTPS**，Cookie 可能需要设置 Secure 标志
4. **清理所有数据**（localStorage.clear()）会影响其他应用数据，谨慎使用
5. **React Query 缓存**在刷新页面后会自动清理，无需手动处理




