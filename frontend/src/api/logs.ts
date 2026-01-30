/*
 * @Author: XDTEAM
 * @Date: 2026-01-29 22:38:00
 * @LastEditTime: 2026-01-30 20:18:08
 * @LastEditors: XDTEAM
 * @Description: 访问日志 API
 */
import request from './request'

export interface AccessLog {
  id: string
  userId?: string
  username?: string
  ipAddress: string
  method: string
  path: string
  statusCode?: number
  userAgent?: string
  createdAt?: string
}

export interface AccessLogListResponse {
  items: AccessLog[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface GetLogsParams {
  page?: number
  pageSize?: number
  username?: string
  ipAddress?: string
  path?: string
  logType?: 'open_api' | 'login' | 'other'
}

// 获取访问日志列表（管理员）
export function getAccessLogs(params: GetLogsParams = {}) {
  return request.get<any, { success: boolean; data: AccessLogListResponse }>('/logs', { params })
}

// 获取当前用户的访问日志
export function getMyAccessLogs(params: { page?: number; pageSize?: number } = {}) {
  return request.get<any, { success: boolean; data: AccessLogListResponse }>('/logs/my', { params })
}

// 删除访问日志（管理员）
export function deleteAccessLog(logId: string) {
  return request.delete<any, { success: boolean; message?: string }>(`/logs/${logId}`)
}

// 清除旧访问日志（管理员）
export function clearAccessLogs(days: number = 30) {
  return request.delete<any, { success: boolean; data: { deletedCount: number }; message?: string }>('/logs', { params: { days } })
}
