/*
 * @Author: XDTEAM
 * @Date: 2026-01-29 21:55:17
 * @LastEditTime: 2026-01-30 22:25:00
 * @LastEditors: XDTEAM
 * @Description: 
 */
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { hasApiBaseUrl } from '@/api/request'

const routes: RouteRecordRaw[] = [
  {
    path: '/server-config',
    name: 'ServerConfig',
    component: () => import('@/views/auth/ServerConfigView.vue'),
    meta: { title: '服务器配置', public: true, skipApiCheck: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'inbox',
        name: 'Inbox',
        component: () => import('@/views/email/InboxView.vue'),
        meta: { title: '收件箱' }
      },
      {
        path: 'all-inbox',
        name: 'AllInbox',
        component: () => import('@/views/email/AllInboxView.vue'),
        meta: { title: '总收件箱' }
      },
      {
        path: 'email/:id',
        name: 'EmailDetail',
        component: () => import('@/views/email/EmailDetailView.vue'),
        meta: { title: '邮件详情' }
      },
      {
        path: 'accounts',
        name: 'Accounts',
        component: () => import('@/views/account/AccountListView.vue'),
        meta: { title: '账户管理' }
      },
      {
        path: 'accounts/add',
        name: 'AddAccount',
        component: () => import('@/views/account/AddAccountView.vue'),
        meta: { title: '添加账户' }
      },
      {
        path: 'accounts/edit/:id',
        name: 'EditAccount',
        component: () => import('@/views/account/EditAccountView.vue'),
        meta: { title: '编辑账户' }
      },
      {
        path: 'logs',
        name: 'AccessLogs',
        redirect: '/logs/open-api',
        meta: { title: '访问日志', requiresAdmin: true },
        children: [
          {
            path: 'open-api',
            name: 'OpenApiLogs',
            component: () => import('@/views/logs/AccessLogsView.vue'),
            meta: { title: '开放API日志', requiresAdmin: true, logType: 'open_api' }
          },
          {
            path: 'login',
            name: 'LoginLogs',
            component: () => import('@/views/logs/AccessLogsView.vue'),
            meta: { title: '登录日志', requiresAdmin: true, logType: 'login' }
          },
          {
            path: 'other',
            name: 'OtherLogs',
            component: () => import('@/views/logs/AccessLogsView.vue'),
            meta: { title: '操作日志', requiresAdmin: true, logType: 'other' }
          }
        ]
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('@/views/users/UserManagementView.vue'),
        meta: { title: '用户管理', requiresAdmin: true }
      },
      {
        path: 'tokens',
        name: 'TokenManagement',
        component: () => import('@/views/tokens/TokenManagementView.vue'),
        meta: { title: '令牌管理', requiresAdmin: true }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/SettingsView.vue'),
        meta: { title: '设置' }
      },
      {
        path: 'api-docs',
        name: 'ApiDocs',
        component: () => import('@/views/docs/ApiDocsView.vue'),
        meta: { title: 'API文档' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫 - 认证检查
router.beforeEach(async (to, _from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || '邮箱管理'} - Email Admin`
  
  // 如果是服务器配置页面，直接放行
  if (to.meta.skipApiCheck) {
    next()
    return
  }
  
  // 检查是否已配置后端URL
  if (!hasApiBaseUrl()) {
    // 未配置后端URL，跳转到服务器配置页面
    next({ name: 'ServerConfig' })
    return
  }
  
  // 公开页面直接放行
  if (to.meta.public) {
    next()
    return
  }
  
  // 检查是否需要认证
  const token = localStorage.getItem('email_admin_token')
  
  if (!token) {
    // 未登录，跳转到登录页
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  
  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin) {
    const userStr = localStorage.getItem('email_admin_user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (!user.isAdmin) {
          next({ name: 'Inbox' })
          return
        }
      } catch {
        next({ name: 'Login' })
        return
      }
    }
  }
  
  next()
})

export default router
