#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OSS 部署脚本
用途：将 dist 目录下的文件上传到阿里云 OSS
"""

import os
import sys
import oss2
from pathlib import Path
from dotenv import load_dotenv

# 颜色输出
class Colors:
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

def print_colored(message, color=Colors.NC):
    """打印彩色消息"""
    print(f"{color}{message}{Colors.NC}")

def print_header(title):
    """打印标题"""
    print_colored("=" * 45, Colors.BLUE)
    print_colored(f"   {title}", Colors.BLUE)
    print_colored("=" * 45, Colors.BLUE)

def load_env_config():
    """从 .env 文件加载配置"""
    # 获取脚本所在目录
    script_dir = Path(__file__).parent
    frontend_dir = script_dir.parent
    env_file = frontend_dir / '.env'
    
    # 加载 .env 文件
    if env_file.exists():
        load_dotenv(env_file)
        print_colored(f"✓ 从 {env_file} 加载配置", Colors.GREEN)
    else:
        print_colored(f"❌ 未找到 .env 文件: {env_file}", Colors.RED)
        print_colored("请创建 .env 文件并配置 OSS 相关参数", Colors.YELLOW)
        sys.exit(1)
    
    # 读取配置
    access_key_id = os.getenv('OSS_ACCESS_KEY_ID')
    access_key_secret = os.getenv('OSS_ACCESS_KEY_SECRET')
    endpoint = os.getenv('OSS_ENDPOINT')
    bucket_name = os.getenv('OSS_BUCKET_NAME')
    prefix = os.getenv('OSS_PREFIX', '')  # 默认前缀为空（根目录）
    custom_domain = os.getenv('OSS_CUSTOM_DOMAIN', '')  # 自定义域名（可选）
    
    # 验证必需参数
    if not all([access_key_id, access_key_secret, endpoint, bucket_name]):
        print_colored("❌ .env 文件中缺少必需的 OSS 配置", Colors.RED)
        print_colored("必需参数：", Colors.YELLOW)
        print_colored("  - OSS_ACCESS_KEY_ID", Colors.YELLOW)
        print_colored("  - OSS_ACCESS_KEY_SECRET", Colors.YELLOW)
        print_colored("  - OSS_ENDPOINT", Colors.YELLOW)
        print_colored("  - OSS_BUCKET_NAME", Colors.YELLOW)
        print_colored("可选参数：", Colors.YELLOW)
        print_colored("  - OSS_PREFIX (可选，默认: 根目录)", Colors.YELLOW)
        print_colored("  - OSS_CUSTOM_DOMAIN (可选，自定义域名)", Colors.YELLOW)
        sys.exit(1)
    
    return {
        'access_key_id': access_key_id,
        'access_key_secret': access_key_secret,
        'endpoint': endpoint,
        'bucket_name': bucket_name,
        'prefix': prefix,
        'custom_domain': custom_domain,
        'dist_dir': frontend_dir / 'dist'
    }

def clear_directory(bucket, prefix):
    """清空 OSS 指定目录下的所有文件"""
    prefix_path = f"{prefix}/" if prefix else ""
    print_colored(f"\n🗑️  清空 OSS 目录: {prefix_path or '根目录'}", Colors.YELLOW)
    
    deleted_count = 0
    try:
        # 列举目录下的所有文件
        for obj in oss2.ObjectIterator(bucket, prefix=prefix_path):
            try:
                bucket.delete_object(obj.key)
                deleted_count += 1
                print_colored(f"  ✓ 删除: {obj.key}", Colors.GREEN)
            except Exception as e:
                print_colored(f"  ⚠️  删除失败 {obj.key}: {e}", Colors.YELLOW)
        
        if deleted_count == 0:
            print_colored(f"  ℹ️  目录 {prefix_path or '根目录'} 为空，无需删除", Colors.BLUE)
        else:
            print_colored(f"✓ 已删除 {deleted_count} 个文件", Colors.GREEN)
    except Exception as e:
        print_colored(f"❌ 清空目录失败: {e}", Colors.RED)
        raise

def upload_files(bucket, local_path, prefix):
    """上传本地目录下的所有文件到 OSS"""
    prefix_path = f"{prefix}/" if prefix else ""
    print_colored(f"\n📤 上传文件到 OSS: {prefix_path or '根目录'}", Colors.YELLOW)
    
    if not local_path.exists() or not local_path.is_dir():
        print_colored(f"❌ 目录不存在: {local_path}", Colors.RED)
        raise FileNotFoundError(f"目录不存在: {local_path}")
    
    uploaded_count = 0
    failed_count = 0
    total_size = 0
    
    # 遍历本地文件并上传
    for root, dirs, files in os.walk(local_path):
        for file in files:
            local_file = Path(root) / file
            # 计算相对路径
            rel_path = local_file.relative_to(local_path)
            # 构建 OSS 中的 key
            key = f"{prefix_path}{rel_path}".replace('\\', '/')  # Windows 路径兼容
            
            try:
                # 获取文件大小
                file_size = local_file.stat().st_size
                total_size += file_size
                
                # 上传文件
                bucket.put_object_from_file(key, str(local_file))
                uploaded_count += 1
                
                # 格式化文件大小
                size_str = format_size(file_size)
                print_colored(f"  ✓ 上传: {key} ({size_str})", Colors.GREEN)
            except Exception as e:
                failed_count += 1
                print_colored(f"  ❌ 上传失败 {key}: {e}", Colors.RED)
    
    print_colored(f"\n✓ 上传完成:", Colors.GREEN)
    print_colored(f"  - 成功: {uploaded_count} 个文件", Colors.GREEN)
    if failed_count > 0:
        print_colored(f"  - 失败: {failed_count} 个文件", Colors.RED)
    print_colored(f"  - 总大小: {format_size(total_size)}", Colors.GREEN)
    
    if failed_count > 0:
        sys.exit(1)

def format_size(size_bytes):
    """格式化文件大小"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"

