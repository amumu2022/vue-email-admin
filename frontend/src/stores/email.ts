import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Email, EmailFolder } from '@/types'
import * as emailApi from '@/api/email'

export const useEmailStore = defineStore('email', () => {
  // 状态
  const emails = ref<Email[]>([])
  const currentEmail = ref<Email | null>(null)
  const folders = ref<EmailFolder[]>([])
  const currentFolder = ref<string>('INBOX')
  const loading = ref(false)
  const refreshing = ref(false)
  const error = ref<string | null>(null)
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

  // 方法
  async function fetchEmails(params: {
    accountId?: string
    folder?: string
    page?: number
    pageSize?: number
    search?: string
  } = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await emailApi.getEmails({
        folder: currentFolder.value,
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...params
      })
      if (response.data) {
        emails.value = response.data.items
        pagination.value = {
          page: response.data.page,
          pageSize: response.data.pageSize,
          total: response.data.total,
          totalPages: response.data.totalPages
        }
      }
    } catch (err) {
      error.value = '获取邮件列表失败'
      console.error('获取邮件列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchEmailDetail(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await emailApi.getEmail(id)
      if (response.data) {
        currentEmail.value = response.data
        // 自动标记为已读
        if (!response.data.isRead) {
          await markAsRead(id, true)
        }
        return response.data
      }
    } catch (err) {
      error.value = '获取邮件详情失败'
      console.error('获取邮件详情失败:', err)
    } finally {
      loading.value = false
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
    } catch (err) {
      console.error('批量标记邮件失败:', err)
      throw err
    }
  }

  async function refreshEmails(accountId?: string) {
    refreshing.value = true
    try {
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
  } = {}) {
    try {
      const response = await emailApi.getEmails({
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        ...params
      })
      if (response.data) {
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
      console.error('获取所有邮件失败:', err)
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
    clearCurrentEmail
  }
})
