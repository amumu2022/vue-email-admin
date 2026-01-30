/*
 * @Author: XDTEAM
 * @Date: 2026-01-29 21:56:49
 * @LastEditTime: 2026-01-29 21:56:55
 * @LastEditors: XDTEAM
 * @Description: 
 */
import request from './request'
import type { EmailAccount, AccountFormData, ApiResponse } from '@/types'

// 获取所有邮箱账户
export function getAccounts(): Promise<ApiResponse<EmailAccount[]>> {
  return request.get('/accounts')
}

// 获取单个邮箱账户
export function getAccount(id: string): Promise<ApiResponse<EmailAccount>> {
  return request.get(`/accounts/${id}`)
}

// 创建邮箱账户
export function createAccount(data: AccountFormData): Promise<ApiResponse<EmailAccount>> {
  return request.post('/accounts', data)
}

// 更新邮箱账户
export function updateAccount(id: string, data: Partial<AccountFormData>): Promise<ApiResponse<EmailAccount>> {
  return request.put(`/accounts/${id}`, data)
}

// 删除邮箱账户
export function deleteAccount(id: string): Promise<ApiResponse<null>> {
  return request.delete(`/accounts/${id}`)
}

// 测试邮箱账户连接
export function testAccountConnection(data: AccountFormData): Promise<ApiResponse<{ success: boolean; message: string }>> {
  return request.post('/accounts/test-connection', data)
}

// 同步邮箱账户邮件
export function syncAccount(id: string): Promise<ApiResponse<{ syncedCount: number }>> {
  return request.post(`/accounts/${id}/sync`)
}

// 切换账户激活状态
export function toggleAccountActive(id: string, isActive: boolean): Promise<ApiResponse<EmailAccount>> {
  return request.patch(`/accounts/${id}/active`, { isActive })
}
