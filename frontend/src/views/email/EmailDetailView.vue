<template>
  <div class="email-detail-view">
    <div v-if="loading" class="loading-state">
      <el-skeleton :loading="true" animated>
        <template #template>
          <div class="card">
            <el-skeleton-item variant="h1" style="width: 60%" />
            <el-skeleton-item variant="text" style="width: 40%; margin-top: 20px" />
            <el-skeleton-item variant="text" style="width: 30%; margin-top: 10px" />
            <div style="margin-top: 30px">
              <el-skeleton-item variant="text" style="width: 100%" />
              <el-skeleton-item variant="text" style="width: 100%; margin-top: 10px" />
              <el-skeleton-item variant="text" style="width: 80%; margin-top: 10px" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <div v-else-if="email" class="email-content">
      <!-- 工具栏 -->
      <div class="toolbar card">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <div class="toolbar-actions">
          <el-button @click="toggleRead">
            <el-icon><component :is="email.isRead ? Hide : View" /></el-icon>
            {{ email.isRead ? '标记未读' : '标记已读' }}
          </el-button>
          <el-button :type="email.isStarred ? 'warning' : 'default'" @click="toggleStar">
            <el-icon><Star /></el-icon>
            {{ email.isStarred ? '取消星标' : '添加星标' }}
          </el-button>
          <el-button type="danger" @click="handleDelete">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </div>

      <!-- 邮件头部 -->
      <div class="email-header card">
        <h1 class="email-subject">{{ email.subject || '(无主题)' }}</h1>
        
        <div class="email-meta">
          <div class="sender-info">
            <div class="sender-avatar" :style="{ backgroundColor: getAvatarColor(email.from.address) }">
              {{ getAvatarText(email.from) }}
            </div>
            <div class="sender-details">
              <div class="sender-name">
                {{ email.from.name || email.from.address }}
                <span v-if="email.from.name" class="sender-email">&lt;{{ email.from.address }}&gt;</span>
              </div>
              <div class="email-recipients">
                <span>收件人: </span>
                <span v-for="(to, index) in email.to" :key="index">
                  {{ to.name || to.address }}{{ index < email.to.length - 1 ? ', ' : '' }}
                </span>
              </div>
              <div v-if="email.cc && email.cc.length > 0" class="email-recipients">
                <span>抄送: </span>
                <span v-for="(cc, index) in email.cc" :key="index">
                  {{ cc.name || cc.address }}{{ index < email.cc.length - 1 ? ', ' : '' }}
                </span>
              </div>
            </div>
          </div>
          <div class="email-date">
            {{ formatDate(email.date, 'full') }}
          </div>
        </div>
      </div>

      <!-- 附件 -->
      <div v-if="email.hasAttachments && email.attachments && email.attachments.length > 0" class="attachments card">
        <h3 class="attachments-title">
          <el-icon><Paperclip /></el-icon>
          附件 ({{ email.attachments.length }})
        </h3>
        <div class="attachment-list">
          <div
            v-for="attachment in email.attachments"
            :key="attachment.id"
            class="attachment-item"
            @click="downloadAttachment(attachment)"
          >
            <el-icon class="attachment-icon"><Document /></el-icon>
            <div class="attachment-info">
              <div class="attachment-name">{{ attachment.filename }}</div>
              <div class="attachment-size">{{ formatFileSize(attachment.size) }}</div>
            </div>
            <el-icon class="download-icon"><Download /></el-icon>
          </div>
        </div>
      </div>

      <!-- 邮件正文 -->
      <div class="email-body card">
        <!-- 查看模式切换 -->
        <div v-if="email.bodyHtml" class="view-mode-switch">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button value="html">HTML 视图</el-radio-button>
            <el-radio-button value="text">纯文本</el-radio-button>
            <el-radio-button value="source">HTML 源码</el-radio-button>
          </el-radio-group>
          <el-button
            v-if="viewMode === 'source'"
            size="small"
            type="primary"
            @click="copyHtmlSource"
            class="copy-btn"
          >
            <el-icon><CopyDocument /></el-icon>
            复制源码
          </el-button>
        </div>
        <div v-if="viewMode === 'html' && email.bodyHtml" class="body-html" v-html="sanitizedHtml"></div>
        <div v-else-if="viewMode === 'source' && email.bodyHtml" class="body-source">
          <pre><code>{{ email.bodyHtml }}</code></pre>
        </div>
        <div v-else class="body-text">{{ email.body || '(无内容)' }}</div>
      </div>
    </div>

    <div v-else class="empty-state card">
      <el-empty description="邮件不存在或已被删除">
        <el-button type="primary" @click="goBack">返回收件箱</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, View, Hide, Star, Delete, Paperclip, Document, Download, CopyDocument } from '@element-plus/icons-vue'
import { useEmailStore } from '@/stores'
import { formatDate, formatFileSize } from '@/utils/email'
import type { EmailAddress, Attachment } from '@/types'
import * as emailApi from '@/api/email'

const router = useRouter()
const route = useRoute()
const emailStore = useEmailStore()

// 查看模式：html、text 或 source
const viewMode = ref<'html' | 'text' | 'source'>('html')

// 计算属性
const email = computed(() => emailStore.currentEmail)
const loading = computed(() => emailStore.loading)

