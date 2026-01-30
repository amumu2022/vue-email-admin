'''
Author: XDTEAM
Date: 2026-01-30
Description: API令牌模型 - Tortoise ORM
'''
from tortoise import fields
from tortoise.models import Model
import uuid
import secrets


class ApiToken(Model):
    """API令牌模型"""
    
    class Meta:
        table = "api_tokens"
        ordering = ["-created_at"]
    
    id = fields.CharField(pk=True, max_length=36, default=lambda: str(uuid.uuid4()))
    name = fields.CharField(max_length=100, description="令牌名称")
    token = fields.CharField(max_length=32, unique=True, description="令牌值")
    is_active = fields.BooleanField(default=True, description="是否启用")
    ip_whitelist = fields.TextField(null=True, description="IP白名单，多个IP用逗号分隔")
    expires_at = fields.DatetimeField(null=True, description="过期时间")
    created_by = fields.CharField(max_length=36, null=True, description="创建者ID")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")
    last_used_at = fields.DatetimeField(null=True, description="最后使用时间")

    @classmethod
    def generate_token(cls) -> str:
        """生成安全的随机令牌"""
        return secrets.token_hex(8)  # 16字符的十六进制字符串

    def __str__(self):
        return f"<ApiToken(id={self.id}, name={self.name})>"
