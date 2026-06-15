#!/bin/bash
# 快速初始化决策工具模版

set -e

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATES_DIR="$SKILL_DIR/templates"
WORKSPACE="${WORKSPACE:-$PWD}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 显示帮助
show_help() {
    cat << EOF
快速初始化决策工具模版

用法:
    $0 [工具类型] [项目名称]

工具类型:
    fp, first-principles    第一性原理拆解
    va, value-assessment    产品价值评估
    sq, socratic           苏格拉底追问

示例:
    $0 fp 直播带货
    $0 value-assessment AI助手功能
    $0 socratic 开发效率方案

选项:
    -h, --help             显示此帮助信息
    -l, --list             列出所有可用模版
    -o, --output PATH      指定输出路径（默认: 当前工作目录）

EOF
}

# 列出所有模版
list_templates() {
    echo -e "${GREEN}可用模版:${NC}"
    echo ""
    echo "1. first-principles (fp)     - 第一性原理拆解"
    echo "   适用: 全新领域、战略转型、打破僵局"
    echo ""
    echo "2. value-assessment (va)     - 产品价值评估"
    echo "   适用: 需求评审、立项决策、方案选择"
    echo ""
    echo "3. socratic (sq)             - 苏格拉底追问"
    echo "   适用: 方案评审、风险识别、团队对齐"
    echo ""
}

# 解析工具类型
parse_tool_type() {
    case "$1" in
        fp|first-principles)
            echo "first-principles-thinking"
            ;;
        va|value-assessment)
            echo "product-value-assessment"
            ;;
        sq|socratic)
            echo "socratic-questioning"
            ;;
        *)
            echo ""
            ;;
    esac
}

# 获取工具简称
get_tool_abbr() {
    case "$1" in
        first-principles-thinking)
            echo "first-principles"
            ;;
        product-value-assessment)
            echo "value-assessment"
            ;;
        socratic-questioning)
            echo "socratic"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# 主函数
main() {
    local tool_type=""
    local project_name=""
    local output_dir="$WORKSPACE"

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -l|--list)
                list_templates
                exit 0
                ;;
            -o|--output)
                output_dir="$2"
                shift 2
                ;;
            *)
                if [[ -z "$tool_type" ]]; then
                    tool_type="$1"
                elif [[ -z "$project_name" ]]; then
                    project_name="$1"
                else
                    echo -e "${RED}错误: 未知参数 '$1'${NC}"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done

    # 检查必需参数
    if [[ -z "$tool_type" ]] || [[ -z "$project_name" ]]; then
        echo -e "${RED}错误: 缺少必需参数${NC}"
        echo ""
        show_help
        exit 1
    fi

    # 解析工具类型
    local template_name=$(parse_tool_type "$tool_type")
    if [[ -z "$template_name" ]]; then
        echo -e "${RED}错误: 未知的工具类型 '$tool_type'${NC}"
        echo ""
        list_templates
        exit 1
    fi

    # 检查模版文件是否存在
    local template_file="$TEMPLATES_DIR/${template_name}.md"
    if [[ ! -f "$template_file" ]]; then
        echo -e "${RED}错误: 模版文件不存在: $template_file${NC}"
        exit 1
    fi

    # 生成输出文件名
    local today=$(date +%Y%m%d)
    local tool_abbr=$(get_tool_abbr "$template_name")
    local output_file="$output_dir/${project_name}-${tool_abbr}-${today}.md"

    # 检查输出目录
    if [[ ! -d "$output_dir" ]]; then
        echo -e "${YELLOW}创建输出目录: $output_dir${NC}"
        mkdir -p "$output_dir"
    fi

    # 检查文件是否已存在
    if [[ -f "$output_file" ]]; then
        echo -e "${YELLOW}警告: 文件已存在: $output_file${NC}"
        read -p "是否覆盖? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}已取消${NC}"
            exit 0
        fi
    fi

    # 复制模版
    cp "$template_file" "$output_file"

    # 替换模版中的占位符
    local date_str=$(date +%Y-%m-%d)
    sed -i "s/{{日期}}/$date_str/g" "$output_file"
    sed -i "s/{{项目名称}}/$project_name/g" "$output_file" 2>/dev/null || true
    sed -i "s/{{问题\/领域名称}}/$project_name/g" "$output_file" 2>/dev/null || true
    sed -i "s/{{命题\/方案名称}}/$project_name/g" "$output_file" 2>/dev/null || true

    # 成功提示
    echo -e "${GREEN}✓ 模版已创建:${NC} $output_file"
    echo ""
    echo -e "工具类型: ${GREEN}$(basename "$template_name" .md)${NC}"
    echo -e "项目名称: ${GREEN}$project_name${NC}"
    echo ""
    echo -e "下一步:"
    echo "  1. 打开文件开始填写"
    echo "  2. 或者让 agent 引导你逐章节填写"
    echo ""
}

main "$@"
