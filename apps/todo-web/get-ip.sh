#!/bin/bash
# 快速获取 PC IP 地址，用于手机访问

echo "正在获取 PC 的局域网 IP 地址..."
echo ""

# macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
    if [ -z "$IP" ]; then
        IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    fi
# Linux
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    IP=$(hostname -I | awk '{print $1}')
fi

if [ -z "$IP" ]; then
    echo "❌ 无法获取 IP 地址，请手动检查网络配置"
    echo ""
    echo "手动获取方法："
    echo "  macOS: ifconfig | grep 'inet '"
    echo "  Linux: hostname -I"
    exit 1
fi

echo "✅ PC IP 地址: $IP"
echo ""
echo "📱 手机访问地址:"
echo "   http://$IP:3000"
echo ""
echo "💡 提示："
echo "   1. 确保 PC 和手机连接到同一个 WiFi"
echo "   2. 启动开发服务器: npm run dev"
echo "   3. 在手机浏览器中输入上面的地址"
echo ""


