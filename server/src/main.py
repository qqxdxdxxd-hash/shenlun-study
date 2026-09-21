import sys
from pathlib import Path

# 将 server 目录加入 sys.path，保证无论在任何工作目录下均能正常解析 src
server_dir = Path(__file__).resolve().parent.parent
if str(server_dir) not in sys.path:
    sys.path.insert(0, str(server_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from src.api import router

app = FastAPI(
    title="申论智能研习台 (Shenlun Exam OS)",
    description="基于无状态算力后端与客户端本地数据中枢的公职申论研习系统",
    version="2.0.0"
)

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

# 挂载前端静态目录
web_dir = Path(__file__).resolve().parent.parent.parent / "web"
if web_dir.exists():
    app.mount("/", StaticFiles(directory=str(web_dir), html=True), name="web")

if __name__ == "__main__":
    import os
    import uvicorn
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8789"))
    print(f"🚀 启动申论智能研习台: http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)
