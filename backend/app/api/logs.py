'''
Author: XDTEAM
Date: 2026-01-29 22:38:00
LastEditTime: 2026-01-30 20:27:53
LastEditors: XDTEAM
Description: 访问日志 API
'''
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
import math

from app.models import User, AccessLog
from app.utils import get_current_user
from app.schemas import ApiResponse

router = APIRouter()


@router.get("", response_model=ApiResponse)
async def get_access_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize"),
    username: Optional[str] = None,
    ip_address: Optional[str] = Query(None, alias="ipAddress"),
    path: Optional[str] = None,
    log_type: Optional[str] = Query(None, alias="logType", description="日志类型: open_api, login, other"),
    current_user: User = Depends(get_current_user)
):
    """获取访问日志列表（仅管理员）"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="无权限访问")
    
    query = AccessLog.all()
    
    if username:
        query = query.filter(username__icontains=username)
    
    if ip_address:
        query = query.filter(ip_address__icontains=ip_address)
    
    if path:
        query = query.filter(path__icontains=path)
    
    # 按日志类型筛选
    if log_type == "open_api":
        query = query.filter(path__startswith="/api/v1/open")
    elif log_type == "login":
        query = query.filter(path__startswith="/api/auth")
    elif log_type == "other":
        query = query.exclude(path__startswith="/api/v1/open").exclude(path__startswith="/api/auth")
    
    # 获取总数
    total = await query.count()
    
    # 分页
    offset = (page - 1) * page_size
    logs = await query.order_by("-created_at").offset(offset).limit(page_size)
    
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    
    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": log.id,
                    "userId": log.user_id,
                    "username": log.username,
                    "ipAddress": log.ip_address,
                    "method": log.method,
                    "path": log.path,
                    "statusCode": log.status_code,
                    "userAgent": log.user_agent,
                    "createdAt": log.created_at.isoformat() if log.created_at else None
                }
                for log in logs
            ],
            "total": total,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages
        }
    }


@router.get("/my", response_model=ApiResponse)
async def get_my_access_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize"),
    current_user: User = Depends(get_current_user)
):
    """获取当前用户的访问日志"""
    query = AccessLog.filter(user_id=current_user.id)
    
    # 获取总数
    total = await query.count()
    
    # 分页
    offset = (page - 1) * page_size
    logs = await query.order_by("-created_at").offset(offset).limit(page_size)
    
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    
    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": log.id,
                    "ipAddress": log.ip_address,
                    "method": log.method,
                    "path": log.path,
                    "statusCode": log.status_code,
                    "createdAt": log.created_at.isoformat() if log.created_at else None
                }
                for log in logs
            ],
            "total": total,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages
        }
    }


@router.delete("/{log_id}", response_model=ApiResponse)
async def delete_access_log(
    log_id: str,
    current_user: User = Depends(get_current_user)
):
    """删除访问日志（仅管理员）"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="无权限访问")
    
    log = await AccessLog.get_or_none(id=log_id)
    if not log:
        raise HTTPException(status_code=404, detail="日志不存在")
    
    await log.delete()
    
    return {
        "success": True,
        "message": "日志删除成功"
    }


@router.delete("", response_model=ApiResponse)
async def clear_access_logs(
    days: int = Query(30, ge=1, description="清除多少天前的日志"),
    current_user: User = Depends(get_current_user)
):
    """清除旧访问日志（仅管理员）"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="无权限访问")
    
    from datetime import datetime, timedelta
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    deleted_count = await AccessLog.filter(created_at__lt=cutoff_date).delete()
    
    return {
        "success": True,
        "data": {
            "deletedCount": deleted_count
        },
        "message": f"已清除 {deleted_count} 条日志"
    }
