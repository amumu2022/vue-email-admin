<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <el-icon class="logo-icon"><Message /></el-icon>
        <h1>邮箱管理平台</h1>
        <p>请登录您的账户</p>
      </div>
      
      <!-- 当前服务器地址显示 -->
      <div v-if="currentServerUrl" class="server-info">
        <span class="server-label">服务器:</span>
        <span class="server-url">{{ currentServerUrl }}</span>
        <el-button type="primary" link size="small" @click="goToServerConfig">
          <el-icon><Edit /></el-icon>
          修改
        </el-button>
      </div>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <el-button link type="primary" @click="handleInitAdmin">
          初始化管理员账户
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Message, User, Lock, Edit } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores'
import { initAdmin } from '@/api/auth'
import { getApiBaseUrl } from '@/api/request'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const currentServerUrl = ref<string | null>(null)

const form = reactive({
  username: '',
  password: ''
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

function goToServerConfig() {
  router.push('/server-config')
}

async function handleLogin() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      const success = await authStore.loginAction({
        username: form.username,
        password: form.password
      })
      
      if (success) {
        router.push('/')
      }
    } finally {
      loading.value = false
    }
  })
}

async function handleInitAdmin() {
  try {
    const res = await initAdmin()
    if (res.success) {
      ElMessage.success(res.message || '管理员账户创建成功')
      form.username = 'admin'
      form.password = 'admin123'
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.detail || '初始化失败')
  }
}

onMounted(() => {
  // 获取当前配置的服务器地址
  currentServerUrl.value = getApiBaseUrl()
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  /* 移动端安全区域 */
  padding-top: max(20px, env(safe-area-inset-top));
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.logo-icon {
  font-size: 48px;
  color: #667eea;
  margin-bottom: 16px;
}

.login-header h1 {
  font-size: 24px;
  color: #303133;
  margin: 0 0 8px 0;
}

.login-header p {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.server-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #f4f4f5;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 13px;
}

.server-label {
  color: #909399;
}

.server-url {
  color: #606266;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.login-form {
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
}

.login-footer {
  text-align: center;
}

/* 深色模式 */
html.dark .login-card {
  background-color: #1f2937;
}

html.dark .login-header h1 {
  color: #e4e4e7;
}

html.dark .login-header p {
  color: #9ca3af;
}

html.dark .server-info {
  background-color: #374151;
}

html.dark .server-label {
  color: #9ca3af;
}

html.dark .server-url {
  color: #d1d5db;
}

/* 响应式 */
@media (max-width: 480px) {
  .login-card {
    padding: 24px;
  }
  
  .login-header h1 {
    font-size: 20px;
  }
  
  .server-info {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .server-url {
    max-width: 100%;
  }
}
</style>
