@echo off
chcp 65001 >nul
echo ========================================================
echo   🏛️ 申论智能研习台 (Shenlun Exam OS) 启动中...
echo   模式：无状态算力后端 + 纯客户端本地存储 (IndexedDB)
echo ========================================================

cd /d %~dp0
start http://127.0.0.1:8789
python server\src\main.py
pause
