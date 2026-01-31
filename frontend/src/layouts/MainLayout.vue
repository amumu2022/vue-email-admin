<template>
  <div class="app-container" :class="{ 'sidebar-collapsed': sidebarCollapsed, 'sidebar-hidden': sidebarHidden }">
    <!-- 移动端遮罩层 -->
    <div 
      v-if="!sidebarHidden && isMobile" 
      class="sidebar-overlay" 
      @click="hideSidebar"
    ></div>

    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed, hidden: sidebarHidden }">
      <div class="sidebar-header">
        <h1 class="logo">
          <el-icon><Message /></el-icon>
          <span v-show="!sidebarCollapsed" class="logo-text">邮箱管理</span>
        </h1>
        <!-- 桌面端折叠按钮 -->
        <el-button 
          v-if="!isMobile"
          class="collapse-btn" 
          link 
          @click="toggleCollapse"
        >
          <el-icon>
            <component :is="sidebarCollapsed ? 'Expand' : 'Fold'" />
          </el-icon>
        </el-button>
      </div>

      <!-- 账户列表 -->
      <div class="account-section">
        <div class="section-title" v-show="!sidebarCollapsed">
          <span>邮箱账户</span>
          <el-button type="primary" link @click="goToAddAccount">
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>
        
        <div class="account-list">
          <el-tooltip 
            v-for="account in accounts"
            :key="account.id"
            :content="account.email"
            :disabled="!sidebarCollapsed"
            placement="right"
          >
            <div
              class="account-item"
              :class="{ active: currentAccountId === account.id }"
              @click="selectAccount(account.id)"
            >
              <div class="account-icon" :style="{ backgroundColor: getProviderColor(account.provider) }">
                {{ account.email.charAt(0).toUpperCase() }}
              </div>
              <!-- 展开状态显示完整信息 -->
              <div v-show="!sidebarCollapsed" class="account-info">
                <div class="account-name">{{ account.name }}</div>
                <div class="account-email">{{ account.email }}</div>
              </div>
              <!-- 折叠状态显示邮箱简称（桌面端） -->
              <div v-show="sidebarCollapsed" class="account-short-name">
                {{ getAccountShortName(account) }}
              </div>
            </div>
          </el-tooltip>
          
          <div v-if="accounts.length === 0 && !sidebarCollapsed" class="no-accounts">
            <p>暂无邮箱账户</p>
            <el-button type="primary" size="small" @click="goToAddAccount">
              添加账户
            </el-button>
          </div>
          
          <!-- 折叠状态下的添加按钮 -->
          <el-tooltip v-if="sidebarCollapsed" content="添加账户" placement="right">
            <div class="account-item add-account-btn" @click="goToAddAccount">
              <div class="account-icon add-icon">
                <el-icon><Plus /></el-icon>
              </div>
            </div>
          </el-tooltip>
        </div>
      </div>

      <!-- 导航菜单 -->
      <nav class="nav-menu">
        <el-tooltip content="首页" :disabled="!sidebarCollapsed" placement="right">
          <router-link to="/dashboard" class="nav-item" active-class="active">
            <el-icon><HomeFilled /></el-icon>
            <span v-show="!sidebarCollapsed">首页</span>
          </router-link>
        </el-tooltip>
        
        <!-- 邮件中心子菜单 -->
        <div class="nav-submenu">
          <div 
            class="nav-item nav-submenu-title" 
            :class="{ active: isMailCenterActive }"
            @click="toggleMailCenterMenu"
          >
            <el-icon><Message /></el-icon>
            <span v-show="!sidebarCollapsed">邮件中心</span>
            <el-badge v-if="unreadCount > 0 && !sidebarCollapsed" :value="unreadCount" class="unread-badge" />
            <el-badge v-if="unreadCount > 0 && sidebarCollapsed" :value="unreadCount" class="unread-badge-dot" is-dot />
            <el-icon v-show="!sidebarCollapsed" class="submenu-arrow" :class="{ expanded: mailCenterMenuExpanded }">
              <ArrowDown />
            </el-icon>
          </div>
          <transition name="submenu">
            <div v-show="mailCenterMenuExpanded && !sidebarCollapsed" class="nav-submenu-items">
              <router-link to="/inbox" class="nav-item nav-subitem" active-class="active">
                <el-icon><MessageBox /></el-icon>
                <span>收件箱</span>
              </router-link>
              <router-link to="/all-inbox" class="nav-item nav-subitem" active-class="active">
                <el-icon><Folder /></el-icon>
                <span>总收件箱</span>
              </router-link>
            </div>
          </transition>
        </div>
        
        <el-tooltip content="邮箱管理" :disabled="!sidebarCollapsed" placement="right">
          <router-link to="/accounts" class="nav-item" active-class="active">
            <el-icon><User /></el-icon>
            <span v-show="!sidebarCollapsed">邮箱管理</span>
          </router-link>
        </el-tooltip>
        
        <!-- 访问日志子菜单 -->
        <div v-if="isAdmin" class="nav-submenu">
          <div 
            class="nav-item nav-submenu-title" 
            :class="{ active: isLogsActive }"
            @click="toggleLogsMenu"
          >
            <el-icon><Document /></el-icon>
            <span v-show="!sidebarCollapsed">访问日志</span>
            <el-icon v-show="!sidebarCollapsed" class="submenu-arrow" :class="{ expanded: logsMenuExpanded }">
              <ArrowDown />
            </el-icon>
          </div>
          <transition name="submenu">
            <div v-show="logsMenuExpanded && !sidebarCollapsed" class="nav-submenu-items">
              <router-link to="/logs/open-api" class="nav-item nav-subitem" active-class="active">
                <el-icon><Connection /></el-icon>
                <span>开放API日志</span>
              </router-link>
              <router-link to="/logs/login" class="nav-item nav-subitem" active-class="active">
                <el-icon><Unlock /></el-icon>
                <span>登录日志</span>
              </router-link>
              <router-link to="/logs/other" class="nav-item nav-subitem" active-class="active">
                <el-icon><List /></el-icon>
                <span>操作日志</span>
              </router-link>
            </div>
          </transition>
        </div>
        
        <el-tooltip v-if="isAdmin" content="用户管理" :disabled="!sidebarCollapsed" placement="right">
          <router-link to="/users" class="nav-item" active-class="active">
            <el-icon><UserFilled /></el-icon>
            <span v-show="!sidebarCollapsed">用户管理</span>
          </router-link>
        </el-tooltip>
        
        <el-tooltip v-if="isAdmin" content="令牌管理" :disabled="!sidebarCollapsed" placement="right">
          <router-link to="/tokens" class="nav-item" active-class="active">
            <el-icon><Key /></el-icon>
            <span v-show="!sidebarCollapsed">令牌管理</span>
          </router-link>
        </el-tooltip>
        
        <el-tooltip content="设置" :disabled="!sidebarCollapsed" placement="right">
          <router-link to="/settings" class="nav-item" active-class="active">
            <el-icon><Setting /></el-icon>
            <span v-show="!sidebarCollapsed">设置</span>
          </router-link>
        </el-tooltip>
        
        <el-tooltip content="API文档" :disabled="!sidebarCollapsed" placement="right">
          <router-link to="/api-docs" class="nav-item" active-class="active">
            <el-icon><Notebook /></el-icon>
            <span v-show="!sidebarCollapsed">API文档</span>
          </router-link>
        </el-tooltip>
      </nav>

      <!-- 底部用户信息 -->
      <div class="sidebar-footer">
        <div v-if="!sidebarCollapsed" class="user-info">
          <el-dropdown trigger="click" @command="handleUserCommand">
            <div class="user-dropdown">
              <el-avatar :size="32" class="user-avatar">
                {{ username.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="user-name">{{ username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人信息
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <el-tooltip v-else content="退出登录" placement="right">
          <el-button class="logout-btn-collapsed" link @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-button 
          v-if="isMobile"
          class="close-sidebar-btn" 
          type="primary"
          @click="hideSidebar"
        >
          <el-icon><Close /></el-icon>
          <span>关闭菜单</span>
        </el-button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部栏 -->
      <header class="header">
        <div class="header-left">
          <el-button class="menu-toggle" link @click="toggleSidebar">
            <el-icon><Menu /></el-icon>
          </el-button>
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
        <div class="header-right">
          <el-tooltip content="刷新所有邮箱" placement="bottom">
            <el-button :loading="refreshing" @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              <span class="btn-text">刷新全部</span>
            </el-button>
          </el-tooltip>
        </div>
      </header>

      <!-- 内容区 -->
      <div class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
      
      <!-- 页脚 -->
      <footer class="app-footer">
        <span class="footer-info">EmailAdmin v{{ appVersion }} | 作者：小墩</span>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message, Plus, MessageBox, User, UserFilled, Setting, Menu, Refresh, Close, Document, ArrowDown, SwitchButton, Folder, HomeFilled, Key, Connection, Unlock, List, Notebook } from '@element-plus/icons-vue'
import { useAccountStore, useEmailStore, useAuthStore } from '@/stores'
import { getProviderColor } from '@/utils/email'

const router = useRouter()
const route = useRoute()
const accountStore = useAccountStore()
const emailStore = useEmailStore()
const authStore = useAuthStore()

// 侧边栏状态
const sidebarCollapsed = ref(false)
const sidebarHidden = ref(true)
const isMobile = ref(false)
const logsMenuExpanded = ref(false)
const mailCenterMenuExpanded = ref(true)

// 计算属性
const accounts = computed(() => accountStore.accounts)
const currentAccountId = computed(() => accountStore.currentAccountId)
const unreadCount = computed(() => emailStore.unreadCount)
const refreshing = computed(() => emailStore.refreshing)
const username = computed(() => authStore.username || 'User')
const isAdmin = computed(() => authStore.isAdmin)

// 应用版本号（从 package.json 获取）
const appVersion = __APP_VERSION__

const pageTitle = computed(() => {
  return (route.meta.title as string) || '邮箱管理'
})

// 判断日志菜单是否激活
const isLogsActive = computed(() => {
  return route.path.startsWith('/logs')
})

// 判断邮件中心菜单是否激活
const isMailCenterActive = computed(() => {
  return route.path === '/inbox' || route.path === '/all-inbox'
})

// 获取账户简称（用于移动端显示）
function getAccountShortName(account: { name: string; email: string }) {
  // 优先显示账户名称，如果太长则截取
  if (account.name && account.name.length <= 8) {
    return account.name
  }
  // 显示邮箱前缀
  const emailPrefix = account.email.split('@')[0] || ''
  if (emailPrefix.length <= 8) {
    return emailPrefix
  }
  return emailPrefix.substring(0, 6) + '..'
}

// 检测是否为移动端
function checkMobile() {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    sidebarCollapsed.value = false
    sidebarHidden.value = true
  } else {
    sidebarHidden.value = false
  }
}

// 方法
function selectAccount(id: string) {
  accountStore.setCurrentAccount(id)
  // 自动跳转到收件箱
  router.push('/inbox')
  if (isMobile.value) {
    hideSidebar()
  }
}

function goToAddAccount() {
  router.push('/accounts/add')
  if (isMobile.value) {
    hideSidebar()
  }
}

function toggleCollapse() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function toggleLogsMenu() {
  if (sidebarCollapsed.value) {
    // 折叠状态下点击直接跳转到第一个子菜单
    router.push('/logs/open-api')
  } else {
    // 手风琴效果：展开日志菜单时关闭邮件中心菜单
    if (!logsMenuExpanded.value) {
      mailCenterMenuExpanded.value = false
    }
    logsMenuExpanded.value = !logsMenuExpanded.value
  }
}

function toggleMailCenterMenu() {
  if (sidebarCollapsed.value) {
    // 折叠状态下点击直接跳转到收件箱
    router.push('/inbox')
  } else {
    // 手风琴效果：展开邮件中心菜单时关闭日志菜单
    if (!mailCenterMenuExpanded.value) {
      logsMenuExpanded.value = false
    }
    mailCenterMenuExpanded.value = !mailCenterMenuExpanded.value
  }
}

function toggleSidebar() {
  if (isMobile.value) {
    sidebarHidden.value = !sidebarHidden.value
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
}

function hideSidebar() {
  if (isMobile.value) {
    sidebarHidden.value = true
  }
}

async function handleRefresh() {
  // 刷新所有邮箱的邮件（不传 accountId 参数）
  await emailStore.refreshEmails()
}

function handleUserCommand(command: string) {
  if (command === 'logout') {
    handleLogout()
  } else if (command === 'profile') {
    router.push('/settings')
  }
}

async function handleLogout() {
  await authStore.logoutAction()
  router.push('/login')
}

// 生命周期
onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  await accountStore.fetchAccounts()
  if (accounts.value.length > 0 && !currentAccountId.value) {
    const firstAccount = accounts.value[0]
    if (firstAccount) {
      accountStore.setCurrentAccount(firstAccount.id)
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100%;
  position: relative;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

.sidebar {
  width: 200px;
  background-color: #304156;
  color: #fff;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  z-index: 999;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 56px;
}

.sidebar.hidden {
  transform: translateX(-100%);
  position: absolute;
  height: 100%;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
}

.sidebar.collapsed .sidebar-header {
  padding: 20px 12px;
  justify-content: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
  overflow: hidden;
}

.logo-text {
  white-space: nowrap;
}

.collapse-btn {
  color: rgba(255, 255, 255, 0.8);
  font-size: 18px;
  padding: 4px;
}

.collapse-btn:hover {
  color: #fff;
}

.sidebar.collapsed .collapse-btn {
  display: none;
}

.account-section {
  padding: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar.collapsed .account-section {
  padding: 10px 8px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 10px;
  text-transform: uppercase;
}

.account-list {
  max-height: 200px;
  overflow-y: auto;
}

.account-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.3s;
  border-radius: 8px;
  margin-bottom: 4px;
}

.sidebar.collapsed .account-item {
  padding: 10px 8px;
  justify-content: flex-start;
}

.account-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.account-item.active {
  background-color: rgba(64, 158, 255, 0.3);
}

.account-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0;
}

.sidebar.collapsed .account-icon {
  width: 32px;
  height: 32px;
}

.account-info {
  flex: 1;
  margin-left: 10px;
  overflow: hidden;
}

.account-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-email {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-short-name {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  margin-left: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60px;
}

.no-accounts {
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.6);
}

.no-accounts p {
  margin-bottom: 10px;
  font-size: 14px;
}

.add-icon {
  background-color: transparent !important;
  border: 2px dashed rgba(255, 255, 255, 0.5);
}

.add-account-btn:hover .add-icon {
  border-color: #409eff;
  color: #409eff;
}

.nav-menu {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.sidebar.collapsed .nav-menu {
  padding: 10px 8px;
}

/* 导航菜单滚动条样式 */
.nav-menu::-webkit-scrollbar {
  width: 4px;
}

.nav-menu::-webkit-scrollbar-track {
  background: transparent;
}

.nav-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.nav-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 5px;
  transition: all 0.3s;
  position: relative;
}

.sidebar.collapsed .nav-item {
  padding: 12px;
  justify-content: center;
  gap: 0;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.nav-item.active {
  background-color: rgba(64, 158, 255, 0.3);
  color: #fff;
}

.nav-submenu {
  margin-bottom: 5px;
}

.nav-submenu-title {
  cursor: pointer;
  justify-content: flex-start;
}

.nav-submenu-title .submenu-arrow {
  margin-left: auto;
  transition: transform 0.3s;
}

.nav-submenu-title .submenu-arrow.expanded {
  transform: rotate(180deg);
}

.nav-submenu-items {
  padding-left: 10px;
  overflow: hidden;
}

.nav-subitem {
  padding: 10px 15px 10px 25px !important;
  font-size: 13px;
}

.nav-subitem .el-icon {
  font-size: 14px;
}

.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
}

.submenu-enter-from,
.submenu-leave-to {
  max-height: 0;
  opacity: 0;
}

.unread-badge {
  position: absolute;
  right: 10px;
}

.unread-badge-dot {
  position: absolute;
  top: 8px;
  right: 8px;
}

.sidebar-footer {
  padding: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info {
  margin-bottom: 10px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  background-color: #409eff;
  color: #fff;
}

.user-name {
  flex: 1;
  font-size: 14px;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn-collapsed {
  width: 100%;
  color: rgba(255, 255, 255, 0.8);
  font-size: 20px;
}

.logout-btn-collapsed:hover {
  color: #fff;
}

.close-sidebar-btn {
  width: 100%;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  padding: 0 15px;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.menu-toggle {
  font-size: 20px;
  color: #606266;
}

.page-title {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.content {
  flex: 1;
  padding: 15px;
  background-color: #f5f7fa;
  overflow-y: auto;
}

.app-footer {
  height: 40px;
  background-color: #fff;
  border-top: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.footer-info {
  font-size: 12px;
  color: #909399;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .app-container {
    /* 移动端添加顶部安全区域，避免与手机状态栏遮挡 */
    padding-top: env(safe-area-inset-top, 0px);
    padding-top: constant(safe-area-inset-top, 0px); /* iOS 11.0-11.2 兼容 */
    /* 移动端添加底部安全区域，避免与手机底部导航栏遮挡 */
    padding-bottom: env(safe-area-inset-bottom, 0px);
    padding-bottom: constant(safe-area-inset-bottom, 0px);
  }
  
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 240px;
    transform: translateX(0);
    /* 侧边栏也需要考虑安全区域 */
    padding-top: env(safe-area-inset-top, 0px);
    padding-top: constant(safe-area-inset-top, 0px);
  }
  
  .sidebar.hidden {
    transform: translateX(-100%);
  }
  
  .sidebar-overlay {
    /* 遮罩层从安全区域下方开始 */
    top: env(safe-area-inset-top, 0px);
    top: constant(safe-area-inset-top, 0px);
  }
  
  .main-content {
    width: 100%;
    /* 确保主内容区域填满可用空间 */
    min-height: 0;
  }
  
  .header {
    /* 移动端顶部栏减小高度，增加内容显示空间 */
    height: 48px;
    min-height: 48px;
    padding: 0 10px;
  }
  
  .page-title {
    font-size: 15px;
  }
  
  .content {
    padding: 8px;
    /* 确保内容区域可以滚动并填满剩余空间 */
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
  
  .app-footer {
    /* 移动端页脚减小高度 */
    height: 32px;
    min-height: 32px;
    padding: 0 10px;
    /* 添加底部安全区域内边距 */
    padding-bottom: env(safe-area-inset-bottom, 0px);
    padding-bottom: constant(safe-area-inset-bottom, 0px);
  }
  
  .footer-info {
    font-size: 11px;
  }
  
  .btn-text {
    display: none;
  }
  
  /* 移动端菜单按钮优化 */
  .menu-toggle {
    padding: 8px;
  }
  
  /* 移动端刷新按钮优化 */
  .header-right .el-button {
    padding: 8px 12px;
  }
}

/* 超小屏幕设备优化 (小于 480px) */
@media (max-width: 480px) {
  .header {
    height: 44px;
    min-height: 44px;
  }
  
  .page-title {
    font-size: 14px;
  }
  
  .app-footer {
    height: 28px;
    min-height: 28px;
  }
  
  .footer-info {
    font-size: 10px;
  }
  
  .content {
    padding: 6px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar:not(.collapsed) {
    width: 180px;
  }
}
</style>
