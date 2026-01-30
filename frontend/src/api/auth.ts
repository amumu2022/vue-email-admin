/*
 * @Author: XDTEAM
 * @Date: 2026-01-29 22:38:00
 * @LastEditTime: 2026-01-30 19:01:35
 * @LastEditors: XDTEAM
 * @Description: 认证 API
 */
import request from './request'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  email?: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface UserInfo {
  id: string
  username: string
  email?: string
  isAdmin: boolean
  isActive?: boolean
  lastLogin?: string
  createdAt?: string
}

export interface LoginResponse {
  token: string
  user: UserInfo
}

export interface ResetPasswordRequest {
  userId: string
  newPassword: string
}

export interface UpdateUserRequest {
  username?: string
  email?: string
  isActive?: boolean
  isAdmin?: boolean
}

// 登录
export function login(data: LoginRequest) {
  return request.post<any, { success: boolean; data: LoginResponse; message?: string }>('/auth/login', data)
}

// 注册
export function register(data: RegisterRequest) {
  return request.post<any, { success: boolean; data: UserInfo; message?: string }>('/auth/register', data)
}

// 获取当前用户信息
export function getCurrentUser() {
  return request.get<any, { success: boolean; data: UserInfo }>('/auth/me')
}

// 修改密码
export function changePassword(data: ChangePasswordRequest) {
  return request.post<any, { success: boolean; message?: string }>('/auth/change-password', data)
}

// 登出
export function logout() {
  return request.post<any, { success: boolean; message?: string }>('/auth/logout')
}

// 初始化管理员
export function initAdmin() {
  return request.post<any, { success: boolean; data: UserInfo; message?: string }>('/auth/init-admin')
}

// ==================== 用户管理 API（管理员功能）====================

// 获取所有用户列表
export function getUsers() {
  return request.get<any, { success: boolean; data: UserInfo[] }>('/auth/users')
}

// 获取单个用户信息
export function getUser(userId: string) {
  return request.get<any, { success: boolean; data: UserInfo }>(`/auth/users/${userId}`)
}

// 更新用户信息
export function updateUser(userId: string, data: UpdateUserRequest) {
  return request.put<any, { success: boolean; data: UserInfo; message?: string }>(`/auth/users/${userId}`, data)
}

// 重置用户密码
export function resetUserPassword(data: ResetPasswordRequest) {
  return request.post<any, { success: boolean; message?: string }>('/auth/users/reset-password', data)
}

// 删除用户
export function deleteUser(userId: string) {
  return request.delete<any, { success: boolean; message?: string }>(`/auth/users/${userId}`)
}
