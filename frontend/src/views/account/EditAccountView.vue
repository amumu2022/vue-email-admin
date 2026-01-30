<template>
  <div class="edit-account-view">
    <div class="form-container card">
      <div class="form-header">
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="form-title">编辑邮箱账户</h2>
      </div>

      <el-skeleton :loading="loading" animated>
        <template #template>
          <div style="padding: 20px">
            <el-skeleton-item variant="text" style="width: 30%; margin-bottom: 20px" />
            <el-skeleton-item variant="rect" style="width: 100%; height: 40px; margin-bottom: 20px" />
            <el-skeleton-item variant="text" style="width: 30%; margin-bottom: 20px" />
            <el-skeleton-item variant="rect" style="width: 100%; height: 40px; margin-bottom: 20px" />
          </div>
        </template>
        <template #default>
          <el-form
            v-if="account"
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
                <el-input v-model="formData.email" placeholder="example@gmail.com" disabled />
                <div class="form-tip">
                  <el-icon><InfoFilled /></el-icon>
                  <span>邮箱地址不可修改</span>
                </div>
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
                  placeholder="输入新密码或留空保持不变"
                  show-password
                />
                <div class="form-tip">
                  <el-icon><InfoFilled /></el-icon>
                  <span>留空则保持原密码不变</span>
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
                保存修改
              </el-button>
            </div>
          </el-form>

          <div v-else class="empty-state">
            <el-empty description="账户不存在">
              <el-button type="primary" @click="goBack">返回账户列表</el-button>
            </el-empty>
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { ArrowLeft, InfoFilled, Connection, Check } from '@element-plus/icons-vue'
import { useAccountStore } from '@/stores'
import { providerOptions, getProviderConfig } from '@/utils/email'
import type { AccountFormData, EmailProvider } from '@/types'

const router = useRouter()
const route = useRoute()
const accountStore = useAccountStore()

// 表单引用
const formRef = ref<FormInstance>()

// 状态
const loading = ref(true)
const testing = ref(false)
const submitting = ref(false)

// 获取账户ID
const accountId = computed(() => route.params.id as string)

// 获取账户信息
const account = computed(() => accountStore.getAccountById(accountId.value))

// 表单数据
const formData = reactive<AccountFormData>({
  name: '',
  email: '',
  provider: 'custom',
  password: '',
  imapHost: '',
  imapPort: 993,
  smtpHost: '',
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

function handleProviderChange(provider: EmailProvider) {
  const config = getProviderConfig(provider)
  formData.imapHost = config.imapHost
  formData.imapPort = config.imapPort
  formData.smtpHost = config.smtpHost
  formData.smtpPort = config.smtpPort
  formData.useSSL = config.useSSL
}

function loadAccountData() {
  if (account.value) {
    formData.name = account.value.name
    formData.email = account.value.email
    formData.provider = account.value.provider
    formData.password = '' // 密码不回显
    formData.imapHost = account.value.imapHost
    formData.imapPort = account.value.imapPort
    formData.smtpHost = account.value.smtpHost
    formData.smtpPort = account.value.smtpPort
    formData.useSSL = account.value.useSSL
  }
}

async function handleTestConnection() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    testing.value = true
    
    // 如果密码为空，使用原密码进行测试
    const testData = { ...formData }
    if (!testData.password && account.value) {
      testData.password = account.value.password
    }
    
    const result = await accountStore.testConnection(testData)
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
    
    // 构建更新数据，如果密码为空则不更新密码
    const updateData: Partial<AccountFormData> = {
      name: formData.name,
      provider: formData.provider,
      imapHost: formData.imapHost,
      imapPort: formData.imapPort,
      smtpHost: formData.smtpHost,
      smtpPort: formData.smtpPort,
      useSSL: formData.useSSL
    }
    
    if (formData.password) {
      updateData.password = formData.password
    }
    
    await accountStore.updateAccount(accountId.value, updateData)
    ElMessage.success('账户更新成功！')
    router.push('/accounts')
  } catch (err) {
    if (err !== false) {
      ElMessage.error('更新账户失败')
    }
  } finally {
    submitting.value = false
  }
}

// 生命周期
onMounted(async () => {
  loading.value = true
  
  // 如果 store 中没有账户数据，先获取
  if (accountStore.accounts.length === 0) {
    await accountStore.fetchAccounts()
  }
  
  loadAccountData()
  loading.value = false
})
</script>

<style scoped>
.edit-account-view {
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

.empty-state {
  padding: 60px 20px;
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
