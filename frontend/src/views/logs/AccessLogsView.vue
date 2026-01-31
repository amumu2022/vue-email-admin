<template>
  <div class="logs-container">
    <el-card class="logs-card">
      <template #header>
        <div class="card-header">
          <span>{{ pageTitle }}</span>
          <div class="header-actions">
            <el-button type="danger" :icon="Delete" @click="handleClearLogs">
              清除旧日志
            </el-button>
            <el-button :icon="Refresh" @click="fetchLogs">刷新</el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchParams.username"
          placeholder="用户名"
          clearable
          style="width: 150px"
          @clear="fetchLogs"
          @keyup.enter="fetchLogs"
        />
        <el-input
          v-model="searchParams.ipAddress"
          placeholder="IP地址"
          clearable
          style="width: 150px"
          @clear="fetchLogs"
          @keyup.enter="fetchLogs"
        />
        <el-input
          v-model="searchParams.path"
          placeholder="请求路径"
          clearable
          style="width: 200px"
          @clear="fetchLogs"
          @keyup.enter="fetchLogs"
        />
        <el-button type="primary" :icon="Search" @click="fetchLogs">搜索</el-button>
      </div>
      
      <!-- 日志表格 -->
      <el-table
        v-loading="loading"
        :data="logs"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="username" label="用户名" width="120">
          <template #default="{ row }">
            {{ row.username || '-' }}
          </template>
        </el-table-column>
        <el-table-column 
          prop="ipAddress" 
          label="IP地址" 
          :width="logType === 'open_api' ? 160 : 140"
          :class-name="logType === 'open_api' ? 'ip-highlight' : ''"
        >
          <template #default="{ row }">
            <span :class="{ 'ip-address-highlight': logType === 'open_api' }">
              {{ row.ipAddress || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="method" label="方法" width="80">
          <template #default="{ row }">
            <el-tag :type="getMethodType(row.method)" size="small">
              {{ row.method }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="请求路径" min-width="200" show-overflow-tooltip />
        <el-table-column prop="statusCode" label="状态码" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.statusCode)" size="small">
              {{ row.statusCode || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="访问时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button
              type="danger"
              link
              size="small"
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchLogs"
          @current-change="fetchLogs"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Delete, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAccessLogs, deleteAccessLog, clearAccessLogs, type AccessLog } from '@/api/logs'

const route = useRoute()
const loading = ref(false)
const logs = ref<AccessLog[]>([])

// 获取当前日志类型
const logType = computed(() => {
  return (route.meta.logType as 'open_api' | 'login' | 'other' | undefined)
})

// 页面标题
const pageTitle = computed(() => {
  switch (logType.value) {
    case 'open_api':
      return '开放API日志'
    case 'login':
      return '登录日志'
    case 'other':
      return '操作日志'
    default:
      return '访问日志'
  }
})

const searchParams = reactive({
  username: '',
  ipAddress: '',
  path: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

async function fetchLogs() {
  loading.value = true
  try {
    const res = await getAccessLogs({
      page: pagination.page,
      pageSize: pagination.pageSize,
      username: searchParams.username || undefined,
      ipAddress: searchParams.ipAddress || undefined,
      path: searchParams.path || undefined,
      logType: logType.value
    })
    if (res.success && res.data) {
      logs.value = res.data.items
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('获取日志失败:', error)
  } finally {
    loading.value = false
  }
}

// 监听路由变化，重新获取日志
watch(() => route.meta.logType, () => {
  pagination.page = 1
  fetchLogs()
})

async function handleDelete(logId: string) {
  try {
    await ElMessageBox.confirm('确定要删除这条日志吗？', '提示', {
      type: 'warning'
    })
    
    const res = await deleteAccessLog(logId)
    if (res.success) {
      ElMessage.success('删除成功')
      fetchLogs()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.detail || '删除失败')
    }
  }
}

async function handleClearLogs() {
  try {
    const { value } = await ElMessageBox.prompt('请输入要清除多少天前的日志', '清除旧日志', {
      inputValue: '30',
      inputPattern: /^\d+$/,
      inputErrorMessage: '请输入有效的天数'
    })
    
    const days = parseInt(value)
    const res = await clearAccessLogs(days)
    if (res.success) {
      ElMessage.success(res.message || `已清除 ${res.data?.deletedCount} 条日志`)
      fetchLogs()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.detail || '清除失败')
    }
  }
}

function getMethodType(method: string) {
  const types: Record<string, string> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    PATCH: 'warning',
    DELETE: 'danger'
  }
  return types[method] || 'info'
}

function getStatusType(status: number | undefined) {
  if (!status) return 'info'
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400 && status < 500) return 'warning'
  if (status >= 500) return 'danger'
  return 'info'
}

function formatTime(time: string | undefined) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.logs-container {
  padding: 0;
}

.logs-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.ip-address-highlight {
  font-weight: 600;
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}
</style>