const sanitizedHtml = computed(() => {
  if (!email.value?.bodyHtml) return ''
  
  let html = email.value.bodyHtml
  
  // 替换 CID 图片引用为 base64 数据
  if (email.value.inlineImages) {
    const inlineImages = email.value.inlineImages
    // 匹配 src="cid:xxx" 或 src='cid:xxx' 格式
    html = html.replace(/src=["']cid:([^"']+)["']/gi, (match, cid) => {
      const imageData = inlineImages[cid]
      if (imageData) {
        return `src="data:${imageData.content_type};base64,${imageData.data}"`
      }
      return match // 如果找不到对应的图片数据，保持原样
    })
  }
  
  // 简单的 HTML 清理，实际项目中应使用 DOMPurify 等库
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
})

// 方法
function goBack() {
  router.push('/inbox')
}

function getAvatarText(from: EmailAddress): string {
  if (from.name) {
    return from.name.charAt(0).toUpperCase()
  }
  return from.address.charAt(0).toUpperCase()
}

function getAvatarColor(emailAddr: string): string {
  const colors = ['#f56c6c', '#e6a23c', '#67c23a', '#409eff', '#909399', '#9c27b0']
  const index = emailAddr.charCodeAt(0) % colors.length
  return colors[index] ?? '#909399'
}

async function toggleRead() {
  if (!email.value) return
  try {
    await emailStore.markAsRead(email.value.id, !email.value.isRead)
    ElMessage.success(email.value.isRead ? '已标记为未读' : '已标记为已读')
  } catch {
    ElMessage.error('操作失败')
  }
}

async function toggleStar() {
  if (!email.value) return
  try {
    await emailStore.markAsStarred(email.value.id, !email.value.isStarred)
    ElMessage.success(email.value.isStarred ? '已取消星标' : '已添加星标')
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleDelete() {
  if (!email.value) return
  try {
    await ElMessageBox.confirm('确定要删除这封邮件吗？', '确认删除', {
      type: 'warning'
    })
    await emailStore.deleteEmail(email.value.id)
    ElMessage.success('删除成功')
    goBack()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

async function downloadAttachment(attachment: Attachment) {
  if (!email.value) return
  try {
    const blob = await emailApi.downloadAttachment(email.value.id, attachment.id)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = attachment.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch {
    ElMessage.error('下载附件失败')
  }
}

async function copyHtmlSource() {
  if (!email.value?.bodyHtml) return
  try {
    await navigator.clipboard.writeText(email.value.bodyHtml)
    ElMessage.success('HTML 源码已复制到剪贴板')
  } catch {
    // 降级方案：使用传统方式复制
    const textarea = document.createElement('textarea')
    textarea.value = email.value.bodyHtml
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('HTML 源码已复制到剪贴板')
  }
}

// 生命周期
onMounted(async () => {
  const emailId = route.params.id as string
  if (emailId) {
    await emailStore.fetchEmailDetail(emailId)
  }
})
</script>

<style scoped>
.email-detail-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.email-header {
  padding: 25px;
}

.email-subject {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.email-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 15px;
}

.sender-info {
  display: flex;
  gap: 15px;
}

.sender-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: 500;
  flex-shrink: 0;
}

.sender-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.sender-name {
  font-weight: 500;
  color: #303133;
  font-size: 15px;
}

.sender-email {
  color: #909399;
  font-weight: normal;
  font-size: 13px;
}

.email-recipients {
  font-size: 13px;
  color: #606266;
}

.email-date {
  font-size: 13px;
  color: #909399;
  white-space: nowrap;
}

.attachments {
  padding: 20px;
}

.attachments-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 15px 0;
}

.attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.attachment-item:hover {
  background-color: #e6e8eb;
}

.attachment-icon {
  font-size: 24px;
  color: #409eff;
}

.attachment-info {
  flex: 1;
}

.attachment-name {
  font-size: 13px;
  color: #303133;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-size {
  font-size: 12px;
  color: #909399;
}

.download-icon {
  font-size: 18px;
  color: #909399;
}

.email-body {
  padding: 25px;
  min-height: 200px;
}

.view-mode-switch {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.copy-btn {
  margin-left: auto;
}

.body-html {
  line-height: 1.6;
  color: #303133;
}

.body-html :deep(img) {
  max-width: 100%;
  height: auto;
}

.body-html :deep(a) {
  color: #409eff;
}

.body-text {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #303133;
}

.body-source {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
  overflow-x: auto;
}

.body-source pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.body-source code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #303133;
}

.empty-state {
  padding: 60px 20px;
}

.loading-state .card {
  padding: 25px;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .toolbar-actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    width: 100%;
  }
  
  .toolbar-actions .el-button {
    margin: 0;
    padding: 8px 0;
    font-size: 12px;
  }
  
  .toolbar-actions .el-button .el-icon {
    margin-right: 4px;
  }
  
  .email-meta {
    flex-direction: column;
  }
  
  .email-date {
    margin-left: 63px;
  }
  
  .view-mode-switch {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .copy-btn {
    margin-left: 0;
    margin-top: 10px;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .toolbar-actions {
    grid-template-columns: 1fr;
  }
  
  .toolbar-actions .el-button {
    justify-content: center;
  }
  
  .email-subject {
    font-size: 18px;
  }
  
  .sender-avatar {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  
  .email-date {
    margin-left: 55px;
  }
}
</style>
