# 手机端测试指南

## 方法一：通过局域网访问（推荐）

### 前提条件
1. **PC 和手机连接到同一个 WiFi 网络**
2. **确保防火墙允许 3000 端口访问**

### 步骤

#### 1. 获取 PC 的局域网 IP 地址

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
或者：
```bash
ipconfig getifaddr en0  # macOS
```

**Windows:**
```bash
ipconfig
```
查找 "IPv4 地址"，通常是 `192.168.x.x` 或 `10.x.x.x`

#### 2. 启动开发服务器

```bash
cd frontend
npm run dev
```

启动后，Vite 会显示：
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

**注意**: 如果看到 "Network" 地址，说明配置成功！

#### 3. 在手机上访问

在手机浏览器中输入：
```
http://192.168.x.x:3000
```
（将 `192.168.x.x` 替换为你的 PC 实际 IP 地址）

### 常见问题

#### 问题1: 看不到 Network 地址
**解决方案**: 
- 检查 `vite.config.ts` 中是否设置了 `host: true`
- 确保防火墙允许 3000 端口

#### 问题2: 手机无法连接
**解决方案**:
1. 检查 PC 和手机是否在同一 WiFi 网络
2. 检查防火墙设置（macOS: 系统设置 > 网络 > 防火墙）
3. 尝试关闭防火墙测试
4. 检查路由器是否开启了 AP 隔离（如果开启，设备间无法互相访问）

#### 问题3: 页面加载但 API 请求失败
**解决方案**:
- 检查 API 代理配置是否正确
- 检查手机网络是否可以访问 `https://api.feitianchengzi.com`

## 方法二：使用 ngrok（外网访问）

如果需要从外网访问（不在同一 WiFi），可以使用 ngrok：

### 安装 ngrok
```bash
# macOS
brew install ngrok

# 或下载: https://ngrok.com/download
```

### 启动服务
```bash
# 1. 先启动开发服务器
cd frontend
npm run dev

# 2. 在另一个终端启动 ngrok
ngrok http 3000
```

ngrok 会提供一个公网地址，例如：
```
Forwarding  https://xxxx-xx-xx-xx-xx.ngrok.io -> http://localhost:3000
```

在手机浏览器中访问这个地址即可。

**注意**: 
- 免费版 ngrok 地址每次启动都会变化
- 适合临时测试，不适合长期使用

## 方法三：使用手机热点

如果无法使用同一 WiFi，可以让 PC 连接手机热点：

1. 打开手机热点
2. PC 连接到手机热点
3. 获取 PC 在热点网络中的 IP 地址
4. 在手机浏览器中访问该 IP:3000

## 测试检查清单

- [ ] PC 和手机在同一网络
- [ ] 开发服务器已启动
- [ ] 可以看到 Network 地址
- [ ] 手机浏览器可以访问
- [ ] 侧边栏可以正常打开/关闭
- [ ] 导航功能正常
- [ ] 表单输入正常
- [ ] 触摸操作流畅
- [ ] 响应式布局正确

## 调试技巧

### 查看手机端控制台
1. **Chrome DevTools**:
   - PC 打开 Chrome
   - 访问 `chrome://inspect`
   - 连接手机后可以看到设备
   - 点击 "inspect" 打开调试工具

2. **Safari Web Inspector** (iOS):
   - iPhone 设置 > Safari > 高级 > Web 检查器（开启）
   - macOS Safari > 开发 > [你的 iPhone] > [网页]

### 查看网络请求
- 使用手机浏览器的开发者工具
- 或使用 Charles/Fiddler 等代理工具

## 快速测试脚本

创建一个快速获取 IP 的脚本：

**macOS/Linux (`get-ip.sh`):**
```bash
#!/bin/bash
IP=$(ipconfig getifaddr en0 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "PC IP 地址: $IP"
echo "手机访问地址: http://$IP:3000"
```

**Windows (`get-ip.bat`):**
```batch
@echo off
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    set IP=!IP:~1!
    echo PC IP 地址: !IP!
    echo 手机访问地址: http://!IP!:3000
    exit /b
)
```

