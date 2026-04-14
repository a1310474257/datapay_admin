<template>
  <div class="dashboard">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-left">
        <div class="greeting">
          <span class="greeting-icon">{{ greetingIcon }}</span>
          <div>
            <h2>{{ greetingText }}，{{ userStore.userInfo?.name }}！</h2>
            <p>{{ todayDate }} &nbsp;·&nbsp; 今天也要加油哦 ✨</p>
          </div>
        </div>
      </div>
      <div class="welcome-right">
        <div class="quick-stats">
          <div class="qs-item">
            <span class="qs-value">{{ onlineUsers }}</span>
            <span class="qs-label">在线用户</span>
          </div>
          <div class="qs-divider"></div>
          <div class="qs-item">
            <span class="qs-value">{{ pendingOrders }}</span>
            <span class="qs-label">待处理</span>
          </div>
          <div class="qs-divider"></div>
          <div class="qs-item">
            <span class="qs-value">{{ systemStatus }}</span>
            <span class="qs-label">系统状态</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6" v-for="card in statCards" :key="card.label">
        <div class="stat-card" :style="{ background: card.gradient }">
          <div class="stat-info">
            <p class="stat-label">{{ card.label }}</p>
            <p class="stat-value">{{ card.value }}</p>
            <p class="stat-trend" :class="card.trendUp ? 'up' : 'down'">
              <el-icon><component :is="card.trendUp ? 'Top' : 'Bottom'" /></el-icon>
              较昨日 {{ card.trend }}
            </p>
          </div>
          <div class="stat-icon-wrap">
            <el-icon size="36">
              <component :is="card.icon" />
            </el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :lg="16" :md="24">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">交易趋势</span>
              <el-radio-group v-model="trendRange" size="small">
                <el-radio-button label="week">近7天</el-radio-button>
                <el-radio-button label="month">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="lineChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :lg="8" :md="24">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">交易类型分布</span>
            </div>
          </template>
          <div ref="pieChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 下方两栏 -->
    <el-row :gutter="20" class="bottom-row">
      <!-- 最近交易 -->
      <el-col :lg="16" :md="24">
        <el-card shadow="never" class="table-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">最近交易记录</span>
              <el-button type="primary" link size="small">
                查看全部 <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          <el-table :data="recentTx" stripe style="width:100%">
            <el-table-column prop="id" label="交易ID" width="150">
              <template #default="{ row }">
                <span class="tx-id">{{ row.id }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="user" label="用户" width="120" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="typeTagMap[row.type]" size="small" round>{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额">
              <template #default="{ row }">
                <span class="amount-text">¥ {{ row.amount }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <div class="status-dot-wrap">
                  <span class="status-dot" :class="row.status === '成功' ? 'success' : row.status === '处理中' ? 'pending' : 'fail'"></span>
                  {{ row.status }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="time" label="时间" min-width="160" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 快捷入口 + 系统公告 -->
      <el-col :lg="8" :md="24">
        <el-card shadow="never" class="quick-entry-card">
          <template #header>
            <span class="card-title">快捷入口</span>
          </template>
          <div class="quick-entries">
            <div class="qe-item" v-for="entry in quickEntries" :key="entry.label">
              <div class="qe-icon" :style="{ background: entry.bg }">
                <el-icon size="20" :color="entry.color">
                  <component :is="entry.icon" />
                </el-icon>
              </div>
              <span>{{ entry.label }}</span>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="notice-card" style="margin-top:20px">
          <template #header>
            <span class="card-title">系统公告</span>
          </template>
          <div class="notice-list">
            <div class="notice-item" v-for="n in notices" :key="n.id">
              <span class="notice-tag" :class="n.type">{{ n.tag }}</span>
              <span class="notice-text">{{ n.text }}</span>
              <span class="notice-time">{{ n.time }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import * as echarts from 'echarts'

const userStore = useUserStore()

// 问候语
const hour = new Date().getHours()
const greetingIcon = hour < 12 ? '🌅' : hour < 18 ? '☀️' : '🌙'
const greetingText = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'

const todayDate = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
})

const onlineUsers = ref('1,284')
const pendingOrders = ref('142')
const systemStatus = ref('正常')
const trendRange = ref('week')

const statCards = [
  {
    label: '总用户数', value: '24,521', trend: '+12.5%', trendUp: true,
    icon: 'UserFilled', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    label: '今日交易额', value: '¥328,940', trend: '+8.2%', trendUp: true,
    icon: 'Wallet', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    label: '待处理订单', value: '142', trend: '-3.1%', trendUp: false,
    icon: 'List', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    label: '今日收益', value: '¥12,840', trend: '+5.6%', trendUp: true,
    icon: 'TrendCharts', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  }
]

const recentTx = [
  { id: 'TX20260414001', user: '张三', type: '充值', amount: '500.00', status: '成功', time: '2026-04-14 10:23:11' },
  { id: 'TX20260414002', user: '李四', type: '提现', amount: '1,200.00', status: '处理中', time: '2026-04-14 10:18:45' },
  { id: 'TX20260414003', user: '王五', type: '转账', amount: '350.00', status: '成功', time: '2026-04-14 09:55:30' },
  { id: 'TX20260414004', user: '赵六', type: '充值', amount: '2,000.00', status: '成功', time: '2026-04-14 09:40:12' },
  { id: 'TX20260414005', user: '孙七', type: '退款', amount: '88.00', status: '失败', time: '2026-04-14 09:12:08' },
  { id: 'TX20260414006', user: '周八', type: '转账', amount: '760.00', status: '成功', time: '2026-04-14 08:58:33' }
]

const typeTagMap = {
  '充值': 'success',
  '提现': 'warning',
  '转账': '',
  '退款': 'danger'
}

const quickEntries = [
  { label: '新增用户', icon: 'UserFilled', bg: '#eef2ff', color: '#6366f1' },
  { label: '交易记录', icon: 'List', bg: '#fdf4ff', color: '#a855f7' },
  { label: '账单管理', icon: 'Tickets', bg: '#fff7ed', color: '#f97316' },
  { label: '风控配置', icon: 'Shield', bg: '#f0fdf4', color: '#22c55e' },
  { label: '数据报表', icon: 'TrendCharts', bg: '#eff6ff', color: '#3b82f6' },
  { label: '系统设置', icon: 'Setting', bg: '#fff1f2', color: '#f43f5e' },
]

const notices = [
  { id: 1, tag: '更新', type: 'update', text: '系统已升级到 v1.2.0，新增风控模块', time: '今天' },
  { id: 2, tag: '维护', type: 'maintain', text: '计划于本周日凌晨2-4点进行例行维护', time: '昨天' },
  { id: 3, tag: '公告', type: 'notice', text: '新的提现手续费规则将于下月生效', time: '3天前' },
]

// ECharts
const lineChartRef = ref()
const pieChartRef = ref()
let lineChart = null
let pieChart = null

const weekData = {
  xAxis: ['04-08', '04-09', '04-10', '04-11', '04-12', '04-13', '04-14'],
  income: [12400, 18600, 15200, 23000, 19800, 28400, 32894],
  orders: [120, 185, 152, 230, 198, 284, 328]
}

const monthData = {
  xAxis: Array.from({ length: 30 }, (_, i) => `03-${String(i + 15).padStart(2, '0')}`),
  income: Array.from({ length: 30 }, () => Math.floor(Math.random() * 30000 + 10000)),
  orders: Array.from({ length: 30 }, () => Math.floor(Math.random() * 300 + 100))
}

function initLineChart() {
  if (!lineChartRef.value) return
  lineChart = echarts.init(lineChartRef.value)
  updateLineChart()
}

function updateLineChart() {
  const data = trendRange.value === 'week' ? weekData : monthData
  lineChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['交易额', '订单量'], bottom: 0, textStyle: { color: '#6b7280' } },
    grid: { top: 20, right: 20, bottom: 40, left: 60 },
    xAxis: {
      type: 'category',
      data: data.xAxis,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af', fontSize: 11 }
    },
    yAxis: [
      {
        type: 'value',
        name: '交易额(元)',
        nameTextStyle: { color: '#9ca3af', fontSize: 11 },
        axisLabel: { color: '#9ca3af', fontSize: 11, formatter: v => v >= 10000 ? v / 10000 + 'w' : v },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLine: { show: false }
      },
      {
        type: 'value',
        name: '订单量',
        nameTextStyle: { color: '#9ca3af', fontSize: 11 },
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { show: false },
        axisLine: { show: false }
      }
    ],
    series: [
      {
        name: '交易额',
        type: 'line',
        smooth: true,
        data: data.income,
        lineStyle: { color: '#6366f1', width: 2.5 },
        itemStyle: { color: '#6366f1' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(99,102,241,0.2)' },
            { offset: 1, color: 'rgba(99,102,241,0.02)' }
          ])
        },
        symbol: 'circle',
        symbolSize: 5
      },
      {
        name: '订单量',
        type: 'bar',
        yAxisIndex: 1,
        data: data.orders,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#a5b4fc' },
            { offset: 1, color: '#c7d2fe' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '40%'
      }
    ]
  })
}

