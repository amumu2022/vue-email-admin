import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Email, EmailFolder } from '@/types'
import * as emailApi from '@/api/email'
import * as emailCache from '@/utils/emailCache'

export const useEmailStore = defineStore('email', () => {
  // 状态
  const emails = ref<Email[]>([])
  const currentEmail = ref<Email | null>(null)
  const folders = ref<EmailFolder[]>([])
  const currentFolder = ref<string>('INBOX')
  const loading = ref(false)
  const refreshing = ref(false)
  const error = ref<string | null>(null)
  const loadingFromCache = ref(false) // 是否正在从缓存加载
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  })

  // 计算属性
  const unreadCount = computed(() => {
    return emails.value.filter(email => !email.isRead).length
  })

  const starredEmails = computed(() => {
    return emails.value.filter(email => email.isStarred)
  })

  const hasMore = computed(() => {
    return pagination.value.page < pagination.value.totalPages
  })

  // 获取缓存设置
  function isCacheEnabled(): boolean {
    const saved = localStorage.getItem('emailAdminSettings')
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        return settings.enableCache !== false // 默认启用
      } catch {
        return true
      }
    }
    return true
  }

  // 方法
  async function fetchEmails(params: {
    accountId?: string
    folder?: string
    page?: number
    pageSize?: number
    search?: string
    skipBackgroundRefresh?: boolean // 是否跳过后台静默更新
  } = {}) {
    const accountId = params.accountId
    const page = params.page || pagination.value.page
    const hasSearch = !!params.search
    const cacheEnabled = isCacheEnabled()
    const skipBackgroundRefresh = params.skipBackgroundRefresh ?? false

    // 如果启用缓存且没有搜索条件，先尝试从缓存加载
    if (cacheEnabled && accountId && !hasSearch) {
      try {
        const cached = await emailCache.getCachedEmails(accountId, page)
        if (cached) {
          loadingFromCache.value = true
          emails.value = cached.emails
          pagination.value = cached.pagination
          loadingFromCache.value = false
          
          // 如果不跳过后台更新，则静默更新数据（不等待结果，避免阻塞）
          if (!skipBackgroundRefresh) {
            fetchEmailsFromApi(params, true).catch(err => {
              console.error('后台静默更新邮件失败:', err)
            })
          }
          return
        }
      } catch (err) {
        console.error('从缓存加载失败:', err)
      }
    }

    // 从 API 加载，如果失败则尝试从缓存加载（离线模式）
    try {
      await fetchEmailsFromApi(params, false)
    } catch (err) {
      // API 请求失败，尝试从缓存加载
      if (cacheEnabled && accountId && !hasSearch) {
        try {
          const cached = await emailCache.getCachedEmails(accountId, page)
          if (cached) {
            console.log('API 请求失败，从缓存加载邮件（离线模式）')
            emails.value = cached.emails
            pagination.value = cached.pagination
            return
          }
        } catch (cacheErr) {
          console.error('离线模式从缓存加载失败:', cacheErr)
        }
      }
      // 如果缓存也没有数据，则保持错误状态
    }
  }

  // 从 API 获取邮件（内部方法）
  async function fetchEmailsFromApi(params: {
    accountId?: string
    folder?: string
    page?: number
    pageSize?: number
    search?: string
    skipBackgroundRefresh?: boolean
  }, silent: boolean) {
    if (!silent) {
      loading.value = true
    }
    error.value = null
    
    try {
      // 过滤掉 skipBackgroundRefresh 参数，不传递给 API
      const { skipBackgroundRefresh, ...apiParams } = params
      const response = await emailApi.getEmails({
        folder: currentFolder.value,
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...apiParams
      })
      if (response.data) {
        emails.value = response.data.items
        pagination.value = {
          page: response.data.page,
          pageSize: response.data.pageSize,
          total: response.data.total,
          totalPages: response.data.totalPages
        }

        // 缓存邮件数据（仅当启用缓存、有 accountId 且没有搜索条件时）
        if (isCacheEnabled() && params.accountId && !params.search) {
          emailCache.cacheEmails(params.accountId, response.data.items, {
            page: response.data.page,
            pageSize: response.data.pageSize,
            total: response.data.total,
            totalPages: response.data.totalPages
          })
        }
      }
    } catch (err) {
      if (!silent) {
        error.value = '获取邮件列表失败'
      }
      console.error('获取邮件列表失败:', err)
    } finally {
      if (!silent) {
        loading.value = false
      }
    }
  }

  async function fetchEmailDetail(id: string, accountId?: string) {
    const cacheEnabled = isCacheEnabled()
    
    // 如果启用缓存，先尝试从缓存加载
    if (cacheEnabled) {
      try {
        const cached = await emailCache.getCachedEmailDetail(id)
        if (cached) {
          loadingFromCache.value = true
          currentEmail.value = cached
          loadingFromCache.value = false
          
          // 自动标记为已读
          if (!cached.isRead) {
            await markAsRead(id, true)
          }
          
          // 后台静默更新数据
          fetchEmailDetailFromApi(id, accountId, true)
          return cached
        }
      } catch (err) {
        console.error('从缓存加载邮件详情失败:', err)
      }
    }

    // 从 API 加载
    return await fetchEmailDetailFromApi(id, accountId, false)
  }

  // 从 API 获取邮件详情（内部方法）
  async function fetchEmailDetailFromApi(id: string, accountId?: string, silent: boolean = false) {
    if (!silent) {
      loading.value = true
    }
    error.value = null
    
    try {
      const response = await emailApi.getEmail(id)
      if (response.data) {
        currentEmail.value = response.data
        
        // 缓存邮件详情（仅当启用缓存时）
        if (isCacheEnabled() && accountId) {
          emailCache.cacheEmailDetail(accountId, response.data)
        }
        
        // 自动标记为已读
        if (!response.data.isRead) {
          await markAsRead(id, true)
        }
        return response.data
      }
    } catch (err) {
      if (!silent) {
        error.value = '获取邮件详情失败'
      }
      console.error('获取邮件详情失败:', err)
    } finally {
      if (!silent) {
        loading.value = false
      }
    }
  }

  async function markAsRead(id: string, isRead: boolean) {
    try {
      const response = await emailApi.markEmailRead(id, isRead)
      if (response.data) {
        const email = emails.value.find(e => e.id === id)
        if (email) {
          email.isRead = isRead
        }
        if (currentEmail.value?.id === id) {
          currentEmail.value.isRead = isRead
        }
        // 更新缓存中的状态
        emailCache.updateCachedEmailStatus(id, { isRead })
      }
    } catch (err) {
      console.error('标记邮件失败:', err)
      throw err
    }
  }

  async function markAsStarred(id: string, isStarred: boolean) {
    try {
      const response = await emailApi.markEmailStarred(id, isStarred)
      if (response.data) {
        const email = emails.value.find(e => e.id === id)
        if (email) {
          email.isStarred = isStarred
        }
        if (currentEmail.value?.id === id) {
          currentEmail.value.isStarred = isStarred
        }
        // 更新缓存中的状态
        emailCache.updateCachedEmailStatus(id, { isStarred })
      }
    } catch (err) {
      console.error('标记星标失败:', err)
      throw err
    }
  }

  async function deleteEmail(id: string) {
    try {
      await emailApi.deleteEmail(id)
      emails.value = emails.value.filter(e => e.id !== id)
      if (currentEmail.value?.id === id) {
        currentEmail.value = null
      }
      // 从缓存中删除
      emailCache.deleteCachedEmail(id)
    } catch (err) {
      console.error('删除邮件失败:', err)
      throw err
    }
  }

  async function batchDelete(ids: string[]) {
    try {
      await emailApi.deleteEmails(ids)
      emails.value = emails.value.filter(e => !ids.includes(e.id))
      if (currentEmail.value && ids.includes(currentEmail.value.id)) {
        currentEmail.value = null
      }
      // 从缓存中批量删除
      emailCache.deleteCachedEmails(ids)
    } catch (err) {
      console.error('批量删除邮件失败:', err)
      throw err
    }
  }

  async function batchMarkRead(ids: string[], isRead: boolean) {
    try {
      await emailApi.markEmailsRead(ids, isRead)
      emails.value.forEach(email => {
        if (ids.includes(email.id)) {
          email.isRead = isRead
        }
      })
      // 更新缓存中的状态
      for (const id of ids) {
        emailCache.updateCachedEmailStatus(id, { isRead })
      }
    } catch (err) {
      console.error('批量标记邮件失败:', err)
      throw err
    }
  }

  async function refreshEmails(accountId?: string) {
    refreshing.value = true
    try {
      // 刷新时清除缓存
      if (accountId) {
        // 清除指定账户的缓存
        await emailCache.clearAccountCache(accountId)
      } else {
        // 刷新全部邮箱时，清除所有缓存（包括总收件箱缓存）
        await emailCache.clearAllCache()
      }
      // 同时清除总收件箱的缓存（因为邮件数据可能变化）
      await emailCache.clearAllAccountsCache()
      
      const response = await emailApi.refreshEmails(accountId)
      if (response.data && response.data.newCount > 0) {
        // 重新获取邮件列表
        await fetchEmails({ accountId })
      }
      return response.data
    } catch (err) {
      console.error('刷新邮件失败:', err)
      throw err
    } finally {
      refreshing.value = false
    }
  }

  async function fetchAllEmails(params: {
    accountId?: string
    page?: number
    pageSize?: number
    search?: string
    skipBackgroundRefresh?: boolean // 是否跳过后台静默更新
  } = {}) {
    const page = params.page || 1
    const hasSearch = !!params.search
    const hasAccountFilter = !!params.accountId
    const cacheEnabled = isCacheEnabled()
    const skipBackgroundRefresh = params.skipBackgroundRefresh ?? false
    
    // 如果启用缓存、没有搜索条件且没有账户筛选，先尝试从缓存加载
    if (cacheEnabled && !hasSearch && !hasAccountFilter) {
      try {
        const cached = await emailCache.getCachedAllAccountsEmails(page)
        if (cached) {
          console.log('从缓存加载总收件箱邮件')
          // 如果不跳过后台更新，则静默更新数据（不等待结果，避免阻塞）
          if (!skipBackgroundRefresh) {
            fetchAllEmailsFromApi(params, true).catch(err => {
              console.error('后台静默更新总收件箱失败:', err)
            })
          }
          return {
            items: cached.emails,
            total: cached.pagination.total,
            page: cached.pagination.page,
            pageSize: cached.pagination.pageSize,
            totalPages: cached.pagination.totalPages
          }
        }
      } catch (err) {
        console.error('从缓存加载总收件箱失败:', err)
      }
    }
    
    // 从 API 加载，如果失败则尝试从缓存加载（离线模式）
    try {
      return await fetchAllEmailsFromApi(params, false)
    } catch (err) {
      // API 请求失败，尝试从缓存加载（即使有搜索条件或账户筛选也尝试）
      if (cacheEnabled && !hasSearch && !hasAccountFilter) {
        try {
          const cached = await emailCache.getCachedAllAccountsEmails(page)
          if (cached) {
            console.log('API 请求失败，从缓存加载总收件箱邮件（离线模式）')
            return {
              items: cached.emails,
              total: cached.pagination.total,
              page: cached.pagination.page,
              pageSize: cached.pagination.pageSize,
              totalPages: cached.pagination.totalPages
            }
          }
        } catch (cacheErr) {
          console.error('离线模式从缓存加载失败:', cacheErr)
        }
      }
      throw err
    }
  }

  // 从 API 获取全部邮件（内部方法）
  async function fetchAllEmailsFromApi(params: {
    accountId?: string
    page?: number
    pageSize?: number
    search?: string
    skipBackgroundRefresh?: boolean
  }, silent: boolean) {
    try {
      // 过滤掉 skipBackgroundRefresh 参数，不传递给 API
      const { skipBackgroundRefresh, ...apiParams } = params
      const response = await emailApi.getEmails({
        page: apiParams.page || 1,
        pageSize: apiParams.pageSize || 20,
        ...apiParams
      })
      if (response.data) {
        // 缓存邮件数据（仅当启用缓存、没有搜索条件且没有账户筛选时）
        if (isCacheEnabled() && !params.search && !params.accountId) {
          emailCache.cacheAllAccountsEmails(response.data.items, {
            page: response.data.page,
            pageSize: response.data.pageSize,
            total: response.data.total,
            totalPages: response.data.totalPages
          })
        }
        
        return {
          items: response.data.items,
          total: response.data.total,
          page: response.data.page,
          pageSize: response.data.pageSize,
          totalPages: response.data.totalPages
        }
      }
      return null
    } catch (err) {
      if (!silent) {
        console.error('获取所有邮件失败:', err)
      }
      throw err
    }
  }

  async function fetchFolders(accountId: string) {
    try {
      const response = await emailApi.getEmailFolders(accountId)
      if (response.data) {
        folders.value = response.data
      }
    } catch (err) {
      console.error('获取文件夹失败:', err)
    }
  }

  function setCurrentFolder(folder: string) {
    currentFolder.value = folder
    pagination.value.page = 1
  }

  function setPage(page: number) {
    pagination.value.page = page
  }

  function clearCurrentEmail() {
    currentEmail.value = null
  }

  // 清除所有缓存
  async function clearCache() {
    await emailCache.clearAllCache()
  }

  // 清除过期缓存
  async function clearExpiredCache() {
    await emailCache.clearExpiredCache()
  }

  return {
    // 状态
    emails,
    currentEmail,
    folders,
    currentFolder,
    loading,
    refreshing,
    error,
    pagination,
    loadingFromCache,
    // 计算属性
    unreadCount,
    starredEmails,
    hasMore,
    // 方法
    fetchEmails,
    fetchAllEmails,
    fetchEmailDetail,
    markAsRead,
    markAsStarred,
    deleteEmail,
    batchDelete,
    batchMarkRead,
    refreshEmails,
    fetchFolders,
    setCurrentFolder,
    setPage,
    clearCurrentEmail,
    clearCache,
    clearExpiredCache
  }
})

