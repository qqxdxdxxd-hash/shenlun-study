from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from src.api import router

app = FastAPI(
    title="申论智能研习台 (Shenlun Exam OS)",
    description="基于无状态算力后端与客户端本地数据中枢的公职申论研习系统",
    version="2.0.0"
)

# 允许跨域（方便开发与前端静态部署调用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

# 挂载前端静态目录
web_dir = Path(__file__).parent.parent.parent / "web"
if web_dir.exists():
    app.mount("/", StaticFiles(directory=str(web_dir), html=True), name="web")

if __name__ == "__main__":
    import uvicorn
    print("🚀 启动申论智能研习台: http://127.0.0.1:8789")
    uvicorn.run("src.main:app", host="127.0.0.1", port=8789, reload=True)
