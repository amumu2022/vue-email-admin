'''
Author: XDTEAM
Date: 2026-01-29 22:05:56
LastEditTime: 2026-01-29 22:06:04
LastEditors: XDTEAM
Description: 邮箱账户模型 - Tortoise ORM
'''
from tortoise import fields
from tortoise.models import Model
import uuid


class EmailAccount(Model):
    """邮箱账户模型"""
    
    class Meta:
        table = "email_accounts"
    
    id = fields.CharField(pk=True, max_length=36, default=lambda: str(uuid.uuid4()))
    name = fields.CharField(max_length=100, description="账户名称")
    email = fields.CharField(max_length=255, unique=True, description="邮箱地址")
    provider = fields.CharField(max_length=50, description="邮箱提供商")
    password = fields.CharField(max_length=500, description="加密后的密码")
    imap_host = fields.CharField(max_length=255, description="IMAP服务器地址")
    imap_port = fields.IntField(default=993, description="IMAP端口")
    smtp_host = fields.CharField(max_length=255, description="SMTP服务器地址")
    smtp_port = fields.IntField(default=587, description="SMTP端口")
    use_ssl = fields.BooleanField(default=True, description="是否使用SSL")
    is_active = fields.BooleanField(default=True, description="是否启用")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")

    def __str__(self):
        return f"<EmailAccount(id={self.id}, email={self.email})>"
