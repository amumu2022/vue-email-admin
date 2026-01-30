<template>
  <div class="server-config-container">
    <div class="config-card">
      <div class="config-header">
        <el-icon class="logo-icon"><Connection /></el-icon>
        <h1>服务器配置</h1>
        <p>管理后端服务器连接配置</p>
      </div>
      
      <!-- 已保存的配置列表 -->
      <div v-if="serverConfigs.length > 0" class="saved-configs">
        <div class="section-title">
          <span>已保存的配置</span>
          <el-button type="primary" link size="small" @click="showAddForm = true">
            <el-icon><Plus /></el-icon>
            添加新配置
          </el-button>
        </div>
        
        <div class="config-list">
          <div 
            v-for="config in serverConfigs" 
            :key="config.id" 
            class="config-item"
            :class="{ active: currentConfigId === config.id }"
          >
            <div class="config-info" @click="selectConfig(config)">
              <div class="config-name">
                <el-icon><Link /></el-icon>
                {{ config.name }}
              </div>
              <div class="config-url">{{ config.url }}</div>
            </div>
            <div class="config-actions">
              <el-button type="primary" link size="small" @click.stop="editConfig(config)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button type="danger" link size="small" @click.stop="confirmDeleteConfig(config)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
        
        <el-button 
          v-if="currentConfigId"
          type="primary" 
          size="large" 
          class="use-config-btn"
          @click="useSelectedConfig"
        >
          <el-icon><Select /></el-icon>
          使用选中的配置
        </el-button>
      </div>
      
      <!-- 添加/编辑配置表单 -->
      <div v-if="showAddForm || serverConfigs.length === 0" class="add-config-form">
        <div v-if="serverConfigs.length > 0" class="form-header">
          <span>{{ editingConfig ? '编辑配置' : '添加新配置' }}</span>
          <el-button type="info" link @click="cancelForm">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="config-form"
          @submit.prevent="handleSubmit"
        >
          <el-form-item prop="name" label="配置名称">
            <el-input
              v-model="form.name"
              placeholder="例如: 本地服务器、生产环境"
              size="large"
              :prefix-icon="Notebook"
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="serverUrl" label="服务器地址">
            <el-input
              v-model="form.serverUrl"
              placeholder="例如: http://192.168.1.100:8000"
              size="large"
              :prefix-icon="Link"
              clearable
              @input="updateNormalizedUrl"
            />
          </el-form-item>
          
          <!-- 显示规范化后的URL -->
          <div v-if="normalizedUrlPreview" class="normalized-url-preview">
            <span class="preview-label">实际保存地址:</span>
            <span class="preview-url">{{ normalizedUrlPreview }}</span>
          </div>
          
          <div class="url-tips">
            <p><el-icon><InfoFilled /></el-icon> 提示：</p>
            <ul>
              <li>请输入完整的服务器地址，包含协议（http/https）</li>
              <li>如果服务器在本地，可以使用 http://localhost:8000</li>
              <li>系统会自动添加 /api 后缀</li>
            </ul>
          </div>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="testing"
              @click="handleSubmit"
            >
              <el-icon v-if="!testing"><Select /></el-icon>
              {{ testing ? '正在测试连接...' : (editingConfig ? '测试并更新' : '测试并保存') }}
            </el-button>
          </el-form-item>
        </el-form>
        
        <!-- 连接状态显示 -->
        <div v-if="connectionStatus" class="connection-status" :class="connectionStatus.type">
          <el-icon v-if="connectionStatus.type === 'success'"><CircleCheckFilled /></el-icon>
          <el-icon v-else><CircleCloseFilled /></el-icon>
          <span>{{ connectionStatus.message }}</span>
        </div>
      </div>
    </div>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="400px"
      :close-on-click-modal="false"
    >
      <p>确定要删除配置 "{{ configToDelete?.name }}" 吗？</p>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="doDeleteConfig">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Connection, Link, InfoFilled, Select, CircleCheckFilled, CircleCloseFilled, Plus, Edit, Delete, Close, Notebook } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { 
  getApiBaseUrl, 
  setApiBaseUrl, 
  validateApiUrl, 
  normalizeApiUrl,
  getServerConfigs,
  addServerConfig,
  updateServerConfig,
  deleteServerConfig,
  type ServerConfig
} from '@/api/request'

