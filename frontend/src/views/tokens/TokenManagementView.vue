<template>
  <div class="token-management">
    <!-- 页面标题和操作 -->
    <div class="page-header">
      <h3>API令牌管理</h3>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon>
        创建令牌
      </el-button>
    </div>

    <!-- 令牌列表 -->
    <el-card class="token-table-card">
      <el-table 
        :data="tokens" 
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="令牌名称" min-width="120">
          <template #default="{ row }">
            <span class="token-name">{{ row.name }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="isActive" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="token" label="令牌" min-width="280">
          <template #default="{ row }">
            <div class="token-value-cell">
              <code class="token-value">{{ getDisplayToken(row) }}</code>
              <div class="token-actions">
                <el-tooltip :content="revealedTokens[row.id] ? '隐藏令牌' : '显示令牌'" placement="top">
                  <el-button 
                    link 
                    :icon="revealedTokens[row.id] ? Hide : View"
                    @click="toggleRevealToken(row)"
                    :loading="revealingTokens[row.id]"
                  />
                </el-tooltip>
                <el-tooltip content="复制令牌" placement="top">
                  <el-button 
                    link 
                    :icon="DocumentCopy"
                    @click="copyToken(row)"
                  />
                </el-tooltip>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="ipWhitelist" label="IP限制" min-width="150">
          <template #default="{ row }">
            <span v-if="row.ipWhitelist" class="ip-whitelist">
              {{ row.ipWhitelist }}
            </span>
            <span v-else class="no-limit">无限制</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="expiresAt" label="过期时间" width="170">
          <template #default="{ row }">
            <template v-if="row.expiresAt">
              <el-tag 
                :type="isExpired(row.expiresAt) ? 'danger' : 'info'" 
                size="small"
              >
                {{ formatDateTime(row.expiresAt) }}
              </el-tag>
            </template>
            <span v-else class="no-limit">永不过期</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-tooltip :content="row.isActive ? '禁用' : '启用'" placement="top">
                <el-button 
                  :type="row.isActive ? 'warning' : 'success'" 
                  :icon="row.isActive ? VideoPause : VideoPlay"
                  circle
                  size="small"
                  @click="handleToggle(row)"
                />
              </el-tooltip>
              <el-tooltip content="编辑" placement="top">
                <el-button 
                  type="primary" 
                  :icon="Edit"
                  circle
                  size="small"
                  @click="showEditDialog(row)"
                />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button 
                  type="danger" 
                  :icon="Delete"
                  circle
                  size="small"
                  @click="handleDelete(row)"
                />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <div v-if="tokens.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无API令牌">
          <el-button type="primary" @click="showCreateDialog">创建令牌</el-button>
        </el-empty>
      </div>
    </el-card>

    <!-- 创建/编辑令牌对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditing ? '编辑令牌' : '创建令牌'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="formRef" 
        :model="formData" 
        :rules="formRules" 
        label-width="100px"
      >
        <el-form-item label="令牌名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入令牌名称" />
        </el-form-item>
        
        <el-form-item label="IP白名单" prop="ipWhitelist">
          <el-input 
            v-model="formData.ipWhitelist" 
            placeholder="多个IP用逗号分隔，留空表示不限制"
          />
          <div class="form-tip">例如: 192.168.1.1,10.0.0.1</div>
        </el-form-item>
        
        <el-form-item label="过期时间" prop="expiresAt">
          <el-date-picker
            v-model="formData.expiresAt"
            type="datetime"
            placeholder="选择过期时间，留空表示永不过期"
            style="width: 100%"
            :disabled-date="disabledDate"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEditing ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 新创建令牌显示对话框 -->
    <el-dialog 
      v-model="newTokenDialogVisible" 
      title="令牌创建成功"
      width="550px"
      :close-on-click-modal="false"
    >
      <el-alert 
        type="warning" 
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      >
        <template #title>
          请妥善保存以下令牌，关闭后将无法再次查看完整令牌！
        </template>
      </el-alert>
      
      <div class="new-token-display">
        <label>令牌值：</label>
        <div class="token-box">
          <code>{{ newTokenValue }}</code>
          <el-button type="primary" size="small" @click="copyNewToken">
            <el-icon><DocumentCopy /></el-icon>
            复制
          </el-button>
        </div>
      </div>
      
      <template #footer>
        <el-button type="primary" @click="newTokenDialogVisible = false">
          我已保存，关闭
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, View, Hide, DocumentCopy, Edit, Delete, VideoPause, VideoPlay } from '@element-plus/icons-vue'
import { 
  getTokens, 
  createToken, 
  updateToken, 
  toggleToken, 
  deleteToken,
  revealToken,
  type ApiToken 
} from '@/api/token'

// 状态
const loading = ref(false)
const submitting = ref(false)
const tokens = ref<ApiToken[]>([])
const dialogVisible = ref(false)
const newTokenDialogVisible = ref(false)
const newTokenValue = ref('')
const isEditing = ref(false)
const editingId = ref('')
const formRef = ref<FormInstance>()

// 令牌显示状态
const revealedTokens = ref<Record<string, boolean>>({})
const revealedTokenValues = ref<Record<string, string>>({})
const revealingTokens = ref<Record<string, boolean>>({})

// 表单数据
const formData = reactive({
  name: '',
  ipWhitelist: '',
  expiresAt: null as Date | null
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入令牌名称', trigger: 'blur' },
    { min: 1, max: 100, message: '名称长度在 1 到 100 个字符', trigger: 'blur' }
  ]
}

