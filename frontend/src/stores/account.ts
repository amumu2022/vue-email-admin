import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { EmailAccount, AccountFormData } from '@/types'
import * as accountApi from '@/api/account'

export const useAccountStore = defineStore('account', () => {
  // 状态
  const accounts = ref<EmailAccount[]>([])
  const currentAccountId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const currentAccount = computed(() => {
    if (!currentAccountId.value) return null
    return accounts.value.find(acc => acc.id === currentAccountId.value) || null
  })

  const activeAccounts = computed(() => {
    return accounts.value.filter(acc => acc.isActive)
  })

  const accountCount = computed(() => accounts.value.length)

  // 方法
  async function fetchAccounts() {
    loading.value = true
    error.value = null
    try {
      const response = await accountApi.getAccounts()
      if (response.data) {
        accounts.value = response.data
      }
    } catch (err) {
      error.value = '获取账户列表失败'
      console.error('获取账户列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  async function addAccount(data: AccountFormData) {
    loading.value = true
    error.value = null
    try {
      const response = await accountApi.createAccount(data)
      if (response.data) {
        accounts.value.push(response.data)
        return response.data
      }
    } catch (err) {
      error.value = '添加账户失败'
      console.error('添加账户失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateAccount(id: string, data: Partial<AccountFormData>) {
    loading.value = true
    error.value = null
    try {
      const response = await accountApi.updateAccount(id, data)
      if (response.data) {
        const index = accounts.value.findIndex(acc => acc.id === id)
        if (index !== -1) {
          accounts.value[index] = response.data
        }
        return response.data
      }
    } catch (err) {
      error.value = '更新账户失败'
      console.error('更新账户失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeAccount(id: string) {
    loading.value = true
    error.value = null
    try {
      await accountApi.deleteAccount(id)
      accounts.value = accounts.value.filter(acc => acc.id !== id)
      if (currentAccountId.value === id) {
        currentAccountId.value = accounts.value.length > 0 ? accounts.value[0]?.id ?? null : null
      }
    } catch (err) {
      error.value = '删除账户失败'
      console.error('删除账户失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function testConnection(data: AccountFormData) {
    try {
      const response = await accountApi.testAccountConnection(data)
      return response.data
    } catch (err) {
      console.error('测试连接失败:', err)
      throw err
    }
  }

  async function syncAccount(id: string) {
    try {
      const response = await accountApi.syncAccount(id)
      return response.data
    } catch (err) {
      console.error('同步账户失败:', err)
      throw err
    }
  }

  function setCurrentAccount(id: string | null) {
    currentAccountId.value = id
  }

  function getAccountById(id: string) {
    return accounts.value.find(acc => acc.id === id)
  }

  return {
    // 状态
    accounts,
    currentAccountId,
    loading,
    error,
    // 计算属性
    currentAccount,
    activeAccounts,
    accountCount,
    // 方法
    fetchAccounts,
    addAccount,
    updateAccount,
    removeAccount,
    testConnection,
    syncAccount,
    setCurrentAccount,
    getAccountById
  }
})
