'''
Author: XDTEAM
Date: 2026-01-29 22:05:32
LastEditTime: 2026-01-30 20:09:01
LastEditors: XDTEAM
Description: 
'''
import os
from tortoise import Tortoise

# 数据库配置 - 使用 SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite://./email_admin.db")

# Tortoise ORM 配置
TORTOISE_ORM = {
    "connections": {
        "default": DATABASE_URL
    },
    "apps": {
        "models": {
            "models": ["app.models.account", "app.models.email", "app.models.user", "app.models.token", "aerich.models"],
            "default_connection": "default",
        },
    },
    "use_tz": False,
    "timezone": "Asia/Shanghai",
}


async def init_db():
    """初始化数据库连接"""
    await Tortoise.init(config=TORTOISE_ORM)
    # 生成数据库表
    await Tortoise.generate_schemas()


async def close_db():
    """关闭数据库连接"""
    await Tortoise.close_connections()
