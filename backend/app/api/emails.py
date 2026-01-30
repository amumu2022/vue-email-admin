from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse
from typing import Optional, List
from tortoise.expressions import Q
import io
import math

from app.models import EmailAccount, Email, Attachment, User
from app.schemas import ApiResponse
from app.utils import decrypt_password, EmailService, get_current_user
from app.logger import logger

router = APIRouter()


async def email_to_response(email: Email) -> dict:
    """将邮件模型转换为响应格式"""
    attachments = None
    email_attachments = await email.attachments.all()
    if email_attachments:
        attachments = [
            {
                "id": att.id,
                "filename": att.filename,
                "contentType": att.content_type,
                "size": att.size
            }
            for att in email_attachments
        ]
    
    return {
        "id": email.id,
        "accountId": email.account_id,
        "messageId": email.message_id,
        "from": email.from_address,
        "to": email.to_addresses,
        "cc": email.cc_addresses,
        "bcc": email.bcc_addresses,
        "subject": email.subject,
        "body": email.body,
        "bodyHtml": email.body_html,
        "date": email.date.isoformat() if email.date else None,
        "isRead": email.is_read,
        "isStarred": email.is_starred,
        "hasAttachments": email.has_attachments,
        "attachments": attachments,
        "inlineImages": getattr(email, 'inline_images', None),
        "folder": email.folder,
        "labels": email.labels
    }


