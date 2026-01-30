'''
Author: XDTEAM
Date: 2026-01-29 22:38:00
LastEditTime: 2026-01-30 19:00:50
LastEditors: XDTEAM
Description: 认证 API
'''
from fastapi import APIRouter, HTTPException, Request, Depends
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from typing import Optional

from app.models import User, AccessLog
from app.utils import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    get_client_ip
)
from app.schemas import ApiResponse

router = APIRouter()


class LoginRequest(BaseModel):
    """登录请求"""
    username: str = Field(..., min_length=1, max_length=50, description="用户名")
    password: str = Field(..., min_length=1, description="密码")


class RegisterRequest(BaseModel):
    """注册请求"""
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    password: str = Field(..., min_length=6, description="密码")
    email: Optional[str] = Field(None, description="邮箱")


class ChangePasswordRequest(BaseModel):
    """修改密码请求"""
    old_password: str = Field(..., alias="oldPassword", description="旧密码")
    new_password: str = Field(..., min_length=6, alias="newPassword", description="新密码")

    class Config:
        populate_by_name = True


class ResetPasswordRequest(BaseModel):
    """重置密码请求（管理员用）"""
    user_id: str = Field(..., alias="userId", description="用户ID")
    new_password: str = Field(..., min_length=6, alias="newPassword", description="新密码")

    class Config:
        populate_by_name = True


class UpdateUserRequest(BaseModel):
    """更新用户信息请求"""
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="用户名")
    email: Optional[str] = Field(None, description="邮箱")
    is_active: Optional[bool] = Field(None, alias="isActive", description="是否启用")
    is_admin: Optional[bool] = Field(None, alias="isAdmin", description="是否管理员")

    class Config:
        populate_by_name = True


@router.post("/login", response_model=ApiResponse)
async def login(request: Request, data: LoginRequest):
    """用户登录"""
    # 获取客户端 IP
    client_ip = get_client_ip(request)
    
    # 查找用户
    user = await User.get_or_none(username=data.username)
    
    # 记录登录尝试
    log_username = data.username if user else f"{data.username}(不存在)"
    
    if not user:
        # 记录失败日志
        await AccessLog.create(
            username=log_username,
            ip_address=client_ip,
            method="POST",
            path="/api/auth/login",
            status_code=401,
            user_agent=request.headers.get("User-Agent")
        )
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    if not verify_password(data.password, user.password_hash):
        # 记录失败日志
        await AccessLog.create(
            user_id=user.id,
            username=user.username,
            ip_address=client_ip,
            method="POST",
            path="/api/auth/login",
            status_code=401,
            user_agent=request.headers.get("User-Agent")
        )
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    if not user.is_active:
        raise HTTPException(status_code=401, detail="用户已被禁用")
    
    # 更新最后登录时间
    user.last_login = datetime.utcnow()
    await user.save()
    
    # 创建访问令牌
    access_token = create_access_token(
        data={"sub": user.id, "username": user.username}
    )
    
    # 记录成功登录日志
    await AccessLog.create(
        user_id=user.id,
        username=user.username,
        ip_address=client_ip,
        method="POST",
        path="/api/auth/login",
        status_code=200,
        user_agent=request.headers.get("User-Agent")
    )
    
    return {
        "success": True,
        "data": {
            "token": access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "isAdmin": user.is_admin,
                "lastLogin": user.last_login.isoformat() if user.last_login else None
            }
        },
        "message": "登录成功"
    }


@router.post("/register", response_model=ApiResponse)
async def register(request: Request, data: RegisterRequest):
    """用户注册"""
    client_ip = get_client_ip(request)
    
    # 检查用户名是否已存在
    existing = await User.get_or_none(username=data.username)
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")
    
    # 创建用户
    password_hash = get_password_hash(data.password)
    user = await User.create(
        username=data.username,
        password_hash=password_hash,
        email=data.email
    )
    
    # 记录注册日志
    await AccessLog.create(
        user_id=user.id,
        username=user.username,
        ip_address=client_ip,
        method="POST",
        path="/api/auth/register",
        status_code=200,
        user_agent=request.headers.get("User-Agent")
    )
    
    return {
        "success": True,
        "data": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        },
        "message": "注册成功"
    }


@router.get("/me", response_model=ApiResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return {
        "success": True,
        "data": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "isAdmin": current_user.is_admin,
            "lastLogin": current_user.last_login.isoformat() if current_user.last_login else None,
            "createdAt": current_user.created_at.isoformat() if current_user.created_at else None
        }
    }


