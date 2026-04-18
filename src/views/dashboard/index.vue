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
          <div class="card-desc">P0 指标实时 mock 数据</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, List, Money, RefreshLeft, Van } from '@element-plus/icons-vue'
import { getOverview } from '@/api/stats'
import { fen2yuan } from '@/utils/price'

const overview = reactive({
  todayUsers: 0,
  todayOrders: 0,
  todayGmv: 0,
  pendingRefund: 0,
  waitShipOrder: 0,
})

const cards = computed(() => ([
  { key: 'todayUsers', title: '今日新增用户', value: overview.todayUsers, icon: UserFilled },
  { key: 'todayOrders', title: '今日订单数', value: overview.todayOrders, icon: List },
  { key: 'todayGmv', title: '今日 GMV', value: `¥ ${fen2yuan(overview.todayGmv)}`, icon: Money },
  { key: 'pendingRefund', title: '待审批退款', value: overview.pendingRefund, icon: RefreshLeft },
  { key: 'waitShipOrder', title: '待发货订单', value: overview.waitShipOrder, icon: Van },
]))

async function loadOverview() {
  try {
    const data = await getOverview()
    Object.assign(overview, data)
  } catch (error) {
    ElMessage.error(error?.message || '概览数据加载失败')
  }
}

onMounted(() => {
  loadOverview()
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
</style>
