<template>
  <div class="account-list-view">
    <!-- 工具栏 -->
    <div class="toolbar card">
      <h2 class="toolbar-title">邮箱账户管理</h2>
      <el-button type="primary" @click="goToAddAccount">
        <el-icon><Plus /></el-icon>
        添加账户
      </el-button>
    </div>

    <!-- 账户列表 -->
    <div class="account-grid">
      <el-skeleton :loading="loading" animated :count="3">
        <template #template>
          <div class="account-card card">
            <div class="account-card-header">
              <el-skeleton-item variant="circle" style="width: 60px; height: 60px" />
              <div style="flex: 1; margin-left: 15px">
                <el-skeleton-item variant="h3" style="width: 60%" />
                <el-skeleton-item variant="text" style="width: 80%; margin-top: 10px" />
              </div>
            </div>
            <div class="account-card-body">
              <el-skeleton-item variant="text" style="width: 100%" />
              <el-skeleton-item variant="text" style="width: 100%; margin-top: 10px" />
            </div>
          </div>
        </template>
        <template #default>
          <div v-if="accounts.length === 0" class="empty-state card">
            <el-empty description="暂无邮箱账户">
              <el-button type="primary" @click="goToAddAccount">添加第一个账户</el-button>
            </el-empty>
          </div>
          <template v-else>
            <div
              v-for="account in accounts"
              :key="account.id"
              class="account-card card"
            >
              <div class="account-card-header">
                <div class="account-avatar" :style="{ backgroundColor: getProviderColor(account.provider) }">
                  {{ account.email.charAt(0).toUpperCase() }}
                </div>
                <div class="account-header-info">
                  <h3 class="account-name">{{ account.name }}</h3>
                  <p class="account-email">{{ account.email }}</p>
                </div>
                <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, account)">
                  <el-button link>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">
                        <el-icon><Edit /></el-icon>
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item command="sync">
                        <el-icon><Refresh /></el-icon>
                        同步邮件
                      </el-dropdown-item>
                      <el-dropdown-item command="toggle">
                        <el-icon><component :is="account.isActive ? 'CircleClose' : 'CircleCheck'" /></el-icon>
                        {{ account.isActive ? '禁用' : '启用' }}
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <el-icon><Delete /></el-icon>
                        <span style="color: #f56c6c">删除</span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>

              <div class="account-card-body">
                <div class="account-info-row">
                  <span class="info-label">提供商:</span>
                  <el-tag size="small" :color="getProviderColor(account.provider)" effect="dark">
                    {{ getProviderName(account.provider) }}
                  </el-tag>
                </div>
                <div class="account-info-row">
                  <span class="info-label">IMAP:</span>
                  <span class="info-value">{{ account.imapHost }}:{{ account.imapPort }}</span>
                </div>
                <div class="account-info-row">
                  <span class="info-label">SMTP:</span>
                  <span class="info-value">{{ account.smtpHost }}:{{ account.smtpPort }}</span>
                </div>
                <div class="account-info-row">
                  <span class="info-label">状态:</span>
                  <el-tag :type="account.isActive ? 'success' : 'info'" size="small">
                    {{ account.isActive ? '已启用' : '已禁用' }}
                  </el-tag>
                </div>
              </div>

              <div class="account-card-footer">
                <span class="update-time">
                  更新于 {{ formatDate(account.updatedAt) }}
                </span>
              </div>
            </div>
          </template>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, MoreFilled, Edit, Refresh, Delete } from '@element-plus/icons-vue'
import { useAccountStore } from '@/stores'
import { getProviderColor, formatDate, providerConfigs } from '@/utils/email'
import type { EmailAccount, EmailProvider } from '@/types'

const router = useRouter()
const accountStore = useAccountStore()

// 计算属性
const accounts = computed(() => accountStore.accounts)
const loading = computed(() => accountStore.loading)

// 方法
function goToAddAccount() {
  router.push('/accounts/add')
}

function getProviderName(provider: EmailProvider): string {
  return providerConfigs[provider]?.name || '自定义'
}

async function handleCommand(command: string, account: EmailAccount) {
  switch (command) {
    case 'edit':
      router.push(`/accounts/edit/${account.id}`)
      break
    case 'sync':
      await handleSync(account)
      break
    case 'toggle':
      await handleToggle(account)
      break
    case 'delete':
      await handleDelete(account)
      break
  }
}

async function handleSync(account: EmailAccount) {
  try {
    ElMessage.info('开始同步邮件...')
    const result = await accountStore.syncAccount(account.id)
    if (result) {
      ElMessage.success(`同步完成，获取了 ${result.syncedCount} 封新邮件`)
    }
  } catch {
    ElMessage.error('同步失败')
  }
}

async function handleToggle(account: EmailAccount) {
  try {
    await accountStore.updateAccount(account.id, { 
      name: account.name,
      email: account.email,
      provider: account.provider,
      password: account.password,
      imapHost: account.imapHost,
      imapPort: account.imapPort,
      smtpHost: account.smtpHost,
      smtpPort: account.smtpPort,
      useSSL: account.useSSL
    })
    ElMessage.success(account.isActive ? '已禁用账户' : '已启用账户')
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleDelete(account: EmailAccount) {
  try {
    await ElMessageBox.confirm(
      `确定要删除账户 "${account.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '删除',
        confirmButtonClass: 'el-button--danger'
      }
    )
    await accountStore.removeAccount(account.id)
    ElMessage.success('删除成功')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 生命周期
onMounted(() => {
  accountStore.fetchAccounts()
})
</script>

<style scoped>
.account-list-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 60px 20px;
}

.account-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.account-card-header {
  display: flex;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.account-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  background-color: rgba(255, 255, 255, 0.2) !important;
  flex-shrink: 0;
}

.account-header-info {
  flex: 1;
  margin-left: 15px;
  min-width: 0;
}

.account-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 5px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-email {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-card-header .el-button {
  color: #fff;
}

.account-card-body {
  padding: 20px;
  flex: 1;
}

.account-info-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.account-info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 70px;
  font-size: 13px;
  color: #909399;
  flex-shrink: 0;
}

.info-value {
  font-size: 13px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-card-footer {
  padding: 15px 20px;
  border-top: 1px solid #ebeef5;
  background-color: #fafafa;
}

.update-time {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .account-grid {
    grid-template-columns: 1fr;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
}
</style>
