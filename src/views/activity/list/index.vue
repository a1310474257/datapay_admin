<template>
  <div class="dp-activity-list">
    <!-- 页头：模块标题 + 简介，与资源管理页保持视觉一致 -->
    <el-card class="page-header" shadow="never">
      <div class="header-bar">
        <div class="header-title">
          <span class="title">活动管理</span>
          <span class="subtitle">线下/线上活动报名与签到</span>
        </div>
      </div>
    </el-card>

    <SearchForm
      :model-value="searchParams"
      :schema="searchSchema"
      @update:model-value="handleSearchModelUpdate"
      @search="onSearch"
    />

    <el-card class="stats-card" shadow="never">
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-label">当前结果</div>
          <div class="stat-value">{{ stats.total }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">上架活动</div>
          <div class="stat-value">{{ stats.online }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">报名中</div>
          <div class="stat-value">{{ stats.enrolling }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">今日活动</div>
          <div class="stat-value">{{ stats.today }}</div>
        </div>
      </div>
    </el-card>

    <ProTable ref="tableRef" :columns="columns" :load-data="loadData">
      <template #toolbar-left>
        <el-button v-permission="'activity:create'" type="primary" @click="goEdit('new')">
          新建活动
        </el-button>
      </template>

      <!-- 封面：objectKey 必须经 resolveMediaPreviewUrl 转换为代理地址 -->
      <template #cover="{ row }">
        <el-image
          :src="resolveMediaPreviewUrl(row.cover)"
          fit="cover"
          style="width: 60px; height: 60px; border-radius: 6px"
          :preview-src-list="row.cover ? [resolveMediaPreviewUrl(row.cover)] : []"
          preview-teleported
          hide-on-click-modal
        />
      </template>

      <!-- 活动进行状态（前端根据活动日期计算：未开始 / 报名中 / 已结束） -->
      <template #activity_status="{ row }">
        <StatusTag :dict="ACTIVITY_STATUS" :value="row.activity_status" />
      </template>

      <!-- 票价格式化：分 → 元 -->
      <template #price="{ row }">
        <span>{{ Number(row.price) === 0 ? '免费' : `¥ ${fen2yuan(row.price)}` }}</span>
      </template>

      <!-- 时间段 -->
      <template #time_range="{ row }">
        <span>{{ row.time_range || '-' }}</span>
      </template>

      <!-- 地点 -->
      <template #location="{ row }">
        <span>{{ row.location || '-' }}</span>
      </template>

      <!-- 报名人数 / 限额合并展示 -->
      <template #enroll="{ row }">
        <span>
          {{ row.enrolled_count ?? 0 }}
          <span class="enroll-sep">/</span>
          <span class="enroll-limit">{{ row.limit_count === 0 ? '不限' : row.limit_count }}</span>
        </span>
      </template>

      <!-- 操作按钮 -->
      <template #actions="{ row }">
        <el-space>
          <el-button link type="primary" @click="goRegister(row.id)">
            报名管理
          </el-button>
          <el-button v-permission="'activity:update'" link type="primary" @click="goEdit(row.id)">
            编辑
          </el-button>
          <el-button v-permission="'activity:delete'" link type="danger" @click="handleDelete(row)">
            删除
          </el-button>
        </el-space>
      </template>
    </ProTable>
  </div>
</template>

<script setup>
import dayjs from 'dayjs'
import { computed, onActivated, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm from '@/components/SearchForm/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import { ACTIVITY_STATUS, STATUS_ONLINE } from '@/utils/enums'
import { resolveMediaPreviewUrl } from '@/utils/mediaUrl'
import { fen2yuan } from '@/utils/price'
import { deleteActivity, getActivityList } from '@/api/activity'
import { useTable } from '@/hooks/useTable'

const router = useRouter()
const route = useRoute()

const { tableRef, searchParams, onSearch } = useTable({
  loadApi: getActivityList,
  defaultParams: { keyword: '', status: '', activity_status: '', activity_date: [] },
})
const pageRows = ref([])

const searchSchema = [
  { prop: 'keyword', label: '标题', type: 'input' },
  {
    prop: 'activity_date',
    label: '活动日期',
    type: 'daterange',
    valueFormat: 'YYYY-MM-DD',
  },
  {
    prop: 'activity_status',
    label: '活动状态',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '未开始', value: 'upcoming' },
      { label: '报名中', value: 'enrolling' },
      { label: '已结束', value: 'ended' },
    ],
  },
  {
    prop: 'status',
    label: '上架状态',
    type: 'select',
    options: [
      { label: '上架', value: 1 },
      { label: '下架', value: 0 },
    ],
  },
]

const columns = [
  { prop: 'id', label: 'ID', width: 72 },
  { prop: 'cover', label: '封面', width: 84, slot: 'cover' },
  { prop: 'title', label: '标题', minWidth: 160, showOverflowTooltip: true },
  { prop: 'activity_date', label: '活动日期', width: 112 },
  { prop: 'time_range', label: '时间段', minWidth: 120, slot: 'time_range' },
  { prop: 'location', label: '地点', minWidth: 150, slot: 'location', showOverflowTooltip: true },
  { prop: 'activity_status', label: '活动状态', width: 100, slot: 'activity_status' },
  { prop: 'price', label: '票价', width: 100, slot: 'price' },
  { prop: 'enroll', label: '报名/限额', width: 100, slot: 'enroll' },
  { prop: 'status', label: '上架', width: 80, dict: STATUS_ONLINE },
  { prop: 'update_time', label: '更新时间', minWidth: 160, showOverflowTooltip: true },
  { prop: 'actions', label: '操作', width: 190, fixed: 'right', slot: 'actions' },
]

function handleSearchModelUpdate(value) {
  Object.assign(searchParams, value || {})
}

function goEdit(id) {
  router.push(`/activity/detail/${id}`)
}

function goRegister(id) {
  router.push(`/activity/detail/${id}?tab=register`)
}

async function loadData(params) {
  const result = await getActivityList({ ...searchParams, ...params })
  let list = result?.list || []
  if (searchParams.activity_status) {
    list = list.filter((item) => item.activity_status === searchParams.activity_status)
  }
  pageRows.value = list
  return {
    ...result,
    list,
    total: searchParams.activity_status ? list.length : result.total,
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.title}」？`, '提示', { type: 'warning' })
    await deleteActivity(row.id)
    ElMessage.success('已删除')
    tableRef.value?.refresh()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.message || '删除失败')
  }
}

const stats = computed(() => {
  const rows = pageRows.value
  const today = dayjs().format('YYYY-MM-DD')
  const total = rows.length
  const online = rows.filter((item) => Number(item.status) === 1).length
  const enrolling = rows.filter((item) => item.activity_status === 'enrolling').length
  const todayCount = rows.filter((item) => item.activity_date === today).length
  return {
    total,
    online,
    enrolling,
    today: todayCount,
  }
})

// 列表页被 keep-alive 缓存：从详情页返回时不会触发 onMounted，
// 这里用 onActivated 在再次激活时刷新一次，保证编辑/新建后看到最新数据。
onActivated(() => {
  tableRef.value?.refresh()
})

// 详情页返回时会携带时间戳参数，这里监听后立即刷新，确保用户可见的是最新列表。
watch(
  () => route.query.t,
  (value) => {
    if (value) tableRef.value?.refresh()
  },
)
</script>

<style scoped>
/* 页头卡片 */
.page-header {
  margin-bottom: 12px;
}

.stats-card {
  margin-bottom: 12px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-item {
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  padding: 10px 12px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.stat-value {
  margin-top: 2px;
  font-size: 20px;
  font-weight: 600;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.header-title {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.header-title .title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-title .subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

/* 报名人数 / 限额分隔符 */
.enroll-sep {
  margin: 0 3px;
  color: var(--el-text-color-secondary);
}

/* 限额数字颜色区分 */
.enroll-limit {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

@media (max-width: 960px) {
  .stats-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
