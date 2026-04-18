<template>
  <div class="dp-dashboard">
    <el-row :gutter="12">
      <el-col v-for="card in cards" :key="card.key" :xl="4" :lg="8" :md="8" :sm="12" :xs="24">
        <el-card shadow="hover" class="card-item">
          <div class="card-head">
            <el-icon><component :is="card.icon" /></el-icon>
            <span>{{ card.title }}</span>
          </div>
          <div class="card-value">{{ card.value }}</div>
          <div class="card-desc">指标来自 mock 聚合</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" class="chart-row">
      <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
        <EChartCard title="近 30 天 GMV（元）" :option="gmvOption" :loading="chartLoading" :height="320" />
      </el-col>
      <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
        <EChartCard title="订单类型分布" :option="pieOption" :loading="chartLoading" :height="320" />
      </el-col>
      <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
        <EChartCard title="Top10 课程销售额（元）" :option="barOption" :loading="chartLoading" :height="320" />
      </el-col>
      <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
        <EChartCard title="热门活动报名率" :option="funnelOption" :loading="chartLoading" :height="320" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, List, Money, RefreshLeft, Van } from '@element-plus/icons-vue'
import EChartCard from '@/components/EChartCard/index.vue'
import {
  getActivityFunnel,
  getGmvTrend,
  getOrderTypeDistribution,
  getOverview,
  getTopCourses,
} from '@/api/stats'
import { fen2yuan } from '@/utils/price'

const overview = reactive({
  todayUsers: 0,
  todayOrders: 0,
  todayGmv: 0,
  pendingRefund: 0,
  waitShipOrder: 0,
})

const cards = computed(() => [
  { key: 'todayUsers', title: '今日新增用户', value: overview.todayUsers, icon: UserFilled },
  { key: 'todayOrders', title: '今日订单数', value: overview.todayOrders, icon: List },
  { key: 'todayGmv', title: '今日 GMV', value: `¥ ${fen2yuan(overview.todayGmv)}`, icon: Money },
  { key: 'pendingRefund', title: '待审批退款', value: overview.pendingRefund, icon: RefreshLeft },
  { key: 'waitShipOrder', title: '待发货订单', value: overview.waitShipOrder, icon: Van },
])

const chartLoading = ref(false)
const gmvOption = ref({})
const pieOption = ref({})
const barOption = ref({})
const funnelOption = ref({})

async function loadOverview() {
  try {
    const data = await getOverview()
    Object.assign(overview, data)
  } catch (error) {
    ElMessage.error(error?.message || '概览数据加载失败')
  }
}

async function loadCharts() {
  chartLoading.value = true
  try {
    const [gmv, pie, top, funnel] = await Promise.all([
      getGmvTrend(),
      getOrderTypeDistribution(),
      getTopCourses(),
      getActivityFunnel(),
    ])

    gmvOption.value = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: gmv.dates },
      yAxis: { type: 'value' },
      series: [{ type: 'line', smooth: true, data: gmv.values }],
    }

    pieOption.value = {
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: '60%',
          data: pie.map((item) => ({ name: item.name, value: item.value })),
        },
      ],
    }

    barOption.value = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: top.map((t) => t.title) },
      series: [{ type: 'bar', data: top.map((t) => t.amountYuan) }],
    }

    funnelOption.value = {
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'funnel',
          data: funnel.map((f) => ({ name: f.name, value: f.rate })),
        },
      ],
    }
  } catch (e) {
    ElMessage.error(e?.message || '图表加载失败')
  } finally {
    chartLoading.value = false
  }
}

onMounted(() => {
  loadOverview()
  loadCharts()
})
</script>

<style scoped>
.dp-dashboard {
  width: 100%;
}

.card-item {
  margin-bottom: 12px;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
}

.card-value {
  margin-top: 10px;
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.card-desc {
  margin-top: 8px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.chart-row {
  margin-top: 4px;
}
</style>
