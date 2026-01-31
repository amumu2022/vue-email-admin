<template>
  <div class="settings-view">
    <div class="settings-container">
      <h2 class="page-title">设置</h2>

      <!-- 服务器设置 -->
      <div class="settings-section card">
        <h3 class="section-title">
          <el-icon><Connection /></el-icon>
          服务器设置
        </h3>
        
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">后端服务器地址</div>
            <div class="setting-desc">当前连接的后端API服务器</div>
          </div>
          <div class="server-url-display">
            <span class="current-url">{{ currentServerUrl || '未配置' }}</span>
            <el-button type="primary" link @click="goToServerConfig">
              <el-icon><Edit /></el-icon>
              修改
            </el-button>
          </div>
        </div>
      </div>

      <!-- 通用设置 -->
      <div class="settings-section card">
        <h3 class="section-title">
          <el-icon><Setting /></el-icon>
          通用设置
        </h3>
        
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">自动刷新邮件</div>
            <div class="setting-desc">定时自动检查新邮件</div>
          </div>
          <el-switch v-model="settings.autoRefresh" />
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">刷新间隔</div>
            <div class="setting-desc">自动刷新邮件的时间间隔</div>
          </div>
          <el-select v-model="settings.refreshInterval" style="width: 120px" :disabled="!settings.autoRefresh">
            <el-option label="1 分钟" :value="1" />
            <el-option label="5 分钟" :value="5" />
            <el-option label="10 分钟" :value="10" />
            <el-option label="30 分钟" :value="30" />
          </el-select>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">每页显示邮件数</div>
            <div class="setting-desc">邮件列表每页显示的邮件数量</div>
          </div>
          <el-select v-model="settings.pageSize" style="width: 120px">
            <el-option label="10 封" :value="10" />
            <el-option label="20 封" :value="20" />
            <el-option label="50 封" :value="50" />
            <el-option label="100 封" :value="100" />
          </el-select>
        </div>
      </div>

      <!-- 通知设置 -->
      <div class="settings-section card">
        <h3 class="section-title">
          <el-icon><Bell /></el-icon>
          通知设置
        </h3>
        
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">新邮件通知</div>
            <div class="setting-desc">收到新邮件时显示通知</div>
          </div>
          <el-switch v-model="settings.notifications" />
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">通知声音</div>
            <div class="setting-desc">收到新邮件时播放提示音</div>
          </div>
          <el-switch v-model="settings.notificationSound" :disabled="!settings.notifications" />
        </div>
      </div>

      <!-- 显示设置 -->
      <div class="settings-section card">
        <h3 class="section-title">
          <el-icon><Monitor /></el-icon>
          显示设置
        </h3>
        
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">主题模式</div>
            <div class="setting-desc">选择界面主题</div>
          </div>
          <el-select v-model="settings.theme" style="width: 120px">
            <el-option label="浅色" value="light" />
            <el-option label="深色" value="dark" />
            <el-option label="跟随系统" value="auto" />
          </el-select>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">紧凑模式</div>
            <div class="setting-desc">使用更紧凑的界面布局</div>
          </div>
          <el-switch v-model="settings.compactMode" />
        </div>
      </div>

      <!-- 缓存设置 -->
      <div class="settings-section card">
        <h3 class="section-title">
          <el-icon><FolderOpened /></el-icon>
          缓存设置
        </h3>
        
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">邮件本地缓存</div>
            <div class="setting-desc">缓存邮件数据到本地，加快加载速度（缓存30分钟后自动过期）</div>
          </div>
          <el-switch v-model="settings.enableCache" />
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">清除缓存</div>
            <div class="setting-desc">清除所有本地缓存的邮件数据</div>
          </div>
          <el-button type="danger" :loading="clearingCache" @click="handleClearCache">
            <el-icon><Delete /></el-icon>
            清除缓存
          </el-button>
        </div>
      </div>

      <!-- 版本更新 -->
      <div class="settings-section card">
        <h3 class="section-title">
          <el-icon><Upload /></el-icon>
          版本更新
        </h3>
        
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">当前版本</div>
            <div class="setting-desc">v{{ appVersion }}</div>
          </div>
          <el-button
            type="primary"
            :loading="checkingUpdate"
            @click="handleCheckUpdate"
          >
            <el-icon><Refresh /></el-icon>
            检查更新
          </el-button>
        </div>

        <div v-if="updateInfo" class="update-info">
          <div v-if="updateInfo.hasUpdate" class="update-available">
            <el-alert
              title="发现新版本"
              type="success"
              :closable="false"
              show-icon
            >
              <template #default>
                <div class="update-details">
                  <p>最新版本: <strong>v{{ updateInfo.latestVersion }}</strong></p>
                  <p v-if="updateInfo.releaseInfo?.published_at">
                    发布时间: {{ formatDate(updateInfo.releaseInfo.published_at) }}
                  </p>
                </div>
              </template>
            </el-alert>
            
            <div class="update-actions">
              <el-button
                type="primary"
                @click="downloadUpdate('apk')"
                v-if="updateInfo.downloadUrls.apk"
              >
                <el-icon><Download /></el-icon>
                下载 APK
              </el-button>
              <el-button
                @click="viewReleaseNotes"
                v-if="updateInfo.releaseInfo?.html_url"
              >
                <el-icon><Document /></el-icon>
                查看更新日志
              </el-button>
            </div>
          </div>
          
          <div v-else class="no-update">
            <el-alert
              title="已是最新版本"
              type="info"
              :closable="false"
              show-icon
            >
              <template #default>
                当前版本 v{{ appVersion }} 已是最新版本
              </template>
            </el-alert>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">固定下载链接</div>
            <div class="setting-desc">以下链接始终指向最新版本，可用于自动更新</div>
          </div>
        </div>
        
        <div class="download-links">
          <div class="download-link-item">
            <span class="link-label">APK:</span>
            <el-link
              type="primary"
              :href="fixedDownloadUrls.apk"
              target="_blank"
              :underline="false"
            >
              {{ fixedDownloadUrls.apk }}
            </el-link>
            <el-button size="small" @click="copyToClipboard(fixedDownloadUrls.apk)">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </div>
          <div class="download-link-item">
            <span class="link-label">前端:</span>
            <el-link
              type="primary"
              :href="fixedDownloadUrls.frontend"
              target="_blank"
              :underline="false"
            >
              {{ fixedDownloadUrls.frontend }}
            </el-link>
            <el-button size="small" @click="copyToClipboard(fixedDownloadUrls.frontend)">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 关于 -->
      <div class="settings-section card">
        <h3 class="section-title">
          <el-icon><InfoFilled /></el-icon>
          关于
        </h3>
        
        <div class="about-info">
          <div class="app-logo">
            <el-icon size="48"><Message /></el-icon>
          </div>
          <div class="app-details">
            <h4 class="app-name">邮箱管理平台</h4>
            <p class="app-version">版本 {{ appVersion }}</p>
            <p class="app-desc">一个简洁高效的多账户邮箱管理工具</p>
          </div>
        </div>

        <div class="tech-stack">
          <el-tag>Vue 3</el-tag>
          <el-tag>TypeScript</el-tag>
          <el-tag>Element Plus</el-tag>
          <el-tag>Capacitor</el-tag>
          <el-tag>FastAPI</el-tag>
        </div>
      </div>

      <!-- 保存按钮 -->
      <div class="settings-actions">
        <el-button @click="resetSettings">恢复默认</el-button>
        <el-button type="primary" :loading="saving" @click="saveSettings">
          <el-icon><Check /></el-icon>
          保存设置
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Setting, Bell, Monitor, InfoFilled, Message, Check, Connection, Edit, FolderOpened, Delete, Upload, Refresh, Download, Document, CopyDocument } from '@element-plus/icons-vue'
import { getApiBaseUrl } from '@/api/request'
import { useEmailStore } from '@/stores'
import { checkForUpdate, getFixedDownloadUrls, type VersionInfo } from '@/api/version'