@router.get("", response_model=ApiResponse)
async def get_emails(
    account_id: Optional[str] = Query(None, alias="accountId"),
    folder: str = Query("INBOX"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize"),
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """获取邮件列表"""
    query = Email.all()
    
    if account_id:
        query = query.filter(account_id=account_id)
    
    if folder:
        query = query.filter(folder=folder)
    
    if search:
        query = query.filter(
            Q(subject__icontains=search) | Q(body__icontains=search)
        )
    
    # 获取总数
    total = await query.count()
    
    # 分页
    offset = (page - 1) * page_size
    emails = await query.order_by("-date").offset(offset).limit(page_size)
    
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    
    return {
        "success": True,
        "data": {
            "items": [await email_to_response(e) for e in emails],
            "total": total,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages
        }
    }


@router.get("/{email_id}", response_model=ApiResponse)
async def get_email(email_id: str, current_user: User = Depends(get_current_user)):
    """获取单封邮件详情"""
    email = await Email.get_or_none(id=email_id)
    
    if not email:
        raise HTTPException(status_code=404, detail="邮件不存在")
    
    return {
        "success": True,
        "data": await email_to_response(email)
    }


@router.patch("/{email_id}/read", response_model=ApiResponse)
async def mark_email_read(
    email_id: str,
    data: dict,
    current_user: User = Depends(get_current_user)
):
    """标记邮件为已读/未读"""
    email = await Email.get_or_none(id=email_id)
    
    if not email:
        raise HTTPException(status_code=404, detail="邮件不存在")
    
    email.is_read = data.get("isRead", True)
    await email.save()
    
    return {
        "success": True,
        "data": await email_to_response(email)
    }


@router.post("/batch/read", response_model=ApiResponse)
async def batch_mark_read(data: dict, current_user: User = Depends(get_current_user)):
    """批量标记邮件为已读/未读"""
    ids = data.get("ids", [])
    is_read = data.get("isRead", True)
    
    if not ids:
        raise HTTPException(status_code=400, detail="请提供邮件ID列表")
    
    emails = await Email.filter(id__in=ids)
    
    for email in emails:
        email.is_read = is_read
        await email.save()
    
    return {
        "success": True,
        "message": f"已更新 {len(emails)} 封邮件"
    }


@router.patch("/{email_id}/starred", response_model=ApiResponse)
async def mark_email_starred(
    email_id: str,
    data: dict,
    current_user: User = Depends(get_current_user)
):
    """标记邮件为星标/取消星标"""
    email = await Email.get_or_none(id=email_id)
    
    if not email:
        raise HTTPException(status_code=404, detail="邮件不存在")
    
    email.is_starred = data.get("isStarred", True)
    await email.save()
    
    return {
        "success": True,
        "data": await email_to_response(email)
    }


@router.delete("/{email_id}", response_model=ApiResponse)
async def delete_email(email_id: str, current_user: User = Depends(get_current_user)):
    """删除邮件"""
    email = await Email.get_or_none(id=email_id)
    
    if not email:
        raise HTTPException(status_code=404, detail="邮件不存在")
    
    await email.delete()
    
    return {
        "success": True,
        "message": "邮件删除成功"
    }


@router.post("/batch/delete", response_model=ApiResponse)
async def batch_delete_emails(data: dict, current_user: User = Depends(get_current_user)):
    """批量删除邮件"""
    ids = data.get("ids", [])
    
    if not ids:
        raise HTTPException(status_code=400, detail="请提供邮件ID列表")
    
    emails = await Email.filter(id__in=ids)
    count = len(emails)
    
    for email in emails:
        await email.delete()
    
    return {
        "success": True,
        "message": f"已删除 {count} 封邮件"
    }


@router.patch("/{email_id}/move", response_model=ApiResponse)
async def move_email(
    email_id: str,
    data: dict,
    current_user: User = Depends(get_current_user)
):
    """移动邮件到文件夹"""
    email = await Email.get_or_none(id=email_id)
    
    if not email:
        raise HTTPException(status_code=404, detail="邮件不存在")
    
    folder = data.get("folder")
    if not folder:
        raise HTTPException(status_code=400, detail="请提供目标文件夹")
    
    email.folder = folder
    await email.save()
    
    return {
        "success": True,
        "data": await email_to_response(email)
    }


@router.post("/refresh", response_model=ApiResponse)
async def refresh_emails(
    data: dict = None,
    current_user: User = Depends(get_current_user)
):
    """刷新邮件（从服务器获取新邮件）"""
    account_id = data.get("accountId") if data else None
    
    # 获取账户
    if account_id:
        account = await EmailAccount.get_or_none(id=account_id)
        if not account:
            raise HTTPException(status_code=404, detail="账户不存在")
        accounts = [account]
    else:
        accounts = await EmailAccount.filter(is_active=True)
    
    new_count = 0
    
    for account in accounts:
        if not account:
            continue
            
        # 解密密码
        password = decrypt_password(account.password)
        
        # 连接邮箱服务器
        email_service = EmailService(
            host=account.imap_host,
            port=account.imap_port,
            username=account.email,
            password=password,
            use_ssl=account.use_ssl
        )
        
        try:
            # 获取邮件（包含正文内容）- get_emails 内部会自动连接
            emails_data, total = email_service.get_emails(limit=20, fetch_body=True)
            logger.success(f"账户 {account.email} 获取到 {len(emails_data)} 封邮件，总计 {total} 封")
            
            for email_data in emails_data:
                # 检查邮件是否已存在
                existing = await Email.get_or_none(
                    account_id=account.id,
                    message_id=email_data.get("message_id")
                )
                if existing:
                    continue
                
                # 创建新邮件
                await Email.create(
                    account_id=account.id,
                    message_id=email_data.get("message_id"),
                    from_address=email_data.get("from"),
                    to_addresses=email_data.get("to", []),
                    cc_addresses=email_data.get("cc"),
                    subject=email_data.get("subject"),
                    body=email_data.get("body"),
                    body_html=email_data.get("body_html"),
                    date=email_data.get("date"),
                    has_attachments=email_data.get("has_attachments", False),
                    inline_images=email_data.get("inline_images"),
                    folder="INBOX"
                )
                new_count += 1
        finally:
            email_service.disconnect()
    
    return {
        "success": True,
        "data": {
            "newCount": new_count
        },
        "message": f"获取了 {new_count} 封新邮件"
    }


@router.get("/{email_id}/attachments/{attachment_id}")
async def download_attachment(
    email_id: str,
    attachment_id: str,
    current_user: User = Depends(get_current_user)
):
    """下载附件"""
    attachment = await Attachment.get_or_none(
        id=attachment_id,
        email_id=email_id
    )
    
    if not attachment:
        raise HTTPException(status_code=404, detail="附件不存在")
    
    # 返回附件内容
    content = attachment.content if attachment.content else b""
    
    return StreamingResponse(
        io.BytesIO(content.encode() if isinstance(content, str) else content),
        media_type=attachment.content_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{attachment.filename}"'
        }
    )
