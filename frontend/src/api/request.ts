/*
 * @Author: XDTEAM
 * @Date: 2026-01-29 21:56:29
 * @LastEditTime: 2026-01-30 22:39:44
 * @LastEditors: XDTEAM
 * @Description: 
 */
import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

const TOKEN_KEY = 'email_admin_token'
const API_BASE_URL_KEY = 'email_admin_api_url'
const API_CONFIGS_KEY = 'email_admin_api_configs'

// 服务器配置接口
export interface ServerConfig {
  id: string
  name: string
  url: string
  createdAt: string
}

// 获取所有保存的服务器配置
export function getServerConfigs(): ServerConfig[] {
  const configs = localStorage.getItem(API_CONFIGS_KEY)
  if (configs) {
    try {
      return JSON.parse(configs)
    } catch {
      return []
    }
  }
  return []
}

// 保存服务器配置列表
export function saveServerConfigs(configs: ServerConfig[]): void {
  localStorage.setItem(API_CONFIGS_KEY, JSON.stringify(configs))
}

// 添加新的服务器配置
export function addServerConfig(name: string, url: string): ServerConfig {
  const configs = getServerConfigs()
  const normalizedUrl = normalizeApiUrl(url)
  const newConfig: ServerConfig = {
    id: Date.now().toString(),
    name,
    url: normalizedUrl,
    createdAt: new Date().toISOString()
  }
  configs.push(newConfig)
  saveServerConfigs(configs)
  return newConfig
}

// 更新服务器配置
export function updateServerConfig(id: string, name: string, url: string): void {
  const configs = getServerConfigs()
  const index = configs.findIndex(c => c.id === id)
  if (index !== -1) {
    const config = configs[index]
    if (config) {
      config.name = name
      config.url = normalizeApiUrl(url)
      saveServerConfigs(configs)
    }
  }
}

// 删除服务器配置
export function deleteServerConfig(id: string): void {
  const configs = getServerConfigs()
  const filtered = configs.filter(c => c.id !== id)
  saveServerConfigs(filtered)
}

// 获取保存的后端URL
export function getApiBaseUrl(): string | null {
  return localStorage.getItem(API_BASE_URL_KEY)
}

/**
 * 规范化URL格式，确保以 /api 结尾
 * 支持以下输入格式：
 * - http://localhost:8000 -> http://localhost:8000/api
 * - http://localhost:8000/ -> http://localhost:8000/api
 * - http://localhost:8000/api -> http://localhost:8000/api
 * - http://localhost:8000/api/ -> http://localhost:8000/api
 */
export function normalizeApiUrl(url: string): string {
  // 移除末尾的斜杠
  let normalized = url.replace(/\/+$/, '')
  
  // 检查是否已经以 /api 结尾
  if (!normalized.endsWith('/api')) {
    // 如果以其他路径结尾（如 /api/v1），保持不变
    // 否则添加 /api
    normalized = normalized + '/api'
  }
  
  return normalized
}

// 保存后端URL
export function setApiBaseUrl(url: string): void {
  // 规范化URL格式，确保以 /api 结尾
  const normalizedUrl = normalizeApiUrl(url)
  localStorage.setItem(API_BASE_URL_KEY, normalizedUrl)
  // 更新 axios 实例的 baseURL
  service.defaults.baseURL = normalizedUrl
}

// 清除后端URL配置
export function clearApiBaseUrl(): void {
  localStorage.removeItem(API_BASE_URL_KEY)
}

// 检查是否已配置后端URL
export function hasApiBaseUrl(): boolean {
  const url = getApiBaseUrl()
  return !!url && url.trim() !== ''
}

// 验证后端URL是否可用
export async function validateApiUrl(url: string): Promise<{ success: boolean; message: string; normalizedUrl: string }> {
  try {
    // 规范化URL格式，确保以 /api 结尾
    const normalizedUrl = normalizeApiUrl(url)
    
    // 尝试访问后端的健康检查接口 /api/health
    const response = await axios.get(`${normalizedUrl}/health`, {
      timeout: 10000,
      validateStatus: () => true // 接受所有状态码
    })
    
    // 如果健康检查接口返回成功
    if (response.status >= 200 && response.status < 300) {
      return { success: true, message: '服务器连接成功', normalizedUrl }
    }
    
    // 如果健康检查接口不存在，尝试访问 /api 根路径
    if (response.status === 404) {
      const rootResponse = await axios.get(normalizedUrl, {
        timeout: 10000,
        validateStatus: () => true
      })
      if (rootResponse.status >= 200 && rootResponse.status < 500) {
        return { success: true, message: '服务器连接成功', normalizedUrl }
      }
    }
    
    return { success: false, message: `服务器返回错误状态: ${response.status}`, normalizedUrl }
  } catch (error: any) {
    const normalizedUrl = normalizeApiUrl(url)
    if (error.code === 'ECONNABORTED') {
      return { success: false, message: '连接超时，请检查服务器地址是否正确', normalizedUrl }
    }
    if (error.code === 'ERR_NETWORK') {
      return { success: false, message: '网络错误，请检查服务器地址或网络连接', normalizedUrl }
    }
    return { success: false, message: error.message || '无法连接到服务器', normalizedUrl }
  }
}

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl() || import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 动态获取最新的 baseURL
    const savedUrl = getApiBaseUrl()
    if (savedUrl) {
      config.baseURL = savedUrl
    }
    
    // 添加 token 认证信息
    const token = localStorage.getItem(TOKEN_KEY)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    
    // 如果响应成功，直接返回数据
    if (res.success !== false) {
      return res
    }
    
    // 处理业务错误
    ElMessage.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  (error) => {
    console.error('响应错误:', error)
    
    // 处理 HTTP 错误
    let message = '网络错误，请稍后重试'
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = error.response.data?.detail || '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          // 清除登录状态并跳转到登录页
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem('email_admin_user')
          // 避免在登录页和服务器配置页重复跳转
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/server-config')) {
            window.location.href = '/login'
          }
          break
        case 403:
          message = error.response.data?.detail || '拒绝访问'
          break
        case 404:
          message = error.response.data?.detail || '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = error.response.data?.detail || error.response.data?.message || '请求失败'
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时，请稍后重试'
    } else if (error.code === 'ERR_NETWORK') {
      message = '网络错误，请检查服务器地址是否正确'
    }
    
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default service