const router = useRouter()
const emailStore = useEmailStore()

// 应用版本号（从 package.json 获取）
const appVersion = __APP_VERSION__

// 当前服务器地址
const currentServerUrl = ref<string | null>(null)

// 清除缓存状态
const clearingCache = ref(false)

// 版本更新相关
const checkingUpdate = ref(false)
const updateInfo = ref<VersionInfo | null>(null)
const fixedDownloadUrls = getFixedDownloadUrls()

// 设置数据
interface Settings {
  autoRefresh: boolean
  refreshInterval: number
  pageSize: number
  notifications: boolean
  notificationSound: boolean
  theme: 'light' | 'dark' | 'auto'
  compactMode: boolean
  enableCache: boolean
}

const defaultSettings: Settings = {
  autoRefresh: true,
  refreshInterval: 5,
  pageSize: 20,
  notifications: true,
  notificationSound: true,
  theme: 'light',
  compactMode: false,
  enableCache: true
}

const settings = reactive<Settings>({ ...defaultSettings })
const saving = ref(false)

// 跳转到服务器配置页面
function goToServerConfig() {
  router.push('/server-config')
}

// 应用主题
function applyTheme(theme: 'light' | 'dark' | 'auto') {
  const html = document.documentElement
  
  if (theme === 'auto') {
    // 跟随系统主题
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    html.classList.toggle('dark', prefersDark)
  } else {
    html.classList.toggle('dark', theme === 'dark')
  }
}

// 应用紧凑模式
function applyCompactMode(compact: boolean) {
  const html = document.documentElement
  html.classList.toggle('compact-mode', compact)
}

// 监听主题变化
watch(() => settings.theme, (newTheme) => {
  applyTheme(newTheme)
})

// 监听紧凑模式变化
watch(() => settings.compactMode, (newCompact) => {
  applyCompactMode(newCompact)
})

