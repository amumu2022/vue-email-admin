'''
Author: XDTEAM
Date: 2026-01-29 22:05:13
LastEditTime: 2026-01-30 20:21:10
LastEditors: XDTEAM
Description: 
'''
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import time

from app.api import accounts, emails, auth, logs, stats, open as open_api, tokens
from app.database import init_db, close_db
from app.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时初始化数据库
    await init_db()
    yield
    # 关闭时断开数据库连接
    await close_db()


app = FastAPI(
    title="邮箱管理平台 API",
    description="邮箱管理平台后端 API 服务",
    version="1.0.0",
    lifespan=lifespan
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 访问日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """记录所有 API 请求"""
    from app.models import AccessLog
    from app.utils.auth import decode_token, get_client_ip
    from jose import JWTError
    
    start_time = time.time()
    
    # 获取客户端信息
    client_ip = get_client_ip(request)
    method = request.method
    path = request.url.path
    user_agent = request.headers.get("User-Agent")
    
    # 尝试获取用户信息
    user_id = None
    username = None
    
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]
        try:
            payload = decode_token(token)
            user_id = payload.get("sub")
            username = payload.get("username")
        except (JWTError, Exception):
            pass
    
    # 执行请求
    response = await call_next(request)
    
    # 计算处理时间
    process_time = time.time() - start_time
    
    # 只记录 API 请求，排除静态资源和健康检查
    if path.startswith("/api") and path not in ["/api/health"]:
        # 排除登录和注册请求（已在 auth.py 中记录）
        if path not in ["/api/auth/login", "/api/auth/register", "/api/auth/logout"]:
            try:
                await AccessLog.create(
                    user_id=user_id,
                    username=username,
                    ip_address=client_ip,
                    method=method,
                    path=path,
                    status_code=response.status_code,
                    user_agent=user_agent
                )
            except Exception as e:
                # 记录日志失败不应影响请求
                logger.error(f"Failed to log access: {e}")
    
    # 添加处理时间到响应头
    response.headers["X-Process-Time"] = str(process_time)
    
    return response


# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(accounts.router, prefix="/api/accounts", tags=["账户管理"])
app.include_router(emails.router, prefix="/api/emails", tags=["邮件管理"])
app.include_router(logs.router, prefix="/api/logs", tags=["访问日志"])
app.include_router(stats.router, prefix="/api/stats", tags=["统计数据"])
app.include_router(tokens.router, prefix="/api/tokens", tags=["令牌管理"])
app.include_router(open_api.router, prefix="/api/v1/open", tags=["开放API"])


@app.get("/")
async def root():
    return {"message": "邮箱管理平台 API", "version": "1.0.0"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app="main:app", host="0.0.0.0", port=8000, reload=True)
