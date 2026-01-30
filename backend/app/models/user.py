'''
Author: XDTEAM
Date: 2026-01-29 22:05:56
LastEditTime: 2026-01-29 22:38:29
LastEditors: XDTEAM
Description: 用户模型 - Tortoise ORM
'''
from tortoise import fields
from tortoise.models import Model
import uuid


class User(Model):
    """用户模型"""
    
    class Meta:
        table = "users"
    
    id = fields.CharField(pk=True, max_length=36, default=lambda: str(uuid.uuid4()))
    username = fields.CharField(max_length=50, unique=True, description="用户名")
    password_hash = fields.CharField(max_length=255, description="密码哈希")
    email = fields.CharField(max_length=255, null=True, description="邮箱")
    is_active = fields.BooleanField(default=True, description="是否启用")
    is_admin = fields.BooleanField(default=False, description="是否管理员")
    last_login = fields.DatetimeField(null=True, description="最后登录时间")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")

    def __str__(self):
        return f"<User(id={self.id}, username={self.username})>"


class AccessLog(Model):
    """访问日志模型"""
    
    class Meta:
        table = "access_logs"
        ordering = ["-created_at"]
    
    id = fields.CharField(pk=True, max_length=36, default=lambda: str(uuid.uuid4()))
    user_id = fields.CharField(max_length=36, null=True, description="用户ID")
    username = fields.CharField(max_length=50, null=True, description="用户名")
    ip_address = fields.CharField(max_length=45, description="IP地址")
    method = fields.CharField(max_length=10, description="请求方法")
    path = fields.CharField(max_length=500, description="请求路径")
    status_code = fields.IntField(null=True, description="响应状态码")
    user_agent = fields.CharField(max_length=500, null=True, description="用户代理")
    created_at = fields.DatetimeField(auto_now_add=True, description="访问时间")

    def __str__(self):
        return f"<AccessLog(id={self.id}, username={self.username}, path={self.path})>"
