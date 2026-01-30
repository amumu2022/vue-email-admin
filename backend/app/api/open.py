'''
Author: XDTEAM
Date: 2026-01-30
Description: 开放 API - 需要令牌认证
'''
from fastapi import APIRouter, HTTPException, Query, Request, Depends
from typing import Optional
from datetime import datetime
import math

from app.models import EmailAccount, Email, ApiToken
from app.schemas import ApiResponse
from app.logger import logger

router = APIRouter()


# ==================== 令牌验证依赖 ====================

async def verify_api_token(request: Request) -> ApiToken:
    """
    验证 API 令牌
    - 从请求头 Authorization: Bearer <token> 或查询参数 token 获取令牌
    - 验证令牌是否存在、是否启用、是否过期
    - 验证 IP 白名单
    """
    # 获取令牌
    token_value = None
    
    # 优先从 Authorization 头获取
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token_value = auth_header[7:]
    
    # 其次从查询参数获取
    if not token_value:
        token_value = request.query_params.get("token")
    
    if not token_value:
        logger.warning(f"开放API: 缺少令牌，IP: {get_client_ip(request)}")
        raise HTTPException(
            status_code=401, 
            detail="缺少 API 令牌，请在 Authorization 头或 token 参数中提供"
        )
    
    # 查找令牌
    token = await ApiToken.get_or_none(token=token_value)
    
    if not token:
        logger.warning(f"开放API: 无效令牌，IP: {get_client_ip(request)}")
        raise HTTPException(status_code=401, detail="无效的 API 令牌")
    
    # 检查是否启用
    if not token.is_active:
        logger.warning(f"开放API: 令牌已禁用 {token.name}，IP: {get_client_ip(request)}")
        raise HTTPException(status_code=401, detail="API 令牌已被禁用")
    
    # 检查是否过期
    if token.expires_at and token.expires_at < datetime.utcnow():
        logger.warning(f"开放API: 令牌已过期 {token.name}，IP: {get_client_ip(request)}")
        raise HTTPException(status_code=401, detail="API 令牌已过期")
    
    # 检查 IP 白名单
    client_ip = get_client_ip(request)
    if token.ip_whitelist:
        allowed_ips = [ip.strip() for ip in token.ip_whitelist.split(",") if ip.strip()]
        if allowed_ips and client_ip not in allowed_ips:
            logger.warning(f"开放API: IP不在白名单 {token.name}，IP: {client_ip}")
            raise HTTPException(
                status_code=403, 
                detail=f"IP 地址 {client_ip} 不在白名单中"
            )
    
    # 更新最后使用时间
    token.last_used_at = datetime.utcnow()
    await token.save()
    
    logger.info(f"开放API: 令牌验证成功 {token.name}，IP: {client_ip}")
    
    return token


def get_client_ip(request: Request) -> str:
    """获取客户端真实 IP"""
    # 优先从 X-Forwarded-For 获取
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    # 其次从 X-Real-IP 获取
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # 最后从连接获取
    if request.client:
        return request.client.host
    
    return "unknown"


# ==================== 辅助函数 ====================

def account_to_public_response(account: EmailAccount) -> dict:
    """将账户模型转换为公开响应格式（不包含敏感信息）"""
    return {
        "id": account.id,
        "name": account.name,
        "email": account.email,
        "provider": account.provider,
        "isActive": account.is_active,
        "createdAt": account.created_at.isoformat() if account.created_at else None
    }


async def email_to_public_response(email: Email, include_content: bool = True) -> dict:
    """将邮件模型转换为公开响应格式（不包含图片）"""
    result = {
        "id": email.id,
        "accountId": email.account_id,
        "messageId": email.message_id,
        "from": email.from_address,
        "to": email.to_addresses,
        "cc": email.cc_addresses,
        "subject": email.subject,
        "date": email.date.isoformat() if email.date else None,
        "isRead": email.is_read,
        "hasAttachments": email.has_attachments,
        "folder": email.folder
    }
    
    if include_content:
        result["body"] = email.body  # 纯文本内容
        result["bodyHtml"] = email.body_html  # HTML内容（不包含内嵌图片）
    
    return result


# ==================== API 路由 ====================

