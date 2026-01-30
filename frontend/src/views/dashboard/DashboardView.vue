<template>
  <div class="dashboard-view">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6">
        <div class="stat-card card">
          <div class="stat-icon" style="background-color: #409eff;">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.accountCount }}</div>
            <div class="stat-label">邮箱账户</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card card">
          <div class="stat-icon" style="background-color: #67c23a;">
            <el-icon><Message /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalEmails }}</div>
            <div class="stat-label">总邮件数</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card card">
          <div class="stat-icon" style="background-color: #e6a23c;">
            <el-icon><Bell /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.unreadEmails }}</div>
            <div class="stat-label">未读邮件</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card card">
          <div class="stat-icon" style="background-color: #f56c6c;">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayEmails }}</div>
            <div class="stat-label">今日邮件</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 时间段统计 -->
    <el-row :gutter="20" class="period-row">
      <el-col :xs="24" :sm="8">
        <div class="period-card card">
          <div class="period-title">今日</div>
          <div class="period-value">{{ stats.todayEmails }}</div>
          <div class="period-label">封邮件</div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8">
        <div class="period-card card">
          <div class="period-title">本周</div>
          <div class="period-value">{{ stats.weekEmails }}</div>
          <div class="period-label">封邮件</div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8">
        <div class="period-card card">
          <div class="period-title">本月</div>
          <div class="period-value">{{ stats.monthEmails }}</div>
          <div class="period-label">封邮件</div>
        </div>
      </el-col>
    </el-row>

    <!-- 账户统计表格 -->
    <div class="account-stats card">
      <div class="card-header">
        <h3>账户邮件统计</h3>
      </div>
      <el-table :data="stats.accountStats" stripe style="width: 100%">
        <el-table-column prop="name" label="账户名称" min-width="120" />
        <el-table-column prop="email" label="邮箱地址" min-width="200" />
        <el-table-column prop="provider" label="提供商" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.provider }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="emailCount" label="邮件数" width="100" align="center" />
        <el-table-column prop="unreadCount" label="未读" width="80" align="center">
          <template #default="{ row }">
            <el-badge :value="row.unreadCount" :hidden="row.unreadCount === 0" type="danger">
              <span>{{ row.unreadCount }}</span>
            </el-badge>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 每日邮件趋势 -->
    <div class="daily-chart card">
      <div class="card-header">
        <h3>近7天邮件趋势</h3>
      </div>
      <div class="chart-container">
        <div class="chart-bars">
          <div 
            v-for="(item, index) in stats.dailyStats" 
            :key="index" 
            class="chart-bar-wrapper"
          >
            <div 
              class="chart-bar" 
              :style="{ height: getBarHeight(item.count) + '%' }"
            >
              <span class="bar-value">{{ item.count }}</span>
            </div>
            <div class="bar-label">{{ formatDate(item.date) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { User, Message, Bell, Calendar } from '@element-plus/icons-vue'
import { getDashboardStats, type DashboardStats } from '@/api/stats'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const stats = ref<DashboardStats>({
  accountCount: 0,
  totalEmails: 0,
  unreadEmails: 0,
  todayEmails: 0,
  weekEmails: 0,
  monthEmails: 0,
  accountStats: [],
  dailyStats: []
})

// 计算最大值用于图表
const maxDailyCount = computed(() => {
  if (stats.value.dailyStats.length === 0) return 1
  return Math.max(...stats.value.dailyStats.map(s => s.count), 1)
})

function getBarHeight(count: number): number {
  return (count / maxDailyCount.value) * 100
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

async function loadStats() {
  loading.value = true
  try {
    const response = await getDashboardStats()
    if (response.data) {
      stats.value = response.data
    }
  } catch (err) {
    ElMessage.error('获取统计数据失败')
    console.error('获取统计数据失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-row {
  margin-bottom: 0;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.period-row {
  margin-bottom: 0;
}

.period-card {
  text-align: center;
  padding: 25px 20px;
}

.period-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.period-value {
  font-size: 36px;
  font-weight: 600;
  color: #409eff;
}

.period-label {
  font-size: 14px;
  color: #606266;
  margin-top: 5px;
}

.account-stats,
.daily-chart {
  padding: 0;
}

.card-header {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.chart-container {
  padding: 20px;
  height: 250px;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 100%;
  gap: 10px;
}

.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.chart-bar {
  width: 100%;
  max-width: 60px;
  background: linear-gradient(180deg, #409eff 0%, #79bbff 100%);
  border-radius: 6px 6px 0 0;
  position: relative;
  min-height: 20px;
  transition: height 0.3s ease;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin-top: auto;
}

.bar-value {
  position: absolute;
  top: -25px;
  font-size: 14px;
  font-weight: 500;
  color: #409eff;
}

.bar-label {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .stat-card {
    padding: 15px;
    margin-bottom: 10px;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 24px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .period-card {
    margin-bottom: 10px;
  }
  
  .period-value {
    font-size: 28px;
  }
  
  .chart-container {
    height: 200px;
  }
}
</style>
