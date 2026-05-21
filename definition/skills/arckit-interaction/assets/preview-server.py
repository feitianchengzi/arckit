#!/usr/bin/env python3
"""
Interaction Wireframe Preview Server
自动启动本地服务器并打开当前目录
"""
import http.server
import socketserver
import webbrowser
import os
import sys
import signal
from pathlib import Path

def find_available_port(start_port=8000, max_attempts=100):
    """从 start_port 开始查找可用端口"""
    import socket
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            continue
    raise RuntimeError(f"无法在 {start_port}-{start_port + max_attempts} 范围内找到可用端口")

def signal_handler(sig, frame):
    """处理 Ctrl+C 退出"""
    print("\n\n✅ 服务器已停止")
    sys.exit(0)

def main():
    # 确保在脚本所在目录下运行
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # 查找可用端口
    try:
        port = find_available_port()
    except RuntimeError as e:
        print(f"❌ 错误: {e}")
        sys.exit(1)
    
    # 设置 HTTP 服务器
    Handler = http.server.SimpleHTTPRequestHandler
    Handler.extensions_map.update({
        '.yaml': 'text/yaml',
        '.yml': 'text/yaml',
    })
    
    try:
        with socketserver.TCPServer(("", port), Handler) as httpd:
            url = f"http://localhost:{port}/"
            
            print("╭─────────────────────────────────────────────────╮")
            print("│  📐 Interaction Wireframe Preview Server       │")
            print("├─────────────────────────────────────────────────┤")
            print(f"│  📡 服务器地址: {url:<30} │")
            print(f"│  📂 工作目录:   {str(script_dir):<30} │")
            print("├─────────────────────────────────────────────────┤")
            print("│  💡 浏览器会自动打开当前目录                     │")
            print("│  🔄 修改 default.html 或 wireframe-style.css 后刷新浏览器 │")
            print("│  ⏹️  按 Ctrl+C 停止服务器                        │")
            print("╰─────────────────────────────────────────────────╯\n")
            
            # 注册 Ctrl+C 处理
            signal.signal(signal.SIGINT, signal_handler)
            
            # 自动打开浏览器
            try:
                webbrowser.open(url)
                print("✅ 浏览器已打开\n")
            except Exception as e:
                print(f"⚠️  无法自动打开浏览器: {e}")
                print(f"   请手动访问: {url}\n")
            
            # 启动服务器
            httpd.serve_forever()
            
    except OSError as e:
        print(f"❌ 错误: 无法启动服务器 - {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