@router.get("/accounts", response_model=ApiResponse)
async def get_public_accounts(token: ApiToken = Depends(verify_api_token)):
    """
    获取已添加的邮箱列表
    
    需要提供有效的 API 令牌进行认证。
    
    认证方式：
    - Header: Authorization: Bearer <token>
    - Query: ?token=<token>
    
    返回所有已添加的邮箱账户列表（不包含密码等敏感信息）
    """
    accounts = await EmailAccount.filter(is_active=True).order_by("-created_at")
    
    logger.info(f"开放API[{token.name}]: 获取邮箱列表，共 {len(accounts)} 个账户")
    
    return {
        "success": True,
        "data": [account_to_public_response(acc) for acc in accounts]
    }


@router.get("/accounts/{email_address}/emails", response_model=ApiResponse)
async def get_emails_by_account(
    email_address: str,
    limit: int = Query(default=10, ge=1, le=100, description="获取数量，最大100"),
    page: int = Query(default=1, ge=1, description="页码"),
    token: ApiToken = Depends(verify_api_token)
):
    """
    获取指定邮箱的邮件列表
    
    需要提供有效的 API 令牌进行认证。
    
    根据邮箱地址获取该邮箱最近的邮件，包含txt内容及html内容，不包含图片
    
    - **email_address**: 邮箱地址
    - **limit**: 每页数量，默认10，最大100
    - **page**: 页码，默认1
    """
    # 查找账户
    account = await EmailAccount.get_or_none(email=email_address)
    
    if not account:
        raise HTTPException(status_code=404, detail=f"邮箱 {email_address} 不存在")
    
    # 获取邮件总数
    total = await Email.filter(account_id=account.id).count()
    
    # 分页获取邮件
    offset = (page - 1) * limit
    emails = await Email.filter(account_id=account.id).order_by("-date").offset(offset).limit(limit)
    
    total_pages = math.ceil(total / limit) if total > 0 else 0
    
    logger.info(f"开放API[{token.name}]: 获取邮箱 {email_address} 的邮件，第{page}页，共 {len(emails)} 封")
    
    return {
        "success": True,
        "data": {
            "account": account_to_public_response(account),
            "items": [await email_to_public_response(e) for e in emails],
            "total": total,
            "page": page,
            "pageSize": limit,
            "totalPages": total_pages
        }
    }


@router.get("/emails", response_model=ApiResponse)
async def get_all_emails(
    limit: int = Query(default=10, ge=1, le=100, description="获取数量，最大100"),
    page: int = Query(default=1, ge=1, description="页码"),
    token: ApiToken = Depends(verify_api_token)
):
    """
    获取全部邮箱的邮件列表
    
    需要提供有效的 API 令牌进行认证。
    
    获取所有邮箱账户的最近邮件，包含txt内容及html内容，不包含图片
    
    - **limit**: 每页数量，默认10，最大100
    - **page**: 页码，默认1
    """
    # 获取邮件总数
    total = await Email.all().count()
    
    # 分页获取邮件
    offset = (page - 1) * limit
    emails = await Email.all().order_by("-date").offset(offset).limit(limit)
    
    total_pages = math.ceil(total / limit) if total > 0 else 0
    
    logger.info(f"开放API[{token.name}]: 获取全部邮件，第{page}页，共 {len(emails)} 封")
    
    return {
        "success": True,
        "data": {
            "items": [await email_to_public_response(e) for e in emails],
            "total": total,
            "page": page,
            "pageSize": limit,
            "totalPages": total_pages
        }
    }


@router.get("/emails/{email_id}", response_model=ApiResponse)
async def get_email_detail(
    email_id: str,
    token: ApiToken = Depends(verify_api_token)
):
    """
    获取单封邮件详情
    
    需要提供有效的 API 令牌进行认证。
    
    根据邮件ID获取邮件详情，包含txt内容及html内容，不包含图片
    
    - **email_id**: 邮件ID
    """
    email = await Email.get_or_none(id=email_id)
    
    if not email:
        raise HTTPException(status_code=404, detail="邮件不存在")
    
    logger.info(f"开放API[{token.name}]: 获取邮件详情 {email_id}")
    
    return {
        "success": True,
        "data": await email_to_public_response(email)
    }
