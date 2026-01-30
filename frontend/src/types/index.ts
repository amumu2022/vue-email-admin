// 邮箱账户类型
export interface EmailAccount {
  id: string
  name: string
  email: string
  provider: EmailProvider
  password: string
  imapHost: string
  imapPort: number
  smtpHost: string
  smtpPort: number
  useSSL: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 邮箱提供商类型
export type EmailProvider = 'gmail' | 'outlook' | 'qq' | '163' | 'yahoo' | 'custom'

// 邮箱提供商配置
export interface ProviderConfig {
  name: string
  imapHost: string
  imapPort: number
  smtpHost: string
  smtpPort: number
  useSSL: boolean
}

// 内嵌图片类型
export interface InlineImage {
  content_type: string
  data: string  // Base64 编码的图片数据
}

// 邮件类型
export interface Email {
  id: string
  accountId: string
  messageId: string
  from: EmailAddress
  to: EmailAddress[]
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  subject: string
  body: string
  bodyHtml?: string
  date: string
  isRead: boolean
  isStarred: boolean
  hasAttachments: boolean
  attachments?: Attachment[]
  inlineImages?: Record<string, InlineImage>  // CID 到图片数据的映射
  folder: string
  labels?: string[]
}

// 邮件地址类型
export interface EmailAddress {
  name?: string
  address: string
}

// 附件类型
export interface Attachment {
  id: string
  filename: string
  contentType: string
  size: number
  url?: string
}

// 邮件文件夹类型
export interface EmailFolder {
  name: string
  path: string
  count: number
  unreadCount: number
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 账户表单类型
export interface AccountFormData {
  name: string
  email: string
  provider: EmailProvider
  password: string
  imapHost: string
  imapPort: number
  smtpHost: string
  smtpPort: number
  useSSL: boolean
}
