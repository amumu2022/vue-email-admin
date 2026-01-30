/*
 * @Author: XDTEAM
 * @Date: 2026-01-29 21:54:23
 * @LastEditTime: 2026-01-30 21:30:46
 * @LastEditors: XDTEAM
 * @Description: 
 */
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.emailadmin.app',
  appName: 'Email Admin',
  webDir: 'dist',
  server: {
    // 允许 Android 应用访问 HTTP 地址（非 HTTPS）
    cleartext: true,
    // 如果需要在开发时使用本地服务器，可以取消下面的注释
    // url: 'http://192.168.x.x:3000',
    // androidScheme: 'http'
  },
  android: {
    // 允许混合内容（HTTP 和 HTTPS）
    allowMixedContent: true
  }
};

export default config;