@router.post("/change-password", response_model=ApiResponse)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user)
):
    """修改密码"""
    # 验证旧密码
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="旧密码错误")
    
    # 更新密码
    current_user.password_hash = get_password_hash(data.new_password)
    await current_user.save()
    
    return {
        "success": True,
        "message": "密码修改成功"
    }


@router.post("/logout", response_model=ApiResponse)
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """用户登出"""
    client_ip = get_client_ip(request)
    
    # 记录登出日志
    await AccessLog.create(
        user_id=current_user.id,
        username=current_user.username,
        ip_address=client_ip,
        method="POST",
        path="/api/auth/logout",
        status_code=200,
        user_agent=request.headers.get("User-Agent")
    )
    
    return {
        "success": True,
        "message": "登出成功"
    }


@router.post("/init-admin", response_model=ApiResponse)
async def init_admin():
    """初始化管理员账户（仅当没有用户时可用）"""
    # 检查是否已有用户
    user_count = await User.all().count()
    if user_count > 0:
        raise HTTPException(status_code=400, detail="已存在用户，无法初始化管理员")
    
    # 创建默认管理员
    password_hash = get_password_hash("admin123")
    admin = await User.create(
        username="admin",
        password_hash=password_hash,
        email="admin@example.com",
        is_admin=True
    )
    
    return {
        "success": True,
        "data": {
            "id": admin.id,
            "username": admin.username,
            "email": admin.email
        },
        "message": "管理员账户创建成功，默认密码: admin123，请尽快修改"
    }


# ==================== 用户管理 API（管理员功能）====================

@router.get("/users", response_model=ApiResponse)
async def get_users(current_user: User = Depends(get_current_user)):
    """获取所有用户列表（仅管理员）"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="无权限访问")
    
    users = await User.all().order_by("-created_at")
    
    return {
        "success": True,
        "data": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "isAdmin": user.is_admin,
                "isActive": user.is_active,
                "lastLogin": user.last_login.isoformat() if user.last_login else None,
                "createdAt": user.created_at.isoformat() if user.created_at else None
            }
            for user in users
        ]
    }


@router.get("/users/{user_id}", response_model=ApiResponse)
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    """获取单个用户信息（仅管理员）"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="无权限访问")
    
    user = await User.get_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    return {
        "success": True,
        "data": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "isAdmin": user.is_admin,
            "isActive": user.is_active,
            "lastLogin": user.last_login.isoformat() if user.last_login else None,
            "createdAt": user.created_at.isoformat() if user.created_at else None
        }
    }


@router.put("/users/{user_id}", response_model=ApiResponse)
async def update_user(
    user_id: str,
    data: UpdateUserRequest,
    current_user: User = Depends(get_current_user)
):
    """更新用户信息（仅管理员）"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="无权限访问")
    
    user = await User.get_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 检查用户名是否已被其他用户使用
    if data.username and data.username != user.username:
        existing = await User.get_or_none(username=data.username)
        if existing:
            raise HTTPException(status_code=400, detail="用户名已存在")
        user.username = data.username
    
    if data.email is not None:
        user.email = data.email
    
    if data.is_active is not None:
        # 防止管理员禁用自己
        if user.id == current_user.id and not data.is_active:
            raise HTTPException(status_code=400, detail="不能禁用自己的账户")
        user.is_active = data.is_active
    
    if data.is_admin is not None:
        # 防止管理员取消自己的管理员权限
        if user.id == current_user.id and not data.is_admin:
            raise HTTPException(status_code=400, detail="不能取消自己的管理员权限")
        user.is_admin = data.is_admin
    
    await user.save()
    
    return {
        "success": True,
        "data": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "isAdmin": user.is_admin,
            "isActive": user.is_active,
            "lastLogin": user.last_login.isoformat() if user.last_login else None,
            "createdAt": user.created_at.isoformat() if user.created_at else None
        },
        "message": "用户信息更新成功"
    }


@router.post("/users/reset-password", response_model=ApiResponse)
async def reset_user_password(
    data: ResetPasswordRequest,
    current_user: User = Depends(get_current_user)
):
    """重置用户密码（仅管理员）"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="无权限访问")
    
    user = await User.get_or_none(id=data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 更新密码
    user.password_hash = get_password_hash(data.new_password)
    await user.save()
    
    return {
        "success": True,
        "message": f"用户 {user.username} 的密码已重置"
    }


@router.delete("/users/{user_id}", response_model=ApiResponse)
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    """删除用户（仅管理员）"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="无权限访问")
    
    user = await User.get_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 防止管理员删除自己
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="不能删除自己的账户")
    
    username = user.username
    await user.delete()
    
    return {
        "success": True,
        "message": f"用户 {username} 已删除"
    }
