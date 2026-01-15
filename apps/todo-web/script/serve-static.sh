#!/bin/bash

# 本地测试服务器脚本（支持 SPA 路由）
# 用途：启动一个支持单页应用路由的静态文件服务器

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 进入脚本所在目录的父目录（frontend 目录）
cd "$(dirname "$0")/.."

# 输出目录
OUT_DIR="out"
PORT="${PORT:-3000}"

# 检查 out 目录是否存在
if [ ! -d "$OUT_DIR" ]; then
    echo -e "${YELLOW}⚠️  $OUT_DIR 目录不存在，请先运行构建脚本${NC}"
    echo -e "${YELLOW}   运行: ./scripts/build-export.sh${NC}"
    exit 1
fi

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}   启动静态文件服务器（支持 SPA 路由）${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}📁 服务目录：${NC}$(pwd)/$OUT_DIR"
echo -e "${GREEN}🌐 访问地址：${NC}http://localhost:$PORT/workshop/"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}💡 提示：${NC}"
echo -e "   - 按 Ctrl+C 停止服务器"
echo -e "   - 支持动态路由（如 /projects/38/）"
echo -e "   - 所有 404 请求会重定向到 index.html"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

# 检查是否有 Python
if command -v python3 &> /dev/null; then
    cd "$OUT_DIR"
    # 使用 Python 的 http.server，但需要支持 SPA 路由
    # 创建一个简单的 Python 脚本来处理 SPA 路由
    cat > server.py << 'PYEOF'
#!/usr/bin/env python3
import http.server
import socketserver
import os
from urllib.parse import urlparse

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 添加 CORS 头（如果需要）
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        original_path = parsed_path.path
        
        # 移除开头的斜杠，获取相对路径
        path = original_path.lstrip('/')
        
        # 处理 /workshop/ 前缀：移除它，因为文件在 out 目录的根目录
        if path.startswith('workshop/'):
            path = path[9:]  # 移除 'workshop/' (9个字符)
        
        # 如果路径为空，使用 index.html
        if not path or path == '':
            path = 'index.html'
        
        # 检查文件是否存在（相对于当前工作目录，即 out 目录）
        if os.path.exists(path) and os.path.isfile(path):
            # 文件存在，正常返回（需要恢复原始路径格式）
            self.path = '/' + path
            super().do_GET()
        elif os.path.isdir(path):
            # 是目录，尝试返回目录下的 index.html
            index_path = os.path.join(path, 'index.html')
            if os.path.exists(index_path) and os.path.isfile(index_path):
                self.path = '/' + index_path
                super().do_GET()
            else:
                # 目录不存在 index.html，返回根目录的 index.html（SPA 路由）
                self.path = '/index.html'
                super().do_GET()
        else:
            # 文件不存在，检查是否是静态资源
            if path.startswith('_next/'):
                # 静态资源，直接返回（路径已经处理过 workshop 前缀）
                self.path = '/' + path
                super().do_GET()
            else:
                # 其他路径不存在，返回根目录的 index.html（SPA 路由）
                self.path = '/index.html'
                super().do_GET()

if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3000))
    with socketserver.TCPServer(("", PORT), SPAHandler) as httpd:
        print(f"服务器运行在 http://localhost:{PORT}/")
        print("按 Ctrl+C 停止服务器")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")
PYEOF
    
    chmod +x server.py
    PORT=$PORT python3 server.py
else
    echo -e "${YELLOW}⚠️  未找到 Python3，使用简单的 HTTP 服务器${NC}"
    echo -e "${YELLOW}   注意：简单服务器不支持 SPA 路由，动态路由可能返回 404${NC}"
    cd "$OUT_DIR"
    python3 -m http.server "$PORT"
fi