// 获取令牌列表
async function fetchTokens() {
  loading.value = true
  try {
    const res = await getTokens()
    if (res.success && res.data) {
      tokens.value = res.data
    }
  } catch (error) {
    ElMessage.error('获取令牌列表失败')
  } finally {
    loading.value = false
  }
}

// 获取显示的令牌值
function getDisplayToken(row: ApiToken): string {
  if (revealedTokens.value[row.id] && revealedTokenValues.value[row.id]) {
    return revealedTokenValues.value[row.id] || row.token
  }
  return row.token
}

// 切换显示/隐藏令牌
async function toggleRevealToken(row: ApiToken) {
  if (revealedTokens.value[row.id]) {
    // 隐藏令牌
    revealedTokens.value[row.id] = false
    return
  }
  
  // 显示令牌
  revealingTokens.value[row.id] = true
  try {
    const res = await revealToken(row.id)
    if (res.success && res.data) {
      revealedTokenValues.value[row.id] = res.data.token
      revealedTokens.value[row.id] = true
    }
  } catch (error) {
    ElMessage.error('获取令牌失败')
  } finally {
    revealingTokens.value[row.id] = false
  }
}

// 复制令牌
async function copyToken(row: ApiToken) {
  let tokenValue = row.token
  
  // 如果令牌已显示，使用完整值
  if (revealedTokens.value[row.id] && revealedTokenValues.value[row.id]) {
    tokenValue = revealedTokenValues.value[row.id] || tokenValue
  } else {
    // 否则先获取完整令牌
    try {
      const res = await revealToken(row.id)
      if (res.success && res.data) {
        tokenValue = res.data.token
      }
    } catch (error) {
      ElMessage.error('获取令牌失败')
      return
    }
  }
  
  try {
    await navigator.clipboard.writeText(tokenValue)
    ElMessage.success('令牌已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
}

// 复制新创建的令牌
async function copyNewToken() {
  try {
    await navigator.clipboard.writeText(newTokenValue.value)
    ElMessage.success('令牌已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
}

// 显示创建对话框
function showCreateDialog() {
  isEditing.value = false
  editingId.value = ''
  formData.name = ''
  formData.ipWhitelist = ''
  formData.expiresAt = null
  dialogVisible.value = true
}

// 显示编辑对话框
function showEditDialog(row: ApiToken) {
  isEditing.value = true
  editingId.value = row.id
  formData.name = row.name
  formData.ipWhitelist = row.ipWhitelist || ''
  formData.expiresAt = row.expiresAt ? new Date(row.expiresAt) : null
  dialogVisible.value = true
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      const data = {
        name: formData.name,
        ipWhitelist: formData.ipWhitelist || undefined,
        expiresAt: formData.expiresAt ? formData.expiresAt.toISOString() : undefined
      }
      
      if (isEditing.value) {
        const res = await updateToken(editingId.value, data)
        if (res.success) {
          ElMessage.success('令牌更新成功')
          dialogVisible.value = false
          fetchTokens()
        }
      } else {
        const res = await createToken(data)
        if (res.success && res.data) {
          dialogVisible.value = false
          // 显示新令牌
          newTokenValue.value = res.data.token
          newTokenDialogVisible.value = true
          fetchTokens()
        }
      }
    } catch (error) {
      ElMessage.error(isEditing.value ? '更新失败' : '创建失败')
    } finally {
      submitting.value = false
    }
  })
}

// 切换令牌状态
async function handleToggle(row: ApiToken) {
  const action = row.isActive ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(
      `确定要${action}令牌 "${row.name}" 吗？`,
      '确认操作',
      { type: 'warning' }
    )
    
    const res = await toggleToken(row.id)
    if (res.success) {
      ElMessage.success(`令牌已${action}`)
      fetchTokens()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`)
    }
  }
}

// 删除令牌
async function handleDelete(row: ApiToken) {
  try {
    await ElMessageBox.confirm(
      `确定要删除令牌 "${row.name}" 吗？此操作不可恢复！`,
      '确认删除',
      { type: 'warning' }
    )
    
    const res = await deleteToken(row.id)
    if (res.success) {
      ElMessage.success('令牌已删除')
      fetchTokens()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 格式化日期时间
function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 检查是否过期
function isExpired(dateStr: string): boolean {
  return new Date(dateStr) < new Date()
}

// 禁用过去的日期
function disabledDate(date: Date): boolean {
  return date.getTime() < Date.now() - 24 * 60 * 60 * 1000
}

// 初始化
onMounted(() => {
  fetchTokens()
})
</script>

<style scoped>
.token-management {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.token-table-card {
  border-radius: 8px;
}

.token-name {
  font-weight: 500;
}

.token-value-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.token-value {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  background-color: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
  word-break: break-all;
  flex: 1;
}

.token-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.ip-whitelist {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #606266;
}

.no-limit {
  color: #909399;
  font-size: 13px;
}

.empty-state {
  padding: 40px 0;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.new-token-display {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
}

.new-token-display label {
  display: block;
  font-weight: 500;
  margin-bottom: 10px;
}

.token-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #fff;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.token-box code {
  flex: 1;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  word-break: break-all;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .token-value-cell {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .token-actions {
    margin-top: 8px;
  }
}
</style>
