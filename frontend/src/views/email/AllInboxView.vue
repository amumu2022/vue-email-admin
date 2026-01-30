<template>
  <div class="all-inbox-view">
    <!-- 工具栏 -->
    <div class="toolbar card">
      <div class="toolbar-left">
        <el-checkbox
          v-model="selectAll"
          :indeterminate="isIndeterminate"
          @change="handleSelectAll"
        />
        <el-button-group>
          <el-button :disabled="selectedIds.length === 0" @click="handleBatchRead(true)">
            <el-icon><View /></el-icon>
            标记已读
          </el-button>
          <el-button :disabled="selectedIds.length === 0" @click="handleBatchRead(false)">
            <el-icon><Hide /></el-icon>
            标记未读
          </el-button>
          <el-button :disabled="selectedIds.length === 0" type="danger" @click="handleBatchDelete">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </el-button-group>
      </div>
      <div class="toolbar-right">
        <el-select v-model="filterAccountId" placeholder="筛选账户" clearable style="width: 200px; margin-right: 10px;">
          <el-option label="全部账户" value="" />
          <el-option
            v-for="account in accounts"
            :key="account.id"
            :label="account.email"
            :value="account.id"
          />
        </el-select>
        <el-input
          v-model="searchQuery"
          placeholder="搜索邮件..."
          prefix-icon="Search"
          clearable
          style="width: 250px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
      </div>
    </div>

    <!-- 邮件列表 -->
    <div class="email-list card">
      <el-skeleton :loading="loading" animated :count="5">
        <template #template>
          <div class="skeleton-item">
            <el-skeleton-item variant="circle" style="width: 40px; height: 40px" />
            <div style="flex: 1; margin-left: 15px">
              <el-skeleton-item variant="h3" style="width: 30%" />
              <el-skeleton-item variant="text" style="width: 50%; margin-top: 10px" />
              <el-skeleton-item variant="text" style="width: 80%; margin-top: 5px" />
            </div>
          </div>
        </template>
        <template #default>
          <div v-if="emails.length === 0" class="empty-state">
            <el-empty description="暂无邮件">
              <el-button type="primary" @click="handleRefresh">刷新邮件</el-button>
            </el-empty>
          </div>
          <div v-else>
            <div
              v-for="email in emails"
              :key="email.id"
              class="email-list-item"
              :class="{ unread: !email.isRead }"
              @click="viewEmail(email.id)"
            >
              <el-checkbox
                :model-value="selectedIds.includes(email.id)"
                @click.stop
                @change="(val: boolean) => toggleSelect(email.id, val)"
              />
              <div class="email-avatar" :style="{ backgroundColor: getAvatarColor(email.from.address) }">
                {{ getAvatarText(email.from) }}
              </div>
              <div class="email-content">
                <div class="email-header">
                  <div class="email-from-info">
                    <span class="email-from">{{ email.from.name || email.from.address }}</span>
                    <el-tag size="small" type="info" class="account-tag">
                      {{ getAccountEmail(email.accountId) }}
                    </el-tag>
                  </div>
                  <span class="email-time">{{ formatDate(email.date) }}</span>
                </div>
                <div class="email-subject">{{ email.subject || '(无主题)' }}</div>
                <div class="email-preview">{{ getPreview(email.body) }}</div>
              </div>
              <div class="email-actions" :class="{ 'has-starred': email.isStarred }">
                <el-button
                  link
                  :type="email.isStarred ? 'warning' : 'default'"
                  :class="{ 'starred': email.isStarred }"
                  @click.stop="toggleStar(email)"
                >
                  <el-icon><Star /></el-icon>
                </el-button>
                <el-button link @click.stop="handleDelete(email.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </template>
      </el-skeleton>

      <!-- 分页 -->
      <div v-if="pagination.total > 0" class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="prev, pager, next, total"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { View, Hide, Delete, Star } from '@element-plus/icons-vue'
import { useEmailStore, useAccountStore } from '@/stores'
import { formatDate, truncateText } from '@/utils/email'
import type { Email, EmailAddress } from '@/types'

const router = useRouter()
const emailStore = useEmailStore()
const accountStore = useAccountStore()

// 状态
const searchQuery = ref('')
const filterAccountId = ref('')
const selectedIds = ref<string[]>([])
const selectAll = ref(false)
const loading = ref(false)
const emails = ref<Email[]>([])
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
})

// 计算属性
const accounts = computed(() => accountStore.accounts)

const isIndeterminate = computed(() => {
  return selectedIds.value.length > 0 && selectedIds.value.length < emails.value.length
})

