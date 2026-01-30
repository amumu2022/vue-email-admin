<template>
  <div class="user-management-view">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
      <el-button type="primary" @click="showAddUserDialog">
        <el-icon><Plus /></el-icon>
        添加用户
      </el-button>
    </div>

    <!-- 用户列表 -->
    <div class="card">
      <el-table :data="users" v-loading="loading" style="width: 100%">
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180">
          <template #default="{ row }">
            {{ row.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="isAdmin" label="角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isAdmin ? 'danger' : 'info'" size="small">
              {{ row.isAdmin ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'warning'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLogin" label="最后登录" min-width="160" align="center">
          <template #default="{ row }">
            {{ row.lastLogin ? formatDate(row.lastLogin) : '从未登录' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="160" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-tooltip content="编辑" placement="top">
                <el-button 
                  :icon="Edit" 
                  circle 
                  size="small"
                  @click="showEditUserDialog(row)"
                />
              </el-tooltip>
              <el-tooltip content="重置密码" placement="top">
                <el-button 
                  :icon="Key" 
                  circle 
                  size="small"
                  type="warning" 
                  @click="showResetPasswordDialog(row)"
                />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button 
                  :icon="Delete" 
                  circle 
                  size="small"
                  type="danger" 
                  @click="handleDeleteUser(row)"
                  :disabled="row.id === currentUser?.id"
                />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog
      v-model="userDialogVisible"
      :title="isEditing ? '编辑用户' : '添加用户'"
      width="500px"
      @close="resetUserForm"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item v-if="!isEditing" label="密码" prop="password">
          <el-input
            v-model="userForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱（可选）" />
        </el-form-item>
        <el-form-item label="角色">
          <el-switch
            v-model="userForm.isAdmin"
            active-text="管理员"
            inactive-text="普通用户"
            :disabled="isEditing && userForm.id === currentUser?.id"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="userForm.isActive"
            active-text="启用"
            inactive-text="禁用"
            :disabled="isEditing && userForm.id === currentUser?.id"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmitUser">
          {{ isEditing ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPasswordDialogVisible"
      title="重置密码"
      width="400px"
      @close="resetPasswordForm"
    >
      <el-form
        ref="resetPasswordFormRef"
        :model="resetPasswordData"
        :rules="resetPasswordRules"
        label-width="80px"
      >
        <el-form-item label="用户">
          <el-input :value="selectedUser?.username" disabled />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="resetPasswordData.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="resetPasswordData.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPasswordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleResetPassword">
          确认重置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Edit, Key, Delete } from '@element-plus/icons-vue'
import * as authApi from '@/api/auth'
import type { UserInfo } from '@/api/auth'

// 状态
const loading = ref(false)
const submitting = ref(false)
const users = ref<UserInfo[]>([])
const userDialogVisible = ref(false)
const resetPasswordDialogVisible = ref(false)
const isEditing = ref(false)
const selectedUser = ref<UserInfo | null>(null)

// 当前登录用户
const currentUser = computed(() => {
  const userStr = localStorage.getItem('email_admin_user')
  if (userStr) {
    try {
      return JSON.parse(userStr) as UserInfo
    } catch {
      return null
    }
  }
  return null
})

// 表单引用
const userFormRef = ref<FormInstance>()
const resetPasswordFormRef = ref<FormInstance>()

// 用户表单
const userForm = reactive({
  id: '',
  username: '',
  password: '',
  email: '',
  isAdmin: false,
  isActive: true
})

// 重置密码表单
const resetPasswordData = reactive({
  newPassword: '',
  confirmPassword: ''
})

// 表单验证规则
const userFormRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度为 3-50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ]
}

const resetPasswordRules: FormRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== resetPasswordData.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 格式化日期
function formatDate(dateStr: string): string {
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

// 加载用户列表
async function loadUsers() {
  loading.value = true
  try {
    const res = await authApi.getUsers()
    if (res.success) {
      users.value = res.data
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.detail || '加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 显示添加用户对话框
function showAddUserDialog() {
  isEditing.value = false
  resetUserForm()
  userDialogVisible.value = true
}

// 显示编辑用户对话框
function showEditUserDialog(user: UserInfo) {
  isEditing.value = true
  userForm.id = user.id
  userForm.username = user.username
  userForm.email = user.email || ''
  userForm.isAdmin = user.isAdmin
  userForm.isActive = user.isActive ?? true
  userForm.password = ''
  userDialogVisible.value = true
}

// 显示重置密码对话框
function showResetPasswordDialog(user: UserInfo) {
  selectedUser.value = user
  resetPasswordData.newPassword = ''
  resetPasswordData.confirmPassword = ''
  resetPasswordDialogVisible.value = true
}

// 重置用户表单
function resetUserForm() {
  userForm.id = ''
  userForm.username = ''
  userForm.password = ''
  userForm.email = ''
  userForm.isAdmin = false
  userForm.isActive = true
  userFormRef.value?.clearValidate()
}

// 重置密码表单
function resetPasswordForm() {
  resetPasswordData.newPassword = ''
  resetPasswordData.confirmPassword = ''
  selectedUser.value = null
  resetPasswordFormRef.value?.clearValidate()
}

// 提交用户表单
async function handleSubmitUser() {
  if (!userFormRef.value) return
  
  await userFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      if (isEditing.value) {
        // 编辑用户
        await authApi.updateUser(userForm.id, {
          username: userForm.username,
          email: userForm.email || undefined,
          isAdmin: userForm.isAdmin,
          isActive: userForm.isActive
        })
        ElMessage.success('用户信息更新成功')
      } else {
        // 添加用户
        await authApi.register({
          username: userForm.username,
          password: userForm.password,
          email: userForm.email || undefined
        })
        ElMessage.success('用户添加成功')
      }
      userDialogVisible.value = false
      loadUsers()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.detail || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 重置密码
async function handleResetPassword() {
  if (!resetPasswordFormRef.value || !selectedUser.value) return
  
  await resetPasswordFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      await authApi.resetUserPassword({
        userId: selectedUser.value!.id,
        newPassword: resetPasswordData.newPassword
      })
      ElMessage.success(`用户 ${selectedUser.value!.username} 的密码已重置`)
      resetPasswordDialogVisible.value = false
    } catch (error: any) {
      ElMessage.error(error.response?.data?.detail || '重置密码失败')
    } finally {
      submitting.value = false
    }
  })
}

// 删除用户
async function handleDeleteUser(user: UserInfo) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    )
    
    await authApi.deleteUser(user.id)
    ElMessage.success(`用户 ${user.username} 已删除`)
    loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.detail || '删除用户失败')
    }
  }
}

// 生命周期
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  overflow-x: auto;
}

.action-buttons {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  justify-content: center;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .page-header .el-button {
    width: 100%;
  }
}
</style>
