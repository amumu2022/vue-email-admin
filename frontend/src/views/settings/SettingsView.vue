<template>
  <div class="settings-view">
    <div class="settings-container">
      <h2 class="page-title">设置</h2>

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
            <p class="app-version">版本 1.0.0</p>
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
import { ElMessage } from 'element-plus'
import { Setting, Bell, Monitor, InfoFilled, Message, Check } from '@element-plus/icons-vue'

// 设置数据
interface Settings {
  autoRefresh: boolean
  refreshInterval: number
  pageSize: number
  notifications: boolean
  notificationSound: boolean
  theme: 'light' | 'dark' | 'auto'
  compactMode: boolean
}

const defaultSettings: Settings = {
  autoRefresh: true,
  refreshInterval: 5,
  pageSize: 20,
  notifications: true,
  notificationSound: true,
  theme: 'light',
  compactMode: false
}

const settings = reactive<Settings>({ ...defaultSettings })
const saving = ref(false)

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

// 生命周期
onMounted(() => {
  loadSettings()
  setupSystemThemeListener()
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

@media (max-width: 768px) {
  .settings-container {
    padding: 0 10px;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
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
}
</style>