const router = useRouter()

const formRef = ref<FormInstance>()
const testing = ref(false)
const connectionStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const normalizedUrlPreview = ref<string>('')
const showAddForm = ref(false)
const editingConfig = ref<ServerConfig | null>(null)
const deleteDialogVisible = ref(false)
const configToDelete = ref<ServerConfig | null>(null)

const form = reactive({
  name: '',
  serverUrl: ''
})

// 服务器配置列表
const serverConfigs = ref<ServerConfig[]>([])
const currentConfigId = ref<string | null>(null)

// 当前选中的配置
const selectedConfig = computed(() => {
  return serverConfigs.value.find(c => c.id === currentConfigId.value)
})

// 更新规范化URL预览
function updateNormalizedUrl() {
  if (form.serverUrl && form.serverUrl.startsWith('http')) {
    try {
      new URL(form.serverUrl)
      normalizedUrlPreview.value = normalizeApiUrl(form.serverUrl)
    } catch {
      normalizedUrlPreview.value = ''
    }
  } else {
    normalizedUrlPreview.value = ''
  }
}

// URL 验证规则
const validateUrl = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入服务器地址'))
    return
  }
  
  // 检查是否以 http:// 或 https:// 开头
  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    callback(new Error('请输入完整的URL，需要包含 http:// 或 https://'))
    return
  }
  
  // 简单的URL格式验证
  try {
    new URL(value)
    callback()
  } catch {
    callback(new Error('URL格式不正确'))
  }
}

const rules: FormRules = {
  name: [
    { required: true, message: '请输入配置名称', trigger: 'blur' },
    { min: 1, max: 50, message: '配置名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  serverUrl: [
    { required: true, message: '请输入服务器地址', trigger: 'blur' },
    { validator: validateUrl, trigger: 'blur' }
  ]
}

// 选择配置
function selectConfig(config: ServerConfig) {
  currentConfigId.value = config.id
}

// 使用选中的配置
function useSelectedConfig() {
  if (selectedConfig.value) {
    setApiBaseUrl(selectedConfig.value.url)
    ElMessage.success(`已切换到: ${selectedConfig.value.name}`)
    router.push('/login')
  }
}

// 编辑配置
function editConfig(config: ServerConfig) {
  editingConfig.value = config
  form.name = config.name
  form.serverUrl = config.url
  updateNormalizedUrl()
  showAddForm.value = true
}

// 确认删除配置
function confirmDeleteConfig(config: ServerConfig) {
  configToDelete.value = config
  deleteDialogVisible.value = true
}

// 执行删除配置
function doDeleteConfig() {
  if (configToDelete.value) {
    deleteServerConfig(configToDelete.value.id)
    serverConfigs.value = getServerConfigs()
    
    // 如果删除的是当前选中的配置，清除选中状态
    if (currentConfigId.value === configToDelete.value.id) {
      currentConfigId.value = null
    }
    
    ElMessage.success('配置已删除')
    deleteDialogVisible.value = false
    configToDelete.value = null
  }
}

// 取消表单
function cancelForm() {
  showAddForm.value = false
  editingConfig.value = null
  form.name = ''
  form.serverUrl = ''
  normalizedUrlPreview.value = ''
  connectionStatus.value = null
}

async function handleSubmit() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    testing.value = true
    connectionStatus.value = null
    
    try {
      // 验证服务器连接
      const result = await validateApiUrl(form.serverUrl)
      
      if (result.success) {
        connectionStatus.value = { type: 'success', message: result.message }
        
        if (editingConfig.value) {
          // 更新配置
          updateServerConfig(editingConfig.value.id, form.name, form.serverUrl)
          ElMessage.success('配置已更新！')
        } else {
          // 添加新配置
          const newConfig = addServerConfig(form.name, form.serverUrl)
          currentConfigId.value = newConfig.id
          ElMessage.success('配置已保存！')
        }
        
        // 刷新配置列表
        serverConfigs.value = getServerConfigs()
        
        // 设置为当前使用的配置
        setApiBaseUrl(form.serverUrl)
        
        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          router.push('/login')
        }, 1000)
      } else {
        connectionStatus.value = { type: 'error', message: result.message }
        ElMessage.error(result.message)
      }
    } catch (error: any) {
      connectionStatus.value = { type: 'error', message: error.message || '连接失败' }
      ElMessage.error(error.message || '连接失败')
    } finally {
      testing.value = false
    }
  })
}

