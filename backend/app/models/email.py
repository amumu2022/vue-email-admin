'''
Author: XDTEAM
Date: 2026-01-29 22:06:24
LastEditTime: 2026-01-30 18:59:23
LastEditors: XDTEAM
Description: 邮件模型 - Tortoise ORM
'''
from tortoise import fields
from tortoise.models import Model
import uuid


class Email(Model):
    """邮件模型"""
    
    class Meta:
        table = "emails"
    
    id = fields.CharField(pk=True, max_length=36, default=lambda: str(uuid.uuid4()))
    account = fields.ForeignKeyField("models.EmailAccount", related_name="emails", description="账户ID")
    message_id = fields.CharField(max_length=255, null=True, description="邮件消息ID")
    from_address = fields.JSONField(description="发件人")
    to_addresses = fields.JSONField(description="收件人列表")
    cc_addresses = fields.JSONField(null=True, description="抄送列表")
    bcc_addresses = fields.JSONField(null=True, description="密送列表")
    subject = fields.CharField(max_length=500, null=True, description="邮件主题")
    body = fields.TextField(null=True, description="邮件正文(纯文本)")
    body_html = fields.TextField(null=True, description="邮件正文(HTML)")
    date = fields.DatetimeField(null=True, description="邮件日期")
    is_read = fields.BooleanField(default=False, description="是否已读")
    is_starred = fields.BooleanField(default=False, description="是否星标")
    has_attachments = fields.BooleanField(default=False, description="是否有附件")
    inline_images = fields.JSONField(null=True, description="内嵌图片 {cid: {content_type, data}}")
    folder = fields.CharField(max_length=100, default="INBOX", description="文件夹")
    labels = fields.JSONField(null=True, description="标签列表")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")

    def __str__(self):
        return f"<Email(id={self.id}, subject={self.subject})>"


class Attachment(Model):
    """附件模型"""
    
    class Meta:
        table = "attachments"
    
    id = fields.CharField(pk=True, max_length=36, default=lambda: str(uuid.uuid4()))
    email = fields.ForeignKeyField("models.Email", related_name="attachments", description="邮件ID")
    filename = fields.CharField(max_length=255, description="文件名")
    content_type = fields.CharField(max_length=100, null=True, description="内容类型")
    size = fields.IntField(default=0, description="文件大小(字节)")
    content = fields.TextField(null=True, description="文件内容(Base64)")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")

    def __str__(self):
        return f"<Attachment(id={self.id}, filename={self.filename})>"
