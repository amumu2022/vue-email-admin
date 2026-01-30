/*
 * @Author: XDTEAM
 * @Date: 2026-01-30
 * @Description: 统计数据 API
 */
import request from './request'
import type { ApiResponse } from '@/types'

// 仪表盘统计数据类型
export interface DashboardStats {
  accountCount: number
  totalEmails: number
  unreadEmails: number
  todayEmails: number
  weekEmails: number
  monthEmails: number
  accountStats: AccountStat[]
  dailyStats: DailyStat[]
}

export interface AccountStat {
  id: string
  name: string
  email: string
  provider: string
  emailCount: number
  unreadCount: number
  isActive: boolean
}

export interface DailyStat {
  date: string
  count: number
}

// 获取仪表盘统计数据
export function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  return request.get('/stats/dashboard')
}
