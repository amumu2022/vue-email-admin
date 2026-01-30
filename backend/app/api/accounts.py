from fastapi import APIRouter, HTTPException, Depends

from app.models import EmailAccount, User
from app.schemas import (
    AccountCreate,
    AccountUpdate,
    AccountResponse,
    ApiResponse,
    TestConnectionResponse,
    SyncResponse,
    FolderResponse
)
from app.utils import encrypt_password, decrypt_password, EmailService, get_current_user

router = APIRouter()


def account_to_response(account: EmailAccount) -> dict:
    """将账户模型转换为响应格式"""
    return {
        "id": account.id,
        "name": account.name,
        "email": account.email,
        "provider": account.provider,
        "imapHost": account.imap_host,
        "imapPort": account.imap_port,
        "smtpHost": account.smtp_host,
        "smtpPort": account.smtp_port,
        "useSSL": account.use_ssl,
        "isActive": account.is_active,
        "createdAt": account.created_at.isoformat() if account.created_at else None,
        "updatedAt": account.updated_at.isoformat() if account.updated_at else None
    }


@router.get("", response_model=ApiResponse)
async def get_accounts(current_user: User = Depends(get_current_user)):
    """获取所有邮箱账户"""
    accounts = await EmailAccount.all().order_by("-created_at")
    return {
        "success": True,
        "data": [account_to_response(acc) for acc in accounts]
    }


@router.get("/{account_id}", response_model=ApiResponse)
async def get_account(account_id: str, current_user: User = Depends(get_current_user)):
    """获取单个邮箱账户"""
    account = await EmailAccount.get_or_none(id=account_id)
    
    if not account:
        raise HTTPException(status_code=404, detail="账户不存在")
    
    return {
        "success": True,
        "data": account_to_response(account)
    }


@router.post("", response_model=ApiResponse)
async def create_account(account_data: AccountCreate, current_user: User = Depends(get_current_user)):
    """创建邮箱账户"""
    # 检查邮箱是否已存在
    existing = await EmailAccount.get_or_none(email=account_data.email)
    
    if existing:
        raise HTTPException(status_code=400, detail="该邮箱已存在")
    
    # 加密密码
    encrypted_password = encrypt_password(account_data.password)
    
    # 创建账户
    account = await EmailAccount.create(
        name=account_data.name,
        email=account_data.email,
        provider=account_data.provider,
        password=encrypted_password,
        imap_host=account_data.imap_host,
        imap_port=account_data.imap_port,
        smtp_host=account_data.smtp_host,
        smtp_port=account_data.smtp_port,
        use_ssl=account_data.use_ssl
    )
    
    return {
        "success": True,
        "data": account_to_response(account),
        "message": "账户创建成功"
    }


@router.put("/{account_id}", response_model=ApiResponse)
async def update_account(
    account_id: str,
    account_data: AccountUpdate,
    current_user: User = Depends(get_current_user)
):
    """更新邮箱账户"""
    account = await EmailAccount.get_or_none(id=account_id)
    
    if not account:
        raise HTTPException(status_code=404, detail="账户不存在")
    
    # 更新字段
    update_data = account_data.model_dump(exclude_unset=True, by_alias=False)
    
    for field, value in update_data.items():
        if field == "password" and value:
            value = encrypt_password(value)
        if hasattr(account, field):
            setattr(account, field, value)
    
    await account.save()
    
    return {
        "success": True,
        "data": account_to_response(account),
        "message": "账户更新成功"
    }


@router.delete("/{account_id}", response_model=ApiResponse)
async def delete_account(account_id: str, current_user: User = Depends(get_current_user)):
    """删除邮箱账户"""
    account = await EmailAccount.get_or_none(id=account_id)
    
    if not account:
        raise HTTPException(status_code=404, detail="账户不存在")
    
    await account.delete()
    
    return {
        "success": True,
        "message": "账户删除成功"
    }


@router.post("/test-connection", response_model=ApiResponse)
async def test_connection(account_data: AccountCreate, current_user: User = Depends(get_current_user)):
    """测试邮箱连接"""
    email_service = EmailService(
        host=account_data.imap_host,
        port=account_data.imap_port,
        username=account_data.email,
        password=account_data.password,
        use_ssl=account_data.use_ssl
    )
    
    success, message = email_service.test_connection()
    
    return {
        "success": True,
        "data": {
            "success": success,
            "message": message
        }
    }


@router.post("/{account_id}/sync", response_model=ApiResponse)
async def sync_account(account_id: str, current_user: User = Depends(get_current_user)):
    """同步邮箱账户邮件"""
    account = await EmailAccount.get_or_none(id=account_id)
    
    if not account:
        raise HTTPException(status_code=404, detail="账户不存在")
    
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
    
    if not email_service.connect():
        raise HTTPException(status_code=500, detail="连接邮箱服务器失败")
    
    try:
        # 获取邮件（这里简化处理，实际应该存储到数据库）
        emails, total = email_service.get_emails(limit=50)
        synced_count = len(emails)
    finally:
        email_service.disconnect()
    
    return {
        "success": True,
        "data": {
            "syncedCount": synced_count
        },
        "message": f"同步完成，获取了 {synced_count} 封邮件"
    }


@router.patch("/{account_id}/active", response_model=ApiResponse)
async def toggle_account_active(
    account_id: str,
    data: dict,
    current_user: User = Depends(get_current_user)
):
    """切换账户激活状态"""
    account = await EmailAccount.get_or_none(id=account_id)
    
    if not account:
        raise HTTPException(status_code=404, detail="账户不存在")
    
    account.is_active = data.get("isActive", True)
    await account.save()
    
    return {
        "success": True,
        "data": account_to_response(account)
    }


@router.get("/{account_id}/folders", response_model=ApiResponse)
async def get_account_folders(account_id: str, current_user: User = Depends(get_current_user)):
    """获取账户的邮件文件夹"""
    account = await EmailAccount.get_or_none(id=account_id)
    
    if not account:
        raise HTTPException(status_code=404, detail="账户不存在")
    
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
    
    folders = email_service.get_folders()
    email_service.disconnect()
    
    return {
        "success": True,
        "data": folders
    }
