/**
 * 邮件本地缓存工具
 * 使用 IndexedDB 存储邮件数据，提高加载速度
 */

import type { Email } from '@/types'

const DB_NAME = 'EmailAdminCache'
const DB_VERSION = 1
const STORE_NAME = 'emails'
const CACHE_EXPIRY = 30 * 60 * 1000 // 缓存过期时间：30分钟
const ALL_ACCOUNTS_KEY = '__ALL__' // 用于标识"全部邮箱"的特殊键

interface CachedEmail extends Email {
  _cachedAt: number // 缓存时间戳
  _accountId: string // 所属账户ID
}

interface CacheMetadata {
  accountId: string
  page: number
  pageSize: number
  total: number
  totalPages: number
  cachedAt: number
}

let db: IDBDatabase | null = null

/**
 * 初始化 IndexedDB 数据库
 */
async function initDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('打开 IndexedDB 失败:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // 创建邮件存储
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('accountId', '_accountId', { unique: false })
        store.createIndex('cachedAt', '_cachedAt', { unique: false })
      }

      // 创建元数据存储
      if (!database.objectStoreNames.contains('metadata')) {
        database.createObjectStore('metadata', { keyPath: 'key' })
      }
    }
  })
}

/**
 * 缓存邮件列表
 */
export async function cacheEmails(
  accountId: string,
  emails: Email[],
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
): Promise<void> {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_NAME, 'metadata'], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const metadataStore = transaction.objectStore('metadata')

    const now = Date.now()

    // 缓存每封邮件
    for (const email of emails) {
      const cachedEmail: CachedEmail = {
        ...email,
        _cachedAt: now,
        _accountId: accountId
      }
      store.put(cachedEmail)
    }

    // 缓存分页元数据
    const metadataKey = `${accountId}_page_${pagination.page}`
    const metadata: CacheMetadata & { key: string; emailIds: string[] } = {
      key: metadataKey,
      accountId,
      ...pagination,
      cachedAt: now,
      emailIds: emails.map(e => e.id)
    }
    metadataStore.put(metadata)

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })

    console.log(`已缓存 ${emails.length} 封邮件 (账户: ${accountId}, 页码: ${pagination.page})`)
  } catch (err) {
    console.error('缓存邮件失败:', err)
  }
}

/**
 * 从缓存获取邮件列表
 */
export async function getCachedEmails(
  accountId: string,
  page: number
): Promise<{
  emails: Email[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
} | null> {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_NAME, 'metadata'], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const metadataStore = transaction.objectStore('metadata')

    // 获取元数据
    const metadataKey = `${accountId}_page_${page}`
    const metadata = await new Promise<(CacheMetadata & { emailIds: string[] }) | undefined>((resolve, reject) => {
      const request = metadataStore.get(metadataKey)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (!metadata) {
      return null
    }

    // 检查缓存是否过期
    if (Date.now() - metadata.cachedAt > CACHE_EXPIRY) {
      console.log('缓存已过期')
      return null
    }

    // 获取邮件
    const emails: Email[] = []
    for (const emailId of metadata.emailIds) {
      const email = await new Promise<CachedEmail | undefined>((resolve, reject) => {
        const request = store.get(emailId)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      if (email) {
        // 移除缓存相关字段
        const { _cachedAt, _accountId, ...originalEmail } = email
        emails.push(originalEmail as Email)
      }
    }

    console.log(`从缓存加载 ${emails.length} 封邮件 (账户: ${accountId}, 页码: ${page})`)

    return {
      emails,
      pagination: {
        page: metadata.page,
        pageSize: metadata.pageSize,
        total: metadata.total,
        totalPages: metadata.totalPages
      }
    }
  } catch (err) {
    console.error('获取缓存邮件失败:', err)
    return null
  }
}

/**
 * 缓存单封邮件详情
 */
export async function cacheEmailDetail(accountId: string, email: Email): Promise<void> {
  try {
    const database = await initDB()
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const cachedEmail: CachedEmail = {
      ...email,
      _cachedAt: Date.now(),
      _accountId: accountId
    }
    store.put(cachedEmail)

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (err) {
    console.error('缓存邮件详情失败:', err)
  }
}

/**
 * 从缓存获取单封邮件详情
 */
export async function getCachedEmailDetail(emailId: string): Promise<Email | null> {
  try {
    const database = await initDB()
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    const email = await new Promise<CachedEmail | undefined>((resolve, reject) => {
      const request = store.get(emailId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (!email) {
      return null
    }

    // 检查缓存是否过期（邮件详情缓存时间更长：2小时）
    if (Date.now() - email._cachedAt > 2 * 60 * 60 * 1000) {
      return null
    }

    // 移除缓存相关字段
    const { _cachedAt, _accountId, ...originalEmail } = email
    return originalEmail as Email
  } catch (err) {
    console.error('获取缓存邮件详情失败:', err)
    return null
  }
}

/**
 * 清除指定账户的缓存
 */
export async function clearAccountCache(accountId: string): Promise<void> {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_NAME, 'metadata'], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const metadataStore = transaction.objectStore('metadata')

    // 删除该账户的所有邮件
    const index = store.index('accountId')
    const request = index.openCursor(IDBKeyRange.only(accountId))

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }

    // 删除该账户的所有元数据
    const metadataRequest = metadataStore.openCursor()
    metadataRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        const value = cursor.value as CacheMetadata & { key: string }
        if (value.accountId === accountId) {
          cursor.delete()
        }
        cursor.continue()
      }
    }

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })

    console.log(`已清除账户 ${accountId} 的缓存`)
  } catch (err) {
    console.error('清除账户缓存失败:', err)
  }
}

