/*
 * @Author: XDTEAM
 * @Date: 2026-01-29 21:50:30
 * @LastEditTime: 2026-01-30 22:08:06
 * @LastEditors: XDTEAM
 * @Description: 
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import pkg from './package.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  server: {
    port: 3000,
  }
})
