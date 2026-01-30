#!/bin/bash

# ============================================
# EmailAdmin 后端管理脚本
# 仓库地址: https://gitee.com/xdteam-mumu/vue-email-admin.git
# ============================================

# 定义颜色输出函数
red() { echo -e "\033[31m\033[01m[错误] $1\033[0m"; }
green() { echo -e "\033[32m\033[01m[信息] $1\033[0m"; }
yellow() { echo -e "\033[33m\033[01m[提示] $1\033[0m"; }
blue() { echo -e "\033[34m\033[01m[消息] $1\033[0m"; }
highlight() { echo -e "\033[32m\033[01m$1\033[0m"; }

# 配置变量
VENV_DIR="venv"
PIP_MIRROR="https://mirrors.aliyun.com/pypi/simple/"
EmailAdmin_repo_url="https://gitee.com/xdteam-mumu/vue-email-admin.git"
DEFAULT_TIMEOUT=10

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. 更新系统软件包
update_system_packages() {
    green "正在设置时区为 Asia/Shanghai..."
    sudo timedatectl set-timezone Asia/Shanghai 2>/dev/null || yellow "设置时区失败，可能需要手动设置"
    
    green "正在更新系统软件包..."
    sudo apt update
    sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
    
    if ! command -v curl &>/dev/null; then
        red "未检测到 curl，正在安装..."
        sudo apt install -y curl
        if command -v curl &>/dev/null; then
            green "curl 安装成功。"
        else
            red "curl 安装失败，请检查错误信息。"
        fi
    else
        green "curl 已安装。"
    fi
    
    green "系统软件包更新完成。"
}

# 2. 安装/检查 Python 依赖
install_python() {
    green "正在检查并安装必要的软件包..."
    
    if ! command -v git >/dev/null 2>&1; then
        sudo apt-get update
        yellow "正在安装 git 包..."
        sudo apt-get install -y git
    else
        green "git 已安装。"
    fi
    
    if ! command -v python3 >/dev/null 2>&1; then
        yellow "正在安装 python3 包..."
        sudo apt-get install -y python3
    else
        green "python3 已安装: $(python3 --version)"
    fi
    
    if ! command -v pip3 >/dev/null 2>&1; then
        green "正在安装 python3-pip 包..."
        sudo apt-get install -y python3-pip
    else
        green "pip3 已安装: $(pip3 --version)"
    fi
    
    if ! dpkg -s python3-venv >/dev/null 2>&1; then
        yellow "正在安装 python3-venv 包..."
        sudo apt-get install -y python3-venv
    else
        green "python3-venv 已安装。"
    fi
    
    blue "Python 相关依赖检查完成。"
}

# 3. 更新 EmailAdmin 代码
update_code() {
    yellow "=============== 更新 EmailAdmin ==============="
    
    # 返回项目根目录
    cd "$SCRIPT_DIR/.."
    
    if [ ! -d ".git" ]; then
        yellow "初始化 Git 仓库..."
        git init
        git remote add origin $EmailAdmin_repo_url 2>/dev/null || git remote set-url origin $EmailAdmin_repo_url
    fi
    
    yellow "仓库初始化完成"
    yellow "正在强制拉取仓库..."
    git fetch origin
    git reset --hard origin/master
    yellow "仓库代码更新完成"
    
    # 返回 backend 目录
    cd "$SCRIPT_DIR"
    
    green "=============== EmailAdmin 更新完成 ==============="
}

# 4. 创建虚拟环境
create_venv() {
    blue "=============== 创建虚拟环境 ==============="
    
    if [ -d "$VENV_DIR" ]; then
        yellow "虚拟环境已存在，是否重新创建？(y/N)"
        read -t 10 -r choice
        if [[ "$choice" =~ ^[Yy]$ ]]; then
            rm -rf "$VENV_DIR"
            python3 -m venv "$VENV_DIR"
            green "虚拟环境已重新创建。"
        else
            green "保留现有虚拟环境。"
        fi
    else
        python3 -m venv "$VENV_DIR"
        green "虚拟环境创建成功。"
    fi
    
    blue "=============== 虚拟环境创建完成 ==============="
}