/**
 * 清除所有缓存
 */
export async function clearAllCache(): Promise<void> {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_NAME, 'metadata'], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const metadataStore = transaction.objectStore('metadata')

    store.clear()
    metadataStore.clear()

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })

    console.log('已清除所有邮件缓存')
  } catch (err) {
    console.error('清除所有缓存失败:', err)
  }
}

/**
 * 清除过期缓存
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_NAME, 'metadata'], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const metadataStore = transaction.objectStore('metadata')

    const now = Date.now()

    // 清除过期邮件
    const index = store.index('cachedAt')
    const expiredTime = now - CACHE_EXPIRY
    const range = IDBKeyRange.upperBound(expiredTime)
    const request = index.openCursor(range)

    let deletedCount = 0
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        cursor.delete()
        deletedCount++
        cursor.continue()
      }
    }

    // 清除过期元数据
    const metadataRequest = metadataStore.openCursor()
    metadataRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        const value = cursor.value as CacheMetadata
        if (now - value.cachedAt > CACHE_EXPIRY) {
          cursor.delete()
        }
        cursor.continue()
      }
    }

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => {
        if (deletedCount > 0) {
          console.log(`已清除 ${deletedCount} 条过期缓存`)
        }
        resolve()
      }
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (err) {
    console.error('清除过期缓存失败:', err)
  }
}

/**
 * 更新缓存中的邮件状态（已读/星标等）
 */
