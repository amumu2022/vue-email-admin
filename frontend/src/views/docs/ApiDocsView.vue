<template>
  <div class="api-docs-container">
    <el-card class="docs-card">
      <template #header>
        <div class="card-header">
          <span>开放 API 文档</span>
          <el-tag type="success">v1.0</el-tag>
        </div>
      </template>

      <!-- 概述 -->
      <section class="docs-section">
        <h2>概述</h2>
        <p>邮箱管理平台提供开放 API，允许第三方应用程序通过 API 令牌访问邮箱数据。所有 API 请求都需要进行身份验证。</p>
        
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            <strong>Base URL:</strong> <code>{{ baseUrl }}/api/open</code>
          </template>
        </el-alert>
      </section>

      <!-- 认证方式 -->
      <section class="docs-section">
        <h2>认证方式</h2>
        <p>API 支持两种认证方式：</p>
        
        <el-tabs v-model="authTab">
          <el-tab-pane label="Header 认证" name="header">
            <div class="code-block">
              <div class="code-header">
                <span>HTTP Header</span>
                <el-button size="small" @click="copyCode('Authorization: Bearer <your_token>')">
                  <el-icon><DocumentCopy /></el-icon>
                  复制
                </el-button>
              </div>
              <pre><code>Authorization: Bearer &lt;your_token&gt;</code></pre>
            </div>
          </el-tab-pane>
          <el-tab-pane label="Query 参数" name="query">
            <div class="code-block">
              <div class="code-header">
                <span>URL Query Parameter</span>
                <el-button size="small" @click="copyCode('?token=<your_token>')">
                  <el-icon><DocumentCopy /></el-icon>
                  复制
                </el-button>
              </div>
              <pre><code>?token=&lt;your_token&gt;</code></pre>
            </div>
          </el-tab-pane>
        </el-tabs>

        <el-alert type="warning" :closable="false" show-icon style="margin-top: 15px;">
          <template #title>
            推荐使用 Header 认证方式，更加安全。Query 参数方式可能会在日志中暴露令牌。
          </template>
        </el-alert>
      </section>

      <!-- API 端点 -->
      <section class="docs-section">
        <h2>API 端点</h2>

        <!-- 获取邮箱列表 -->
        <div class="api-endpoint">
          <div class="endpoint-header">
            <el-tag type="success" size="large">GET</el-tag>
            <code class="endpoint-path">/api/v1/open/accounts</code>
          </div>
          <p class="endpoint-desc">获取已添加的邮箱账户列表（不包含密码等敏感信息）</p>
          
          <h4>请求示例</h4>
          <div class="code-block">
            <div class="code-header">
              <span>cURL</span>
              <el-button size="small" @click="copyCode(curlAccountsExample)">
                <el-icon><DocumentCopy /></el-icon>
                复制
              </el-button>
            </div>
            <pre><code>{{ curlAccountsExample }}</code></pre>
          </div>

          <h4>响应示例</h4>
          <div class="code-block">
            <div class="code-header">
              <span>JSON</span>
            </div>
            <pre><code>{{ accountsResponse }}</code></pre>
          </div>
        </div>

        <!-- 获取指定邮箱的邮件列表 -->
        <div class="api-endpoint">
          <div class="endpoint-header">
            <el-tag type="success" size="large">GET</el-tag>
            <code class="endpoint-path">/api/v1/open/accounts/{email_address}/emails</code>
          </div>
          <p class="endpoint-desc">获取指定邮箱的邮件列表，包含邮件内容（不包含内嵌图片）</p>
          
          <h4>路径参数</h4>
          <el-table :data="emailsByAccountParams" border style="width: 100%">
            <el-table-column prop="name" label="参数名" width="150" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="required" label="必填" width="80">
              <template #default="{ row }">
                <el-tag :type="row.required ? 'danger' : 'info'" size="small">
                  {{ row.required ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
          </el-table>

          <h4>查询参数</h4>
          <el-table :data="paginationParams" border style="width: 100%">
            <el-table-column prop="name" label="参数名" width="150" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="default" label="默认值" width="100" />
            <el-table-column prop="description" label="描述" />
          </el-table>

          <h4>请求示例</h4>
          <div class="code-block">
            <div class="code-header">
              <span>cURL</span>
              <el-button size="small" @click="copyCode(curlEmailsByAccountExample)">
                <el-icon><DocumentCopy /></el-icon>
                复制
              </el-button>
            </div>
            <pre><code>{{ curlEmailsByAccountExample }}</code></pre>
          </div>

          <h4>响应示例</h4>
          <div class="code-block">
            <div class="code-header">
              <span>JSON</span>
            </div>
            <pre><code>{{ emailsByAccountResponse }}</code></pre>
          </div>
        </div>

        <!-- 获取全部邮件列表 -->
        <div class="api-endpoint">
          <div class="endpoint-header">
            <el-tag type="success" size="large">GET</el-tag>
            <code class="endpoint-path">/api/v1/open/emails</code>
          </div>
          <p class="endpoint-desc">获取所有邮箱账户的邮件列表，包含邮件内容（不包含内嵌图片）</p>
          
          <h4>查询参数</h4>
          <el-table :data="paginationParams" border style="width: 100%">
            <el-table-column prop="name" label="参数名" width="150" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="default" label="默认值" width="100" />
            <el-table-column prop="description" label="描述" />
          </el-table>

          <h4>请求示例</h4>
          <div class="code-block">
            <div class="code-header">
              <span>cURL</span>
              <el-button size="small" @click="copyCode(curlAllEmailsExample)">
                <el-icon><DocumentCopy /></el-icon>
                复制
              </el-button>
            </div>
            <pre><code>{{ curlAllEmailsExample }}</code></pre>
          </div>

          <h4>响应示例</h4>
          <div class="code-block">
            <div class="code-header">
              <span>JSON</span>
            </div>
            <pre><code>{{ allEmailsResponse }}</code></pre>
          </div>
        </div>

        <!-- 获取单封邮件详情 -->
        <div class="api-endpoint">
          <div class="endpoint-header">
            <el-tag type="success" size="large">GET</el-tag>
            <code class="endpoint-path">/api/v1/open/emails?email_id={email_id}</code>
          </div>
          <p class="endpoint-desc">根据邮件 ID 获取单封邮件的详细信息</p>
          
          <h4>路径参数</h4>
          <el-table :data="emailDetailParams" border style="width: 100%">
            <el-table-column prop="name" label="参数名" width="150" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="required" label="必填" width="80">
              <template #default="{ row }">
                <el-tag :type="row.required ? 'danger' : 'info'" size="small">
                  {{ row.required ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
          </el-table>

          <h4>请求示例</h4>
          <div class="code-block">
            <div class="code-header">
              <span>cURL</span>
              <el-button size="small" @click="copyCode(curlEmailDetailExample)">
                <el-icon><DocumentCopy /></el-icon>
                复制
              </el-button>
            </div>
            <pre><code>{{ curlEmailDetailExample }}</code></pre>
          </div>

          <h4>响应示例</h4>
          <div class="code-block">
            <div class="code-header">
              <span>JSON</span>
            </div>
            <pre><code>{{ emailDetailResponse }}</code></pre>
          </div>
        </div>
      </section>

      <!-- 错误响应 -->
      <section class="docs-section">
        <h2>错误响应</h2>
        <p>当请求失败时，API 会返回相应的 HTTP 状态码和错误信息：</p>
        
        <el-table :data="errorCodes" border style="width: 100%">
          <el-table-column prop="code" label="状态码" width="100" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="example" label="示例">
            <template #default="{ row }">
              <code>{{ row.example }}</code>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <!-- 数据模型 -->
      <section class="docs-section">
        <h2>数据模型</h2>

        <h3>Account 账户对象</h3>
        <el-table :data="accountModel" border style="width: 100%">
          <el-table-column prop="field" label="字段" width="150" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="description" label="描述" />
        </el-table>

        <h3 style="margin-top: 20px;">Email 邮件对象</h3>
        <el-table :data="emailModel" border style="width: 100%">
          <el-table-column prop="field" label="字段" width="150" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="description" label="描述" />
        </el-table>
      </section>

      <!-- 使用限制 -->
      <section class="docs-section">
        <h2>使用限制</h2>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="每页最大数量">100 条</el-descriptions-item>
          <el-descriptions-item label="IP 白名单">可在令牌管理中配置允许访问的 IP 地址</el-descriptions-item>
          <el-descriptions-item label="令牌过期">可设置令牌过期时间，过期后需要重新生成</el-descriptions-item>
        </el-descriptions>
      </section>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentCopy } from '@element-plus/icons-vue'

const authTab = ref('header')

// 获取当前站点的 base URL
const baseUrl = computed(() => {
  return window.location.origin
})

// cURL 示例
const curlAccountsExample = computed(() => 
`curl -X GET "${baseUrl.value}/api/v1/open/accounts" \\
  -H "Authorization: Bearer your_api_token"`)

const curlEmailsByAccountExample = computed(() => 
`curl -X GET "${baseUrl.value}/api/v1/open/accounts/example@gmail.com/emails?limit=10&page=1" \\
  -H "Authorization: Bearer your_api_token"`)

const curlAllEmailsExample = computed(() => 
`curl -X GET "${baseUrl.value}/api/v1/open/emails?limit=10&page=1" \\
  -H "Authorization: Bearer your_api_token"`)

const curlEmailDetailExample = computed(() => 
`curl -X GET "${baseUrl.value}/api/v1/open/emails?email_id=email_id_here" \\
  -H "Authorization: Bearer your_api_token"`)

// 响应示例
const accountsResponse = `{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "name": "我的邮箱",
      "email": "example@gmail.com",
      "provider": "gmail",
      "isActive": true,
      "createdAt": "2026-01-30T10:00:00"
    }
  ]
}`

const emailsByAccountResponse = `{
  "success": true,
  "data": {
    "account": {
      "id": "abc123",
      "name": "我的邮箱",
      "email": "example@gmail.com",
      "provider": "gmail",
      "isActive": true,
      "createdAt": "2026-01-30T10:00:00"
    },
    "items": [
      {
        "id": "email123",
        "accountId": "abc123",
        "messageId": "<msg123@mail.gmail.com>",
        "from": "sender@example.com",
        "to": "example@gmail.com",
        "cc": null,
        "subject": "测试邮件",
        "date": "2026-01-30T12:00:00",
        "isRead": false,
        "hasAttachments": false,
        "folder": "INBOX",
        "body": "这是邮件的纯文本内容",
        "bodyHtml": "<p>这是邮件的HTML内容</p>"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}`

const allEmailsResponse = `{
  "success": true,
  "data": {
    "items": [
      {
        "id": "email123",
        "accountId": "abc123",
        "messageId": "<msg123@mail.gmail.com>",
        "from": "sender@example.com",
        "to": "example@gmail.com",
        "cc": null,
        "subject": "测试邮件",
        "date": "2026-01-30T12:00:00",
        "isRead": false,
        "hasAttachments": false,
        "folder": "INBOX",
        "body": "这是邮件的纯文本内容",
        "bodyHtml": "<p>这是邮件的HTML内容</p>"
      }
    ],
    "total": 500,
    "page": 1,
    "pageSize": 10,
    "totalPages": 50
  }
}`

const emailDetailResponse = `{
  "success": true,
  "data": {
    "id": "email123",
    "accountId": "abc123",
    "messageId": "<msg123@mail.gmail.com>",
    "from": "sender@example.com",
    "to": "example@gmail.com",
    "cc": "cc@example.com",
    "subject": "测试邮件",
    "date": "2026-01-30T12:00:00",
    "isRead": true,
    "hasAttachments": true,
    "folder": "INBOX",
    "body": "这是邮件的纯文本内容",
    "bodyHtml": "<p>这是邮件的HTML内容</p>"
  }
}`

// 参数表格数据
const emailsByAccountParams = [
  { name: 'email_address', type: 'string', required: true, description: '邮箱地址，如 example@gmail.com' }
]

const paginationParams = [
  { name: 'limit', type: 'integer', default: '10', description: '每页数量，范围 1-100' },
  { name: 'page', type: 'integer', default: '1', description: '页码，从 1 开始' }
]

const emailDetailParams = [
  { name: 'email_id', type: 'string', required: true, description: '邮件的唯一标识 ID' }
]

// 错误码
const errorCodes = [
  { code: '401', description: '未授权 - 令牌无效、已禁用或已过期', example: '{"detail": "无效的 API 令牌"}' },
  { code: '403', description: '禁止访问 - IP 不在白名单中', example: '{"detail": "IP 地址 x.x.x.x 不在白名单中"}' },
  { code: '404', description: '未找到 - 请求的资源不存在', example: '{"detail": "邮箱 xxx@xxx.com 不存在"}' }
]

// 数据模型
const accountModel = [
  { field: 'id', type: 'string', description: '账户唯一标识' },
  { field: 'name', type: 'string', description: '账户名称' },
  { field: 'email', type: 'string', description: '邮箱地址' },
  { field: 'provider', type: 'string', description: '邮箱服务商 (gmail, outlook, qq, 163, custom)' },
  { field: 'isActive', type: 'boolean', description: '是否启用' },
  { field: 'createdAt', type: 'string', description: '创建时间 (ISO 8601 格式)' }
]

const emailModel = [
  { field: 'id', type: 'string', description: '邮件唯一标识' },
  { field: 'accountId', type: 'string', description: '所属账户 ID' },
  { field: 'messageId', type: 'string', description: '邮件 Message-ID' },
  { field: 'from', type: 'string', description: '发件人地址' },
  { field: 'to', type: 'string', description: '收件人地址' },
  { field: 'cc', type: 'string | null', description: '抄送地址' },
  { field: 'subject', type: 'string', description: '邮件主题' },
  { field: 'date', type: 'string', description: '邮件日期 (ISO 8601 格式)' },
  { field: 'isRead', type: 'boolean', description: '是否已读' },
  { field: 'hasAttachments', type: 'boolean', description: '是否有附件' },
  { field: 'folder', type: 'string', description: '邮件文件夹' },
  { field: 'body', type: 'string', description: '邮件纯文本内容' },
  { field: 'bodyHtml', type: 'string', description: '邮件 HTML 内容（不包含内嵌图片）' }
]

// 复制代码
function copyCode(code: string) {
  navigator.clipboard.writeText(code).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}
</script>

<style scoped>
.api-docs-container {
  max-width: 1200px;
  margin: 0 auto;
}

.docs-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
}

.docs-section {
  margin-bottom: 40px;
}

.docs-section h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
}

.docs-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 10px;
}

.docs-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin: 15px 0 10px;
}

.docs-section p {
  color: #606266;
  line-height: 1.8;
  margin-bottom: 15px;
}

.code-block {
  background-color: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 15px;
  background-color: #2d2d2d;
  color: #ccc;
  font-size: 12px;
}

.code-block pre {
  margin: 0;
  padding: 15px;
  overflow-x: auto;
}

.code-block code {
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.api-endpoint {
  background-color: #f9f9f9;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 25px;
}

.endpoint-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}

.endpoint-path {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  background-color: #f0f0f0;
  padding: 5px 10px;
  border-radius: 4px;
}

.endpoint-desc {
  color: #909399;
  margin-bottom: 15px;
}

:deep(.el-table) {
  margin-bottom: 15px;
}

:deep(.el-descriptions) {
  margin-top: 15px;
}

@media (max-width: 768px) {
  .api-docs-container {
    padding: 0;
  }
  
  .endpoint-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .endpoint-path {
    font-size: 14px;
    word-break: break-all;
  }
  
  .code-block code {
    font-size: 12px;
  }
}
</style>
