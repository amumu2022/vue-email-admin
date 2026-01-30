'''
Author: XDTEAM
Date: 2026-01-29
Description: 日志配置 - 使用 loguru
'''
import sys
import os
from loguru import logger

# 日志目录
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")

# 确保日志目录存在
os.makedirs(LOG_DIR, exist_ok=True)

# 移除默认的 handler
logger.remove()

# 添加控制台输出（简洁格式）
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | {message}",
    level="INFO",
    colorize=True
)

# 添加文件输出（按日期分割）
logger.add(
    os.path.join(LOG_DIR, "{time:YYYY-MM-DD}.log"),
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level="DEBUG",
    rotation="00:00",  # 每天午夜轮换
    retention="30 days",  # 保留30天
    encoding="utf-8",
    enqueue=True  # 异步写入
)

# 导出 logger
__all__ = ["logger"]
