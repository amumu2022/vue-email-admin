'''
Author: XDTEAM
Date: 2026-01-30 19:43:55
LastEditTime: 2026-01-30 19:44:00
LastEditors: XDTEAM
Description: 
'''
'''
Author: XDTEAM
Date: 2026-01-30
Description: 统计数据 API
'''
from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from tortoise.functions import Count

from app.models import EmailAccount, Email, User
from app.schemas import ApiResponse
from app.utils import get_current_user

router = APIRouter()


@router.get("/dashboard", response_model=ApiResponse)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """获取仪表盘统计数据"""
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = today_start.replace(day=1)
    
    # 邮箱账户数量
    account_count = await EmailAccount.all().count()
    
    # 总邮件数
    total_emails = await Email.all().count()
    
    # 未读邮件数
    unread_emails = await Email.filter(is_read=False).count()
    
    # 今日邮件数
    today_emails = await Email.filter(date__gte=today_start).count()
    
    # 本周邮件数
    week_emails = await Email.filter(date__gte=week_start).count()
    
    # 本月邮件数
    month_emails = await Email.filter(date__gte=month_start).count()
    
    # 各账户邮件统计
    accounts = await EmailAccount.all()
    account_stats = []
    for account in accounts:
        email_count = await Email.filter(account_id=account.id).count()
        unread_count = await Email.filter(account_id=account.id, is_read=False).count()
        account_stats.append({
            "id": account.id,
            "name": account.name,
            "email": account.email,
            "provider": account.provider,
            "emailCount": email_count,
            "unreadCount": unread_count,
            "isActive": account.is_active
        })
    
    # 最近7天每日邮件数量
    daily_stats = []
    for i in range(6, -1, -1):
        day_start = today_start - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        count = await Email.filter(date__gte=day_start, date__lt=day_end).count()
        daily_stats.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "count": count
        })
    
    return {
        "success": True,
        "data": {
            "accountCount": account_count,
            "totalEmails": total_emails,
            "unreadEmails": unread_emails,
            "todayEmails": today_emails,
            "weekEmails": week_emails,
            "monthEmails": month_emails,
            "accountStats": account_stats,
            "dailyStats": daily_stats
        }
    }
