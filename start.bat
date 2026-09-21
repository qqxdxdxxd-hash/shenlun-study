@echo off
chcp 65001 >nul
title 申论智能研习台 (Shenlun Exam OS)
echo ========================================================
echo   🏛️ 申论智能研习台 (Shenlun Exam OS) 启动中...
echo   模式：无状态算力后端 + 纯客户端本地存储 (IndexedDB)
echo   服务地址：http://127.0.0.1:8789
echo ========================================================

cd /d %~dp0
set PYTHONPATH=%~dp0server;%PYTHONPATH%

echo 正在启动本地无状态算力服务...
start "" "http://127.0.0.1:8789"
python server\src\main.py
pause