// 方法
function loadSettings() {
  const saved = localStorage.getItem('emailAdminSettings')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      Object.assign(settings, parsed)
      // 注意：不在这里应用主题，因为 App.vue 已经在启动时初始化了主题
      // 只需要加载设置值到表单中即可
    } catch {
      console.error('加载设置失败')
    }
  }
}

function resetSettings() {
  Object.assign(settings, defaultSettings)
  applyTheme(defaultSettings.theme)
  applyCompactMode(defaultSettings.compactMode)
  ElMessage.info('已恢复默认设置')
}

async function saveSettings() {
  saving.value = true
  try {
    localStorage.setItem('emailAdminSettings', JSON.stringify(settings))
    // 触发自定义事件通知其他组件设置已更新
    window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: settings }))
    ElMessage.success('设置已保存')
  } catch {
    ElMessage.error('保存设置失败')
  } finally {
    saving.value = false
  }
}

// 监听系统主题变化
function setupSystemThemeListener() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    if (settings.theme === 'auto') {
      applyTheme('auto')
    }
  })
}

// 清除缓存
async function handleClearCache() {
  clearingCache.value = true
  try {
    await emailStore.clearCache()
    ElMessage.success('缓存已清除')
  } catch {
    ElMessage.error('清除缓存失败')
  } finally {
    clearingCache.value = false
  }
}

// 检查更新
async function handleCheckUpdate() {
  checkingUpdate.value = true
  updateInfo.value = null
  try {
    const result = await checkForUpdate(appVersion)
    updateInfo.value = result
    if (result.hasUpdate) {
      ElMessage.success(`发现新版本 v${result.latestVersion}`)
    } else {
      ElMessage.info('当前已是最新版本')
    }
  } catch (error) {
    console.error('检查更新失败:', error)
    ElMessage.error('检查更新失败，请稍后重试')
  } finally {
    checkingUpdate.value = false
  }
}

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 下载更新
function downloadUpdate(type: 'apk' | 'frontend') {
  if (!updateInfo.value) return
  
  const url = type === 'apk'
    ? updateInfo.value.downloadUrls.apk
    : updateInfo.value.downloadUrls.frontend
  
  if (url) {
    window.open(url, '_blank')
  }
}

// 查看更新日志
function viewReleaseNotes() {
  if (updateInfo.value?.releaseInfo?.html_url) {
    window.open(updateInfo.value.releaseInfo.html_url, '_blank')
  }
}

// 复制到剪贴板
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('已复制到剪贴板')
  }
}

// 生命周期
onMounted(() => {
  loadSettings()
  setupSystemThemeListener()
  // 获取当前服务器地址
  currentServerUrl.value = getApiBaseUrl()
})
</script>

<style scoped>
.settings-view {
  height: 100%;
  overflow-y: auto;
}

.settings-container {
  max-width: 700px;
  margin: 0 auto;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 25px 0;
}

.settings-section {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 20px 0;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 12px;
  color: #909399;
}

.server-url-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-url {
  font-size: 13px;
  color: #606266;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: #f4f4f5;
  padding: 6px 12px;
  border-radius: 4px;
}

.about-info {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 0;
}

.app-logo {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.app-details {
  flex: 1;
}

.app-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 5px 0;
}

.app-version {
  font-size: 13px;
  color: #909399;
  margin: 0 0 8px 0;
}

.app-desc {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 0;
}

/* 深色模式 */
html.dark .current-url {
  background-color: #374151;
  color: #d1d5db;
}

/* 版本更新样式 */
.update-info {
  margin: 15px 0;
}

.update-details p {
  margin: 5px 0;
  font-size: 13px;
  color: #606266;
}

.update-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.no-update {
  margin-top: 10px;
}

.download-links {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
  margin-top: 10px;
}

.download-link-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  flex-wrap: wrap;
}

.download-link-item:not(:last-child) {
  border-bottom: 1px solid #e4e7ed;
}

.link-label {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  min-width: 50px;
}

.download-link-item .el-link {
  flex: 1;
  font-size: 12px;
  word-break: break-all;
}

/* 深色模式 - 版本更新 */
html.dark .download-links {
  background-color: #374151;
}

html.dark .link-label {
  color: #d1d5db;
}

html.dark .update-details p {
  color: #d1d5db;
}

@media (max-width: 768px) {
  .settings-container {
    padding: 0 10px;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .server-url-display {
    width: 100%;
    justify-content: space-between;
  }
  
  .current-url {
    max-width: none;
    flex: 1;
  }
  
  .about-info {
    flex-direction: column;
    text-align: center;
  }
  
  .settings-actions {
    flex-direction: column;
  }
  
  .settings-actions .el-button {
    width: 100%;
  }
  
  .update-actions {
    flex-direction: column;
  }
  
  .update-actions .el-button {
    width: 100%;
  }
  
  .download-link-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .download-link-item .el-link {
    width: 100%;
  }
}
</style>