function initPieChart() {
  if (!pieChartRef.value) return
  pieChart = echarts.init(pieChartRef.value)
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { color: '#6b7280' } },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' }
      },
      data: [
        { value: 4820, name: '充值', itemStyle: { color: '#6366f1' } },
        { value: 3240, name: '提现', itemStyle: { color: '#f59e0b' } },
        { value: 2180, name: '转账', itemStyle: { color: '#10b981' } },
        { value: 860, name: '退款', itemStyle: { color: '#ef4444' } }
      ]
    }]
  })
}

function handleResize() {
  lineChart?.resize()
  pieChart?.resize()
}

watch(trendRange, () => updateLineChart())

onMounted(() => {
  setTimeout(() => {
    initLineChart()
    initPieChart()
    window.addEventListener('resize', handleResize)
  }, 300)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  lineChart?.dispose()
  pieChart?.dispose()
})
</script>

<style lang="scss" scoped>
.dashboard {
  .welcome-banner {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%);
    border-radius: 16px;
    padding: 28px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);

    .greeting {
      display: flex;
      align-items: center;
      gap: 16px;

      .greeting-icon {
        font-size: 40px;
      }

      h2 {
        font-size: 22px;
        font-weight: 700;
        color: #fff;
        margin-bottom: 4px;
      }

      p {
        color: rgba(255, 255, 255, 0.75);
        font-size: 13px;
      }
    }

    .quick-stats {
      display: flex;
      align-items: center;
      gap: 24px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 16px 28px;

      .qs-item {
        text-align: center;

        .qs-value {
          display: block;
          font-size: 20px;
          font-weight: 700;
          color: #fff;
        }

        .qs-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 2px;
          display: block;
        }
      }

      .qs-divider {
        width: 1px;
        height: 36px;
        background: rgba(255, 255, 255, 0.2);
      }
    }
  }

  .stat-row {
    margin-bottom: 20px;
  }

  .stat-card {
    border-radius: 16px;
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: default;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    }

    .stat-info {
      .stat-label {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 26px;
        font-weight: 800;
        color: #fff;
        margin-bottom: 8px;
        letter-spacing: 1px;
      }

      .stat-trend {
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 3px;

        &.up { color: rgba(255, 255, 255, 0.9); }
        &.down { color: rgba(255, 200, 200, 0.9); }
      }
    }

    .stat-icon-wrap {
      width: 64px;
      height: 64px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .chart-row {
    margin-bottom: 20px;
  }

  .chart-card {
    :deep(.el-card__header) { padding: 16px 20px; border-bottom: 1px solid #f3f4f6; }
    :deep(.el-card__body) { padding: 16px 20px; }
  }

  .chart-container {
    height: 280px;
    width: 100%;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
    }
  }

  .bottom-row {
    margin-bottom: 0;
  }

  .table-card {
    :deep(.el-card__header) { padding: 16px 20px; }
    :deep(.el-card__body) { padding: 0; }

    .tx-id {
      font-family: monospace;
      font-size: 12px;
      color: #6366f1;
    }

    .amount-text {
      font-weight: 600;
      color: #10b981;
    }

    .status-dot-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      display: inline-block;

      &.success { background: #10b981; }
      &.pending { background: #f59e0b; }
      &.fail { background: #ef4444; }
    }
  }

  .quick-entry-card {
    :deep(.el-card__body) { padding: 16px; }

    .quick-entries {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;

      .qe-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 14px 8px;
        border-radius: 10px;
        cursor: pointer;
        transition: background 0.2s;
        font-size: 12px;
        color: #4b5563;

        &:hover {
          background: #f9fafb;
        }

        .qe-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
  }

  .notice-card {
    :deep(.el-card__body) { padding: 8px 0; }

    .notice-list {
      .notice-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 20px;
        border-bottom: 1px solid #f9fafb;
        transition: background 0.2s;

        &:last-child { border-bottom: none; }
        &:hover { background: #fafafa; }

        .notice-tag {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          flex-shrink: 0;
          font-weight: 600;

          &.update { background: #eef2ff; color: #6366f1; }
          &.maintain { background: #fff7ed; color: #f97316; }
          &.notice { background: #f0fdf4; color: #22c55e; }
        }

        .notice-text {
          flex: 1;
          font-size: 13px;
          color: #374151;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .notice-time {
          font-size: 11px;
          color: #d1d5db;
          flex-shrink: 0;
        }
      }
    }
  }
}
</style>
