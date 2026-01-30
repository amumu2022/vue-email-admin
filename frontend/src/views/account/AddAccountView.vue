<template>
  <div class="add-account-view">
    <div class="form-container card">
      <div class="form-header">
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="form-title">添加邮箱账户</h2>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        label-position="top"
        class="account-form"
      >
        <!-- 基本信息 -->
        <div class="form-section">
          <h3 class="section-title">基本信息</h3>
          
          <el-form-item label="账户名称" prop="name">
            <el-input v-model="formData.name" placeholder="例如：工作邮箱" />
          </el-form-item>

          <el-form-item label="邮箱地址" prop="email">
            <el-input
              v-model="formData.email"
              placeholder="example@gmail.com"
              @blur="handleEmailBlur"
            />
          </el-form-item>

          <el-form-item label="邮箱提供商" prop="provider">
            <el-select v-model="formData.provider" placeholder="选择提供商" @change="handleProviderChange">
              <el-option
                v-for="option in providerOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="密码/授权码" prop="password">
            <el-input
              v-model="formData.password"
              type="password"
              placeholder="输入密码或授权码"
              show-password
            />
            <div class="form-tip">
              <el-icon><InfoFilled /></el-icon>
              <span>部分邮箱（如QQ、163）需要使用授权码而非登录密码</span>
            </div>
          </el-form-item>
        </div>

        <!-- 服务器设置 -->
        <div class="form-section">
          <h3 class="section-title">
            服务器设置
            <el-tag v-if="formData.provider !== 'custom'" type="info" size="small">
              已自动填充
            </el-tag>
          </h3>

          <el-row :gutter="20">
            <el-col :span="16">
              <el-form-item label="IMAP 服务器" prop="imapHost">
                <el-input
                  v-model="formData.imapHost"
                  placeholder="imap.example.com"
                  :disabled="formData.provider !== 'custom'"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="端口" prop="imapPort">
                <el-input-number
                  v-model="formData.imapPort"
                  :min="1"
                  :max="65535"
                  :disabled="formData.provider !== 'custom'"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="16">
              <el-form-item label="SMTP 服务器" prop="smtpHost">
                <el-input
                  v-model="formData.smtpHost"
                  placeholder="smtp.example.com"
                  :disabled="formData.provider !== 'custom'"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="端口" prop="smtpPort">
                <el-input-number
                  v-model="formData.smtpPort"
                  :min="1"
                  :max="65535"
                  :disabled="formData.provider !== 'custom'"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="安全连接" prop="useSSL">
            <el-switch
              v-model="formData.useSSL"
              active-text="使用 SSL/TLS"
              inactive-text="不使用"
              :disabled="formData.provider !== 'custom'"
            />
          </el-form-item>
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <el-button @click="goBack">取消</el-button>
          <el-button :loading="testing" @click="handleTestConnection">
            <el-icon><Connection /></el-icon>
            测试连接
          </el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            <el-icon><Check /></el-icon>
            保存账户
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { ArrowLeft, InfoFilled, Connection, Check } from '@element-plus/icons-vue'
import { useAccountStore } from '@/stores'
import { providerOptions, getProviderConfig, detectProvider } from '@/utils/email'
import type { AccountFormData, EmailProvider } from '@/types'

const router = useRouter()
const accountStore = useAccountStore()

// 表单引用
const formRef = ref<FormInstance>()

// 状态
const testing = ref(false)
const submitting = ref(false)

// 表单数据
const formData = reactive<AccountFormData>({
  name: '',
  email: '',
  provider: 'gmail',
  password: '',
  imapHost: 'imap.gmail.com',
  imapPort: 993,
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  useSSL: true
})

// 表单验证规则
const rules: FormRules<AccountFormData> = {
  name: [
    { required: true, message: '请输入账户名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  provider: [
    { required: true, message: '请选择邮箱提供商', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码或授权码', trigger: 'blur' }
  ],
  imapHost: [
    { required: true, message: '请输入 IMAP 服务器地址', trigger: 'blur' }
  ],
  imapPort: [
    { required: true, message: '请输入 IMAP 端口', trigger: 'blur' }
  ],
  smtpHost: [
    { required: true, message: '请输入 SMTP 服务器地址', trigger: 'blur' }
  ],
  smtpPort: [
    { required: true, message: '请输入 SMTP 端口', trigger: 'blur' }
  ]
}

// 方法
function goBack() {
  router.push('/accounts')
}

function handleEmailBlur() {
  if (formData.email) {
    const detectedProvider = detectProvider(formData.email)
    if (detectedProvider !== 'custom' && formData.provider === 'custom') {
      formData.provider = detectedProvider
      handleProviderChange(detectedProvider)
    }
  }
}

function handleProviderChange(provider: EmailProvider) {
  const config = getProviderConfig(provider)
  formData.imapHost = config.imapHost
  formData.imapPort = config.imapPort
  formData.smtpHost = config.smtpHost
  formData.smtpPort = config.smtpPort
  formData.useSSL = config.useSSL
}

async function handleTestConnection() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    testing.value = true
    
    const result = await accountStore.testConnection(formData)
    if (result?.success) {
      ElMessage.success('连接测试成功！')
    } else {
      ElMessage.error(result?.message || '连接测试失败')
    }
  } catch (err) {
    if (err !== false) {
      ElMessage.error('连接测试失败，请检查配置')
    }
  } finally {
    testing.value = false
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    await accountStore.addAccount(formData)
    ElMessage.success('账户添加成功！')
    router.push('/accounts')
  } catch (err) {
    if (err !== false) {
      ElMessage.error('添加账户失败')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.add-account-view {
  max-width: 700px;
  margin: 0 auto;
}

.form-container {
  padding: 30px;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.form-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.form-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.account-form :deep(.el-form-item__label) {
  font-weight: 500;
}

.account-form :deep(.el-select) {
  width: 100%;
}

.account-form :deep(.el-input-number) {
  width: 100%;
}

.form-tip {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

@media (max-width: 768px) {
  .form-container {
    padding: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .el-button {
    width: 100%;
  }
}
</style>
