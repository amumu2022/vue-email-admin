<!--
 * @Author: XDTEAM
 * @Date: 2026-01-29 21:50:30
 * @LastEditTime: 2026-01-30 19:08:17
 * @LastEditors: XDTEAM
 * @Description: 
-->
<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

// 初始化主题设置
function initThemeSettings() {
  const saved = localStorage.getItem('emailAdminSettings')
  if (saved) {
    try {
      const settings = JSON.parse(saved)
      
      // 应用主题
      if (settings.theme) {
        const html = document.documentElement
        if (settings.theme === 'auto') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          html.classList.toggle('dark', prefersDark)
        } else {
          html.classList.toggle('dark', settings.theme === 'dark')
        }
      }
      
      // 应用紧凑模式
      if (settings.compactMode !== undefined) {
        document.documentElement.classList.toggle('compact-mode', settings.compactMode)
      }
    } catch {
      console.error('初始化主题设置失败')
    }
  }
}

// 监听系统主题变化
function setupSystemThemeListener() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    const saved = localStorage.getItem('emailAdminSettings')
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        if (settings.theme === 'auto') {
          const prefersDark = mediaQuery.matches
          document.documentElement.classList.toggle('dark', prefersDark)
        }
      } catch {
        // ignore
      }
    }
  })
}

onMounted(() => {
  initThemeSettings()
  setupSystemThemeListener()
})
</script>

<style>
/* 全局样式已在 main.ts 中引入 */
</style>
