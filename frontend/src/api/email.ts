/*
 * @Author: XDTEAM
 * @Date: 2026-01-29 21:57:11
 * @LastEditTime: 2026-01-29 21:57:16
 * @LastEditors: XDTEAM
 * @Description: 
 */
import request from './request'
import type { Email, EmailFolder, ApiResponse, PaginatedResponse } from '@/types'

// 获取邮件列表
export function getEmails(params: {
  accountId?: string
  folder?: string
  page?: number
  pageSize?: number
  search?: string
}): Promise<ApiResponse<PaginatedResponse<Email>>> {
  return request.get('/emails', { params })
}

// 获取单封邮件详情
export function getEmail(id: string): Promise<ApiResponse<Email>> {
  return request.get(`/emails/${id}`)
}

// 标记邮件为已读/未读
export function markEmailRead(id: string, isRead: boolean): Promise<ApiResponse<Email>> {
  return request.patch(`/emails/${id}/read`, { isRead })
}

// 批量标记邮件为已读
export function markEmailsRead(ids: string[], isRead: boolean): Promise<ApiResponse<null>> {
  return request.post('/emails/batch/read', { ids, isRead })
}

// 标记邮件为星标/取消星标
export function markEmailStarred(id: string, isStarred: boolean): Promise<ApiResponse<Email>> {
  return request.patch(`/emails/${id}/starred`, { isStarred })
}

// 删除邮件
export function deleteEmail(id: string): Promise<ApiResponse<null>> {
  return request.delete(`/emails/${id}`)
}

// 批量删除邮件
export function deleteEmails(ids: string[]): Promise<ApiResponse<null>> {
  return request.post('/emails/batch/delete', { ids })
}

// 移动邮件到文件夹
export function moveEmail(id: string, folder: string): Promise<ApiResponse<Email>> {
  return request.patch(`/emails/${id}/move`, { folder })
}

// 获取邮件文件夹列表
export function getEmailFolders(accountId: string): Promise<ApiResponse<EmailFolder[]>> {
  return request.get(`/accounts/${accountId}/folders`)
}

// 刷新邮件
export function refreshEmails(accountId?: string): Promise<ApiResponse<{ newCount: number }>> {
  const params = accountId ? { accountId } : {}
  return request.post('/emails/refresh', params)
}

// 下载附件
export function downloadAttachment(emailId: string, attachmentId: string): Promise<Blob> {
  return request.get(`/emails/${emailId}/attachments/${attachmentId}`, {
    responseType: 'blob'
  })
}
