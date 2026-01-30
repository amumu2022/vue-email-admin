/*
 * @Author: XDTEAM
 * @Date: 2026-01-29 22:38:00
 * @LastEditTime: 2026-01-29 22:43:29
 * @LastEditors: XDTEAM
 * @Description: 用户认证 Store
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getCurrentUser, type UserInfo, type LoginRequest } from '@/api/auth'
import { ElMessage } from 'element-plus'

const TOKEN_KEY = 'email_admin_token'
const USER_KEY = 'email_admin_user'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<UserInfo | null>(null)
  const loading = ref(false)

  // 初始化用户信息
  const savedUser = localStorage.getItem(USER_KEY)
  if (savedUser) {
    try {
      user.value = JSON.parse(savedUser)
    } catch {
      user.value = null
    }
  }

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.isAdmin ?? false)
  const username = computed(() => user.value?.username ?? '')

  // 登录
  async function loginAction(data: LoginRequest) {
    loading.value = true
    try {
      const res = await login(data)
      if (res.success && res.data) {
        token.value = res.data.token
        user.value = res.data.user
        localStorage.setItem(TOKEN_KEY, res.data.token)
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.user))
        ElMessage.success(res.message || '登录成功')
        return true
      }
      return false
    } catch (error: any) {
      ElMessage.error(error.response?.data?.detail || '登录失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 登出
  async function logoutAction() {
    try {
      await logout()
    } catch {
      // 忽略登出错误
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      ElMessage.success('已退出登录')
    }
  }

  // 获取用户信息
  async function fetchUserInfo() {
    if (!token.value) return null
    
    try {
      const res = await getCurrentUser()
      if (res.success && res.data) {
        user.value = res.data
        localStorage.setItem(USER_KEY, JSON.stringify(res.data))
        return res.data
      }
      return null
    } catch {
      // Token 无效，清除登录状态
      token.value = null
      user.value = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      return null
    }
  }

  // 检查登录状态
  async function checkAuth() {
    if (!token.value) return false
    
    const userInfo = await fetchUserInfo()
    return !!userInfo
  }

  return {
    token,
    user,
    loading,
    isLoggedIn,
    isAdmin,
    username,
    loginAction,
    logoutAction,
    fetchUserInfo,
    checkAuth
  }
})