# 5. 激活虚拟环境
activate_venv() {
    blue "=============== 激活虚拟环境 ==============="
    
    if [ -d "$VENV_DIR" ]; then
        source "$VENV_DIR/bin/activate"
        green "虚拟环境已激活。"
    else
        yellow "虚拟环境不存在，正在创建..."
        create_venv
        source "$VENV_DIR/bin/activate"
        green "虚拟环境已激活。"
    fi
    
    blue "=============== 虚拟环境激活完成 ==============="
}

# 6. 安装 Python 依赖
install_requirements() {
    activate_venv
    blue "=============== 安装依赖 ==============="
    
    if [ -f "requirements.txt" ]; then
        blue "正在从 requirements.txt 安装依赖..."
        pip install -r requirements.txt -i "$PIP_MIRROR"
        green "依赖安装完成。"
    else
        red "未找到 requirements.txt，跳过依赖安装。"
    fi
    
    blue "=============== 安装依赖完成 ==============="
}

# 7. 创建虚拟环境并安装依赖
setup_venv_and_install() {
    create_venv
    install_requirements
}

# 8. 配置环境变量
setup_env() {
    blue "=============== 配置环境变量 ==============="
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            green "已从 .env.example 创建 .env 文件"
            yellow "请编辑 .env 文件配置必要的环境变量"
            
            # 生成加密密钥
            if command -v python3 &>/dev/null; then
                activate_venv
                ENCRYPTION_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())" 2>/dev/null)
                if [ -n "$ENCRYPTION_KEY" ]; then
                    sed -i "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env 2>/dev/null
                    green "已自动生成加密密钥"
                fi
            fi
        else
            red "未找到 .env.example 文件"
        fi
    else
        green ".env 文件已存在"
    fi
    
    blue "=============== 环境变量配置完成 ==============="
}

# 9. 启动 EmailAdmin
start_app() {
    green "启动 EmailAdmin..."
    activate_venv
    
    # 检查 .env 文件
    if [ ! -f ".env" ]; then
        yellow ".env 文件不存在，正在创建..."
        setup_env
    fi
    
    # 启动应用
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        python "main.py"
    else
        python3 "main.py"
    fi
}

# 10. 一键更新
one_click_update() {
    green "=============== 开始一键更新 ==============="
    update_system_packages
    install_python
    update_code
    setup_venv_and_install
    setup_env
    green "=============== 一键更新完成 ==============="
}

# 菜单
show_menu() {
    echo
    yellow "=============== 请选择要执行的操作 ==============="
    echo "1. 一键启动 EmailAdmin"
    echo "2. 一键更新（全部自动）"
    echo "3. 更新系统软件包"
    echo "4. 安装/检查 Python 依赖"
    echo "5. 更新 EmailAdmin 代码"
    echo "6. 创建虚拟环境并安装依赖"
    echo "0. 退出"
    echo "=============================================="
}

# 主函数
main() {
    while true; do
        show_menu
        
        # 带超时的输入，默认选择 1
        read -t $DEFAULT_TIMEOUT -p "请输入操作编号 (${DEFAULT_TIMEOUT}秒后自动选择1): " choice
        
        # 如果超时，choice 为空，默认选择 1
        if [ -z "$choice" ]; then
            echo
            yellow "超时未选择，自动执行选项 1..."
            choice=1
        fi
        
        case "$choice" in
            1)
                start_app
                ;;
            2)
                one_click_update
                ;;
            3)
                update_system_packages
                ;;
            4)
                install_python
                ;;
            5)
                update_code
                ;;
            6)
                setup_venv_and_install
                ;;
            0)
                yellow "已退出脚本。"
                exit 0
                ;;
            *)
                yellow "无效输入，请重新选择。"
                ;;
        esac
    done
}

# 运行主函数
main
