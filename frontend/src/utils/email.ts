import type { EmailProvider, ProviderConfig } from '@/types'

// 邮箱提供商预设配置
export const providerConfigs: Record<EmailProvider, ProviderConfig> = {
  gmail: {
    name: 'Gmail',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    useSSL: true
  },
  outlook: {
    name: 'Outlook',
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    useSSL: true
  },
  qq: {
    name: 'QQ邮箱',
    imapHost: 'imap.qq.com',
    imapPort: 993,
    smtpHost: 'smtp.qq.com',
    smtpPort: 587,
    useSSL: true
  },
  '163': {
    name: '163邮箱',
    imapHost: 'imap.163.com',
    imapPort: 993,
    smtpHost: 'smtp.163.com',
    smtpPort: 465,
    useSSL: true
  },
  yahoo: {
    name: 'Yahoo邮箱',
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 587,
    useSSL: true
  },
  custom: {
    name: '自定义',
    imapHost: '',
    imapPort: 993,
    smtpHost: '',
    smtpPort: 587,
    useSSL: true
  }
}

// 获取提供商配置
export function getProviderConfig(provider: EmailProvider): ProviderConfig {
  return providerConfigs[provider] || providerConfigs.custom
}

// 提供商选项列表
export const providerOptions: { label: string; value: EmailProvider }[] = [
  { label: 'Gmail', value: 'gmail' },
  { label: 'Outlook', value: 'outlook' },
  { label: 'QQ邮箱', value: 'qq' },
  { label: '163邮箱', value: '163' },
  { label: 'Yahoo邮箱', value: 'yahoo' },
  { label: '自定义', value: 'custom' }
]

// 根据邮箱地址自动检测提供商
export function detectProvider(email: string): EmailProvider {
  const domain = email.split('@')[1]?.toLowerCase()
  
  if (!domain) return 'custom'
  
  if (domain.includes('gmail.com') || domain.includes('googlemail.com')) {
    return 'gmail'
  }
  if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com')) {
    return 'outlook'
  }
  if (domain.includes('qq.com') || domain.includes('foxmail.com')) {
    return 'qq'
  }
  if (domain.includes('163.com')) {
    return '163'
  }
  if (domain.includes('yahoo.com') || domain.includes('yahoo.cn')) {
    return 'yahoo'
  }
  
  return 'custom'
}

// 获取提供商图标颜色
export function getProviderColor(provider: EmailProvider): string {
  const colors: Record<EmailProvider, string> = {
    gmail: '#ea4335',
    outlook: '#0078d4',
    qq: '#12b7f5',
    '163': '#d43c33',
    yahoo: '#6001d2',
    custom: '#909399'
  }
  return colors[provider] || colors.custom
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
export function formatDate(dateString: string, format: 'full' | 'short' | 'time' = 'short'): string {
  const date = new Date(dateString)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const isThisYear = date.getFullYear() === now.getFullYear()
  
  if (format === 'time' || isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  if (format === 'short') {
    if (isThisYear) {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
    }
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }
  
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 截断文本
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
