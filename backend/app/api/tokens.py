'''
Author: XDTEAM
Date: 2026-01-30
Description: API令牌管理路由
'''
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from app.models import ApiToken, User
from app.schemas import ApiResponse
from app.utils.auth import get_current_user
from app.logger import logger

router = APIRouter()


# ==================== Pydantic Schemas ====================

class TokenCreate(BaseModel):
    """创建令牌请求"""
    name: str = Field(..., min_length=1, max_length=100, description="令牌名称")
    ip_whitelist: Optional[str] = Field(None, alias="ipWhitelist", description="IP白名单，多个IP用逗号分隔")
    expires_at: Optional[datetime] = Field(None, alias="expiresAt", description="过期时间")

    class Config:
        populate_by_name = True


class TokenUpdate(BaseModel):
    """更新令牌请求"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="令牌名称")
    ip_whitelist: Optional[str] = Field(None, alias="ipWhitelist", description="IP白名单")
    expires_at: Optional[datetime] = Field(None, alias="expiresAt", description="过期时间")
    is_active: Optional[bool] = Field(None, alias="isActive", description="是否启用")

    class Config:
        populate_by_name = True


class TokenResponse(BaseModel):
    """令牌响应"""
    id: str
    name: str
    token: str
    isActive: bool
    ipWhitelist: Optional[str] = None
    expiresAt: Optional[str] = None
    createdAt: Optional[str] = None
    lastUsedAt: Optional[str] = None


# ==================== Helper Functions ====================

def token_to_response(token: ApiToken, mask_token: bool = True) -> dict:
    """将令牌模型转换为响应格式"""
    token_value = token.token
    if mask_token and len(token_value) > 6:
        # 隐藏令牌中间部分，只显示前3位和后3位
        token_value = token_value[:3] + '*' * (len(token_value) - 6) + token_value[-3:]
    
    return {
        "id": token.id,
        "name": token.name,
        "token": token_value,
        "isActive": token.is_active,
        "ipWhitelist": token.ip_whitelist,
        "expiresAt": token.expires_at.isoformat() if token.expires_at else None,
        "createdAt": token.created_at.isoformat() if token.created_at else None,
        "lastUsedAt": token.last_used_at.isoformat() if token.last_used_at else None
    }


# ==================== API Routes ====================

@router.get("", response_model=ApiResponse)
async def get_tokens(current_user: User = Depends(get_current_user)):
    """获取所有令牌列表"""
    tokens = await ApiToken.all().order_by("-created_at")
    
    return {
        "success": True,
        "data": [token_to_response(t) for t in tokens]
    }


@router.get("/{token_id}", response_model=ApiResponse)
async def get_token(token_id: str, current_user: User = Depends(get_current_user)):
    """获取单个令牌详情"""
    token = await ApiToken.get_or_none(id=token_id)
    
    if not token:
        raise HTTPException(status_code=404, detail="令牌不存在")
    
    return {
        "success": True,
        "data": token_to_response(token)
    }


@router.get("/{token_id}/reveal", response_model=ApiResponse)
async def reveal_token(token_id: str, current_user: User = Depends(get_current_user)):
    """显示完整令牌（不隐藏）"""
    token = await ApiToken.get_or_none(id=token_id)
    
    if not token:
        raise HTTPException(status_code=404, detail="令牌不存在")
    
    return {
        "success": True,
        "data": token_to_response(token, mask_token=False)
    }


@router.post("", response_model=ApiResponse)
async def create_token(data: TokenCreate, current_user: User = Depends(get_current_user)):
    """创建新令牌"""
    # 检查是否为管理员
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="只有管理员可以创建令牌")
    
    # 生成令牌
    token_value = ApiToken.generate_token()
    
    # 创建令牌
    token = await ApiToken.create(
        name=data.name,
        token=token_value,
        ip_whitelist=data.ip_whitelist,
        expires_at=data.expires_at,
        created_by=current_user.id
    )
    
    # 返回时显示完整令牌（仅创建时）
    return {
        "success": True,
        "data": token_to_response(token, mask_token=False),
        "message": "令牌创建成功，请妥善保存令牌值"
    }


@router.put("/{token_id}", response_model=ApiResponse)
async def update_token(
    token_id: str, 
    data: TokenUpdate, 
    current_user: User = Depends(get_current_user)
):
    """更新令牌"""
    # 检查是否为管理员
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="只有管理员可以更新令牌")
    
    token = await ApiToken.get_or_none(id=token_id)
    
    if not token:
        raise HTTPException(status_code=404, detail="令牌不存在")
    
    # 更新字段
    update_data = data.model_dump(exclude_unset=True, by_alias=False)
    
    if update_data:
        for key, value in update_data.items():
            setattr(token, key, value)
        await token.save()
    
    return {
        "success": True,
        "data": token_to_response(token),
        "message": "令牌更新成功"
    }


@router.patch("/{token_id}/toggle", response_model=ApiResponse)
async def toggle_token(token_id: str, current_user: User = Depends(get_current_user)):
    """切换令牌启用/禁用状态"""
    # 检查是否为管理员
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="只有管理员可以操作令牌")
    
    token = await ApiToken.get_or_none(id=token_id)
    
    if not token:
        raise HTTPException(status_code=404, detail="令牌不存在")
    
    token.is_active = not token.is_active
    await token.save()
    
    status = "启用" if token.is_active else "禁用"
    return {
        "success": True,
        "data": token_to_response(token),
        "message": f"令牌已{status}"
    }


@router.delete("/{token_id}", response_model=ApiResponse)
async def delete_token(token_id: str, current_user: User = Depends(get_current_user)):
    """删除令牌"""
    # 检查是否为管理员
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="只有管理员可以删除令牌")
    
    token = await ApiToken.get_or_none(id=token_id)
    
    if not token:
        raise HTTPException(status_code=404, detail="令牌不存在")
    
    token_name = token.name
    await token.delete()
    
    return {
        "success": True,
        "message": "令牌删除成功"
    }


@router.post("/{token_id}/regenerate", response_model=ApiResponse)
async def regenerate_token(token_id: str, current_user: User = Depends(get_current_user)):
    """重新生成令牌值"""
    # 检查是否为管理员
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="只有管理员可以重新生成令牌")
    
    token = await ApiToken.get_or_none(id=token_id)
    
    if not token:
        raise HTTPException(status_code=404, detail="令牌不存在")
    
    # 生成新令牌
    token.token = ApiToken.generate_token()
    await token.save()
    
    # 返回时显示完整令牌
    return {
        "success": True,
        "data": token_to_response(token, mask_token=False),
        "message": "令牌已重新生成，请妥善保存新的令牌值"
    }