def main():
    """主函数"""
    print_header("OSS 部署脚本")
    
    # 加载配置
    print_colored("\n🔍 加载配置...", Colors.YELLOW)
    config = load_env_config()
    
    # 验证 dist 目录
    dist_dir = config['dist_dir']
    if not dist_dir.exists():
        print_colored(f"❌ dist 目录不存在: {dist_dir}", Colors.RED)
        print_colored("请先运行构建脚本: ./script/build-vite.sh", Colors.YELLOW)
        sys.exit(1)
    
    if not (dist_dir / 'index.html').exists():
        print_colored(f"❌ dist 目录中未找到 index.html", Colors.RED)
        print_colored("请先运行构建脚本: ./script/build-vite.sh", Colors.YELLOW)
        sys.exit(1)
    
    print_colored(f"✓ dist 目录: {dist_dir}", Colors.GREEN)
    
    # 初始化 OSS 连接
    print_colored(f"\n🔗 连接 OSS...", Colors.YELLOW)
    print_colored(f"  - Endpoint: {config['endpoint']}", Colors.BLUE)
    print_colored(f"  - Bucket: {config['bucket_name']}", Colors.BLUE)
    prefix_display = f"{config['prefix']}/" if config['prefix'] else "根目录"
    print_colored(f"  - Prefix: {prefix_display}", Colors.BLUE)
    
    try:
        auth = oss2.Auth(config['access_key_id'], config['access_key_secret'])
        bucket = oss2.Bucket(auth, config['endpoint'], config['bucket_name'])
        
        # 测试连接
        bucket.get_bucket_info()
        print_colored("✓ OSS 连接成功", Colors.GREEN)
    except Exception as e:
        print_colored(f"❌ OSS 连接失败: {e}", Colors.RED)
        print_colored("请检查 .env 文件中的配置是否正确", Colors.YELLOW)
        sys.exit(1)
    
    # 清空目录
    try:
        clear_directory(bucket, config['prefix'])
    except Exception as e:
        print_colored(f"❌ 清空目录失败: {e}", Colors.RED)
        sys.exit(1)
    
    # 上传文件
    try:
        upload_files(bucket, dist_dir, config['prefix'])
    except Exception as e:
        print_colored(f"❌ 上传文件失败: {e}", Colors.RED)
        sys.exit(1)
    
    # 完成
    print_colored("\n" + "=" * 45, Colors.BLUE)
    print_colored("✅ 部署完成！", Colors.GREEN)
    print_colored("=" * 45, Colors.BLUE)
    print_colored(f"\n💡 访问地址:", Colors.YELLOW)
    # 优先使用自定义域名，否则使用 OSS bucket 地址
    if config['custom_domain']:
        # 使用自定义域名
        custom_domain = config['custom_domain'].rstrip('/')
        # 确保有 https:// 前缀
        if not custom_domain.startswith('http://') and not custom_domain.startswith('https://'):
            custom_domain = f"https://{custom_domain}"
        access_url = custom_domain
    else:
        # 构建 OSS 访问地址
        endpoint = config['endpoint']
        bucket_name = config['bucket_name']
        # 移除 http:// 或 https:// 前缀
        if endpoint.startswith('http://'):
            endpoint = endpoint[7:]
        elif endpoint.startswith('https://'):
            endpoint = endpoint[8:]
        # 构建访问地址：https://{bucket-name}.{endpoint}
        access_url = f"https://{bucket_name}.{endpoint}"
    
    prefix_url = f"/{config['prefix']}/" if config['prefix'] else "/"
    print_colored(f"   {access_url}{prefix_url}", Colors.BLUE)
    print_colored(f"\n📝 注意事项:", Colors.YELLOW)
    print_colored("   • 确保 OSS 已启用静态网站托管", Colors.YELLOW)
    print_colored("   • 设置默认首页为 index.html", Colors.YELLOW)
    print_colored("   • 设置默认 404 页为 index.html (用于 SPA 路由)", Colors.YELLOW)
    print_colored("   • 配置 CORS 规则以支持 API 请求", Colors.YELLOW)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print_colored("\n\n⚠️  用户中断操作", Colors.YELLOW)
        sys.exit(1)
    except Exception as e:
        print_colored(f"\n❌ 发生错误: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        sys.exit(1)
