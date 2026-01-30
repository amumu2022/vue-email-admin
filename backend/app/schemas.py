'''
Author: XDTEAM
Date: 2026-01-29 22:07:23
LastEditTime: 2026-01-29 22:34:54
LastEditors: XDTEAM
Description: Pydantic Schemas
'''
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime


# ==================== 通用响应 ====================

class ApiResponse(BaseModel):
    """通用 API 响应"""
    success: bool = True
    data: Optional[Any] = None
    message: Optional[str] = None


# ==================== 账户相关 ====================

class AccountBase(BaseModel):
    """账户基础模型"""
    name: str = Field(..., min_length=1, max_length=100, description="账户名称")
    email: EmailStr = Field(..., description="邮箱地址")
    provider: str = Field(..., description="邮箱提供商")
    imap_host: str = Field(..., alias="imapHost", description="IMAP服务器地址")
    imap_port: int = Field(993, alias="imapPort", description="IMAP端口")
    smtp_host: str = Field(..., alias="smtpHost", description="SMTP服务器地址")
    smtp_port: int = Field(587, alias="smtpPort", description="SMTP端口")
    use_ssl: bool = Field(True, alias="useSSL", description="是否使用SSL")

    class Config:
        populate_by_name = True


class AccountCreate(AccountBase):
    """创建账户请求"""
    password: str = Field(..., min_length=1, description="邮箱密码")


class AccountUpdate(BaseModel):
    """更新账户请求"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="账户名称")
    password: Optional[str] = Field(None, description="邮箱密码")
    imap_host: Optional[str] = Field(None, alias="imapHost", description="IMAP服务器地址")
    imap_port: Optional[int] = Field(None, alias="imapPort", description="IMAP端口")
    smtp_host: Optional[str] = Field(None, alias="smtpHost", description="SMTP服务器地址")
    smtp_port: Optional[int] = Field(None, alias="smtpPort", description="SMTP端口")
    use_ssl: Optional[bool] = Field(None, alias="useSSL", description="是否使用SSL")
    is_active: Optional[bool] = Field(None, alias="isActive", description="是否启用")

    class Config:
        populate_by_name = True


class AccountResponse(BaseModel):
    """账户响应"""
    id: str
    name: str
    email: str
    provider: str
    imapHost: str
    imapPort: int
    smtpHost: str
    smtpPort: int
    useSSL: bool
    isActive: bool
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


# ==================== 测试连接 ====================

class TestConnectionResponse(BaseModel):
    """测试连接响应"""
    success: bool
    message: str


# ==================== 同步响应 ====================

class SyncResponse(BaseModel):
    """同步响应"""
    syncedCount: int


# ==================== 文件夹响应 ====================

class FolderResponse(BaseModel):
    """文件夹响应"""
    name: str
    flags: List[str] = []
    delimiter: str = "/"


# ==================== 邮件相关 ====================

class EmailAddress(BaseModel):
    """邮件地址"""
    name: Optional[str] = None
    address: str


class AttachmentResponse(BaseModel):
    """附件响应"""
    id: str
    filename: str
    contentType: Optional[str] = None
    size: int = 0


class EmailResponse(BaseModel):
    """邮件响应"""
    id: str
    accountId: str
    messageId: Optional[str] = None
    from_: Optional[EmailAddress] = Field(None, alias="from")
    to: List[EmailAddress] = []
    cc: Optional[List[EmailAddress]] = None
    bcc: Optional[List[EmailAddress]] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    bodyHtml: Optional[str] = None
    date: Optional[str] = None
    isRead: bool = False
    isStarred: bool = False
    hasAttachments: bool = False
    attachments: Optional[List[AttachmentResponse]] = None
    folder: str = "INBOX"
    labels: Optional[List[str]] = None

    class Config:
        populate_by_name = True


class EmailListResponse(BaseModel):
    """邮件列表响应"""
    items: List[EmailResponse]
    total: int
    page: int
    pageSize: int
    totalPages: int
