FROM python:3.11-slim

LABEL maintainer="Shenlun Study Team"
LABEL description="申论智能研习台 (Shenlun Exam OS) - 无状态算力引擎与前端中枢"

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOST=0.0.0.0 \
    PORT=8789

WORKDIR /app

# 安装系统级依赖与轻量 Python 运行库
COPY server/requirements.txt /app/server/requirements.txt
RUN pip install --no-cache-dir -r /app/server/requirements.txt

# 复制服务端源码与前端静态资产
COPY server /app/server
COPY web /app/web

# 暴露研习台端口
EXPOSE 8789

# 启动服务
CMD ["python", "server/src/main.py"]