// 监听筛选条件变化
watch(filterAccountId, () => {
  pagination.value.page = 1
  loadEmails()
})

// 方法
async function loadEmails() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    }
    if (filterAccountId.value) {
      params.accountId = filterAccountId.value
    }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    
    const result = await emailStore.fetchAllEmails(params)
    if (result) {
      emails.value = result.items
      pagination.value.total = result.total
      pagination.value.totalPages = result.totalPages
    }
  } finally {
    loading.value = false
  }
}

function viewEmail(id: string) {
  router.push(`/email/${id}`)
}

function getAccountEmail(accountId: string): string {
  const account = accounts.value.find(a => a.id === accountId)
  return account ? account.email : '未知账户'
}

function getAvatarText(from: EmailAddress): string {
  if (from.name) {
    return from.name.charAt(0).toUpperCase()
  }
  return from.address.charAt(0).toUpperCase()
}

function getAvatarColor(email: string): string {
  const colors = ['#f56c6c', '#e6a23c', '#67c23a', '#409eff', '#909399', '#9c27b0']
  const index = email.charCodeAt(0) % colors.length
  return colors[index] ?? '#909399'
}

function getPreview(body: string): string {
  const text = body?.replace(/<[^>]*>/g, '').trim() || ''
  return truncateText(text, 100)
}

function toggleSelect(id: string, selected: boolean) {
  if (selected) {
    selectedIds.value.push(id)
  } else {
    selectedIds.value = selectedIds.value.filter(i => i !== id)
  }
}

function handleSelectAll(val: boolean) {
  if (val) {
    selectedIds.value = emails.value.map(e => e.id)
  } else {
    selectedIds.value = []
  }
}

async function toggleStar(email: Email) {
  try {
    await emailStore.markAsStarred(email.id, !email.isStarred)
    loadEmails()
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleBatchRead(isRead: boolean) {
  if (selectedIds.value.length === 0) return
  try {
    await emailStore.batchMarkRead(selectedIds.value, isRead)
    ElMessage.success(isRead ? '已标记为已读' : '已标记为未读')
    selectedIds.value = []
    loadEmails()
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除这封邮件吗？', '确认删除', {
      type: 'warning'
    })
    await emailStore.deleteEmail(id)
    ElMessage.success('删除成功')
    loadEmails()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 封邮件吗？`, '确认删除', {
      type: 'warning'
    })
    await emailStore.batchDelete(selectedIds.value)
    ElMessage.success('删除成功')
    selectedIds.value = []
    loadEmails()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

function handleSearch() {
  pagination.value.page = 1
  loadEmails()
}

function handlePageChange(page: number) {
  pagination.value.page = page
  loadEmails()
}

async function handleRefresh() {
  await emailStore.refreshEmails()
  loadEmails()
}

// 生命周期
onMounted(async () => {
  await accountStore.fetchAccounts()
  loadEmails()
})
</script>

<style scoped>
.all-inbox-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.email-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.skeleton-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.empty-state {
  padding: 60px 20px;
}

.email-list-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.3s;
  gap: 15px;
}

.email-list-item:hover {
  background-color: #f5f7fa;
}

.email-list-item.unread {
  background-color: #ecf5ff;
}

.email-list-item.unread:hover {
  background-color: #d9ecff;
}

.email-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 500;
  flex-shrink: 0;
}

.email-content {
  flex: 1;
  min-width: 0;
}

.email-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.email-from-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.email-from {
  font-weight: 500;
  color: #303133;
}

.account-tag {
  font-size: 11px;
}

.email-time {
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}

.email-subject {
  font-size: 14px;
  color: #303133;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.email-list-item.unread .email-subject {
  font-weight: 600;
}

.email-preview {
  font-size: 13px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.email-actions {
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.3s;
}

.email-actions.has-starred {
  opacity: 1;
}

.email-actions.has-starred .el-button:not(.starred) {
  opacity: 0;
}

.email-actions .starred {
  opacity: 1 !important;
}

.email-list-item:hover .email-actions,
.email-list-item:hover .email-actions .el-button {
  opacity: 1;
}

.pagination {
  padding: 15px 20px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #ebeef5;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    width: 100%;
  }
  
  .toolbar-right {
    flex-direction: column;
    gap: 10px;
  }
  
  .toolbar-right .el-select,
  .toolbar-right .el-input {
    width: 100% !important;
    margin-right: 0 !important;
  }
  
  .email-actions {
    opacity: 1;
  }
  
  .email-from-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