onMounted(() => {
  // 加载已保存的配置
  serverConfigs.value = getServerConfigs()
  
  // 获取当前使用的配置URL
  const currentUrl = getApiBaseUrl()
  if (currentUrl) {
    // 查找匹配的配置
    const matchedConfig = serverConfigs.value.find(c => c.url === currentUrl)
    if (matchedConfig) {
      currentConfigId.value = matchedConfig.id
    }
  }
  
  // 如果没有配置，显示添加表单
  if (serverConfigs.value.length === 0) {
    showAddForm.value = true
  }
})
</script>

<style scoped>
.server-config-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  /* 移动端安全区域 */
  padding-top: max(20px, env(safe-area-inset-top));
}

.config-card {
  width: 100%;
  max-width: 500px;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.config-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-icon {
  font-size: 48px;
  color: #667eea;
  margin-bottom: 16px;
}

.config-header h1 {
  font-size: 24px;
  color: #303133;
  margin: 0 0 8px 0;
}

.config-header p {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.saved-configs {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.config-list {
  max-height: 240px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.config-item:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.config-item.active {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.config-info {
  flex: 1;
  min-width: 0;
}

.config-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.config-url {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.config-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.use-config-btn {
  width: 100%;
}

.add-config-form {
  border-top: 1px solid #e4e7ed;
  padding-top: 20px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.config-form {
  margin-bottom: 20px;
}

.normalized-url-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 13px;
}

.preview-label {
  color: #1890ff;
  font-weight: 500;
  white-space: nowrap;
}

.preview-url {
  color: #096dd9;
  word-break: break-all;
}

.url-tips {
  background-color: #f4f4f5;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #606266;
}

.url-tips p {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 0 8px 0;
  font-weight: 500;
  color: #409eff;
}

.url-tips ul {
  margin: 0;
  padding-left: 20px;
}

.url-tips li {
  margin-bottom: 4px;
  line-height: 1.5;
}

.url-tips li:last-child {
  margin-bottom: 0;
}

.submit-btn {
  width: 100%;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 14px;
}

.connection-status.success {
  background-color: #f0f9eb;
  color: #67c23a;
}

.connection-status.error {
  background-color: #fef0f0;
  color: #f56c6c;
}

/* 深色模式 */
html.dark .config-card {
  background-color: #1f2937;
}

html.dark .config-header h1 {
  color: #e4e4e7;
}

html.dark .config-header p {
  color: #9ca3af;
}

html.dark .section-title {
  color: #d1d5db;
}

html.dark .config-item {
  border-color: #374151;
  background-color: #1f2937;
}

html.dark .config-item:hover {
  border-color: #3b82f6;
  background-color: #374151;
}

html.dark .config-item.active {
  border-color: #3b82f6;
  background-color: #1e3a5f;
}

html.dark .config-name {
  color: #e4e4e7;
}

html.dark .config-url {
  color: #9ca3af;
}

html.dark .add-config-form {
  border-top-color: #374151;
}

html.dark .form-header {
  color: #d1d5db;
}

html.dark .url-tips {
  background-color: #374151;
  color: #d1d5db;
}

html.dark .url-tips p {
  color: #60a5fa;
}

html.dark .normalized-url-preview {
  background-color: #1e3a5f;
  border-color: #3b82f6;
}

html.dark .preview-label {
  color: #60a5fa;
}

html.dark .preview-url {
  color: #93c5fd;
}

html.dark .connection-status.success {
  background-color: #064e3b;
  color: #6ee7b7;
}

html.dark .connection-status.error {
  background-color: #7f1d1d;
  color: #fca5a5;
}

/* 响应式 */
@media (max-width: 480px) {
  .config-card {
    padding: 24px;
  }
  
  .config-header h1 {
    font-size: 20px;
  }
  
  .url-tips {
    font-size: 12px;
  }
  
  .config-item {
    padding: 10px 12px;
  }
  
  .config-name {
    font-size: 13px;
  }
  
  .config-url {
    font-size: 11px;
  }
}
</style>