export async function updateCachedEmailStatus(
  emailId: string,
  updates: Partial<Pick<Email, 'isRead' | 'isStarred'>>
): Promise<void> {
  try {
    const database = await initDB()
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const email = await new Promise<CachedEmail | undefined>((resolve, reject) => {
      const request = store.get(emailId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (email) {
      const updatedEmail = { ...email, ...updates }
      store.put(updatedEmail)

      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })
    }
  } catch (err) {
    console.error('更新缓存邮件状态失败:', err)
  }
}

/**
 * 从缓存中删除邮件
 */
export async function deleteCachedEmail(emailId: string): Promise<void> {
  try {
    const database = await initDB()
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    store.delete(emailId)

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (err) {
    console.error('删除缓存邮件失败:', err)
  }
}

/**
 * 批量从缓存中删除邮件
 */
export async function deleteCachedEmails(emailIds: string[]): Promise<void> {
  try {
    const database = await initDB()
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    for (const id of emailIds) {
      store.delete(id)
    }

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (err) {
    console.error('批量删除缓存邮件失败:', err)
  }
}

/**
 * 缓存全部邮箱的邮件列表（用于总收件箱）
 */
export async function cacheAllAccountsEmails(
  emails: Email[],
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
): Promise<void> {
  return cacheEmails(ALL_ACCOUNTS_KEY, emails, pagination)
}

/**
 * 从缓存获取全部邮箱的邮件列表（用于总收件箱）
 */
export async function getCachedAllAccountsEmails(
  page: number
): Promise<{
  emails: Email[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
} | null> {
  return getCachedEmails(ALL_ACCOUNTS_KEY, page)
}

/**
 * 清除全部邮箱的缓存（用于总收件箱）
 */
export async function clearAllAccountsCache(): Promise<void> {
  return clearAccountCache(ALL_ACCOUNTS_KEY)
}

// 导出常量
export { ALL_ACCOUNTS_KEY }

/**
 * 调试工具：获取所有缓存的邮件数据
 * 可在浏览器控制台使用 window.emailCacheDebug.getAllCachedData() 查看
 */
export async function getAllCachedData(): Promise<{
  emails: CachedEmail[]
  metadata: (CacheMetadata & { key: string; emailIds: string[] })[]
}> {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_NAME, 'metadata'], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const metadataStore = transaction.objectStore('metadata')

    // 获取所有邮件
    const emails = await new Promise<CachedEmail[]>((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    // 获取所有元数据
    const metadata = await new Promise<(CacheMetadata & { key: string; emailIds: string[] })[]>((resolve, reject) => {
      const request = metadataStore.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    return { emails, metadata }
  } catch (err) {
    console.error('获取缓存数据失败:', err)
    return { emails: [], metadata: [] }
  }
}

/**
 * 调试工具：获取缓存统计信息
 * 可在浏览器控制台使用 window.emailCacheDebug.getCacheStats() 查看
 */
export async function getCacheStats(): Promise<{
  totalEmails: number
  totalMetadata: number
  accountStats: Record<string, number>
  cacheSize: string
}> {
  try {
    const { emails, metadata } = await getAllCachedData()
    
    // 按账户统计邮件数量
    const accountStats: Record<string, number> = {}
    for (const email of emails) {
      const accountId = email._accountId
      accountStats[accountId] = (accountStats[accountId] || 0) + 1
    }

    // 估算缓存大小
    const dataStr = JSON.stringify({ emails, metadata })
    const sizeBytes = new Blob([dataStr]).size
    const sizeKB = (sizeBytes / 1024).toFixed(2)
    const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2)
    const cacheSize = sizeBytes > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`

    return {
      totalEmails: emails.length,
      totalMetadata: metadata.length,
      accountStats,
      cacheSize
    }
  } catch (err) {
    console.error('获取缓存统计失败:', err)
    return {
      totalEmails: 0,
      totalMetadata: 0,
      accountStats: {},
      cacheSize: '0 KB'
    }
  }
}

/**
 * 调试工具：打印缓存数据到控制台
 * 可在浏览器控制台使用 window.emailCacheDebug.printCache() 查看
 */
export async function printCache(): Promise<void> {
  console.group('📧 邮件缓存数据')
  
  const stats = await getCacheStats()
  console.log('📊 缓存统计:', stats)
  
  const { emails, metadata } = await getAllCachedData()
  
  console.group('📬 缓存的邮件列表')
  console.table(emails.map(e => ({
    id: e.id,
    subject: e.subject?.substring(0, 30) + (e.subject?.length > 30 ? '...' : ''),
    from: e.from?.address,
    accountId: e._accountId,
    cachedAt: new Date(e._cachedAt).toLocaleString()
  })))
  console.groupEnd()
  
  console.group('📋 缓存元数据')
  console.table(metadata.map(m => ({
    key: m.key,
    accountId: m.accountId,
    page: m.page,
    total: m.total,
    emailCount: m.emailIds?.length || 0,
    cachedAt: new Date(m.cachedAt).toLocaleString()
  })))
  console.groupEnd()
  
  console.groupEnd()
}

// 将调试工具暴露到全局 window 对象
if (typeof window !== 'undefined') {
  (window as unknown as { emailCacheDebug: {
    getAllCachedData: typeof getAllCachedData
    getCacheStats: typeof getCacheStats
    printCache: typeof printCache
    clearAllCache: typeof clearAllCache
    clearAccountCache: typeof clearAccountCache
    clearExpiredCache: typeof clearExpiredCache
  } }).emailCacheDebug = {
    getAllCachedData,
    getCacheStats,
    printCache,
    clearAllCache,
    clearAccountCache,
    clearExpiredCache
  }
  
  console.log('💡 邮件缓存调试工具已加载，可在控制台使用以下命令:')
  console.log('   window.emailCacheDebug.printCache() - 打印所有缓存数据')
  console.log('   window.emailCacheDebug.getCacheStats() - 获取缓存统计信息')
  console.log('   window.emailCacheDebug.getAllCachedData() - 获取原始缓存数据')
  console.log('   window.emailCacheDebug.clearAllCache() - 清除所有缓存')
  console.log('   window.emailCacheDebug.clearExpiredCache() - 清除过期缓存')
}
