#!/usr/bin/env bash
set -e

echo "========================================================"
echo "  🏛️ 申论智能研习台 (Shenlun Exam OS) 启动中..."
echo "  模式：无状态算力后端 + 纯客户端本地存储 (IndexedDB)"
echo "  服务地址：http://127.0.0.1:8789"
echo "========================================================"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="${DIR}/server:${PYTHONPATH}"

# 检测 Python 命令
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ 错误：未检测到 Python 运行环境，请先安装 Python 3.11+"
    exit 1
fi

echo "正在启动本地无状态算力服务 (按 Ctrl+C 停止)..."

# 尝试自动打开默认浏览器
if command -v xdg-open &>/dev/null; then
    (sleep 1 && xdg-open "http://127.0.0.1:8789") &
elif command -v open &>/dev/null; then
    (sleep 1 && open "http://127.0.0.1:8789") &
fi

exec "$PYTHON_CMD" "${DIR}/server/src/main.py"
