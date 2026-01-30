/*
 * @Author: XDTEAM
 * @Date: 2026-01-30
 * @Description: 令牌管理 API
 */
import request from './request'
import type { ApiResponse } from '@/types'

// 令牌类型
export interface ApiToken {
  id: string
  name: string
  token: string
  isActive: boolean
  ipWhitelist: string | null
  expiresAt: string | null
  createdAt: string | null
  lastUsedAt: string | null
}

// 创建令牌请求
export interface CreateTokenRequest {
  name: string
  ipWhitelist?: string
  expiresAt?: string
}

// 更新令牌请求
export interface UpdateTokenRequest {
  name?: string
  ipWhitelist?: string
  expiresAt?: string
  isActive?: boolean
}

/**
 * 获取所有令牌
 */
export function getTokens(): Promise<ApiResponse<ApiToken[]>> {
  return request.get('/tokens')
}

/**
 * 获取单个令牌
 */
export function getToken(id: string): Promise<ApiResponse<ApiToken>> {
  return request.get(`/tokens/${id}`)
}

/**
 * 显示完整令牌
 */
export function revealToken(id: string): Promise<ApiResponse<ApiToken>> {
  return request.get(`/tokens/${id}/reveal`)
}

/**
 * 创建令牌
 */
export function createToken(data: CreateTokenRequest): Promise<ApiResponse<ApiToken>> {
  return request.post('/tokens', data)
}

/**
 * 更新令牌
 */
export function updateToken(id: string, data: UpdateTokenRequest): Promise<ApiResponse<ApiToken>> {
  return request.put(`/tokens/${id}`, data)
}

/**
 * 切换令牌状态
 */
export function toggleToken(id: string): Promise<ApiResponse<ApiToken>> {
  return request.patch(`/tokens/${id}/toggle`)
}

/**
 * 删除令牌
 */
export function deleteToken(id: string): Promise<ApiResponse<void>> {
  return request.delete(`/tokens/${id}`)
}

/**
 * 重新生成令牌
 */
export function regenerateToken(id: string): Promise<ApiResponse<ApiToken>> {
  return request.post(`/tokens/${id}/regenerate`)
}
