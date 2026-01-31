/*
 * @Author: XDTEAM
 * @Date: 2026-01-31
 * @Description: 版本更新 API
 */

export interface ReleaseInfo {
  tag_name: string
  name: string
  body: string
  published_at: string
  html_url: string
  assets: ReleaseAsset[]
}

export interface ReleaseAsset {
  name: string
  browser_download_url: string
  size: number
  download_count: number
}

export interface VersionInfo {
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
  releaseInfo: ReleaseInfo | null
  downloadUrls: {
    apk: string | null
    frontend: string | null
  }
}

// GitHub 仓库信息 - 请根据实际情况修改
const GITHUB_OWNER = 'amumu2022'
const GITHUB_REPO = 'vue-email-admin'

// 固定下载链接（始终指向最新版本）
const FIXED_DOWNLOAD_URLS = {
  apk: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/latest/EmailAdmin-latest.apk`,
  frontend: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/latest/frontend-dist.zip`
}

/**
 * 比较版本号
 * @param v1 版本号1
 * @param v2 版本号2
 * @returns 1: v1 > v2, -1: v1 < v2, 0: v1 = v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.replace(/^v/, '').split('.').map(Number)
  const parts2 = v2.replace(/^v/, '').split('.').map(Number)
  
  const maxLength = Math.max(parts1.length, parts2.length)
  
  for (let i = 0; i < maxLength; i++) {
    const num1 = parts1[i] || 0
    const num2 = parts2[i] || 0
    
    if (num1 > num2) return 1
    if (num1 < num2) return -1
  }
  
  return 0
}

/**
 * 获取最新版本信息
 */
export async function getLatestRelease(): Promise<ReleaseInfo | null> {
  try {
    // 使用 latest release API
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tags/latest`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    )
    
    if (!response.ok) {
      // 如果 latest tag 不存在，尝试获取最新的 release
      const fallbackResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      )
      
      if (!fallbackResponse.ok) {
        console.error('获取版本信息失败:', fallbackResponse.status)
        return null
      }
      
      return await fallbackResponse.json()
    }
    
    return await response.json()
  } catch (error) {
    console.error('获取版本信息失败:', error)
    return null
  }
}

/**
 * 检查更新
 * @param currentVersion 当前版本号
 */
export async function checkForUpdate(currentVersion: string): Promise<VersionInfo> {
  const releaseInfo = await getLatestRelease()
  
  if (!releaseInfo) {
    return {
      currentVersion,
      latestVersion: currentVersion,
      hasUpdate: false,
      releaseInfo: null,
      downloadUrls: {
        apk: FIXED_DOWNLOAD_URLS.apk,
        frontend: FIXED_DOWNLOAD_URLS.frontend
      }
    }
  }
  
  // 从 release name 或 body 中提取实际版本号
  // Latest Release 的 name 格式为 "Latest Release (v1.2.0)"
  let latestVersion = releaseInfo.tag_name
  const versionMatch = releaseInfo.name.match(/v?([\d.]+)/)
  if (versionMatch && versionMatch[1]) {
    latestVersion = versionMatch[1]
  }
  
  const hasUpdate = compareVersions(latestVersion, currentVersion) > 0
  
  // 查找下载链接
  let apkUrl = FIXED_DOWNLOAD_URLS.apk
  let frontendUrl = FIXED_DOWNLOAD_URLS.frontend
  
  if (releaseInfo.assets) {
    for (const asset of releaseInfo.assets) {
      if (asset.name.endsWith('.apk')) {
        apkUrl = asset.browser_download_url
      } else if (asset.name.includes('frontend') && asset.name.endsWith('.zip')) {
        frontendUrl = asset.browser_download_url
      }
    }
  }
  
  return {
    currentVersion,
    latestVersion,
    hasUpdate,
    releaseInfo,
    downloadUrls: {
      apk: apkUrl,
      frontend: frontendUrl
    }
  }
}

/**
 * 获取固定下载链接
 */
export function getFixedDownloadUrls() {
  return FIXED_DOWNLOAD_URLS
}

/**
 * 设置 GitHub 仓库信息
 * @param owner 仓库所有者
 * @param repo 仓库名称
 */
export function setGitHubRepo(owner: string, repo: string) {
  // 动态更新仓库信息（用于自定义部署）
  Object.assign(FIXED_DOWNLOAD_URLS, {
    apk: `https://github.com/${owner}/${repo}/releases/download/latest/EmailAdmin-latest.apk`,
    frontend: `https://github.com/${owner}/${repo}/releases/download/latest/frontend-dist.zip`
  })
}
