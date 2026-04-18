<template>
  <div class="dp-activity-list">
    <SearchForm
      :model-value="searchParams"
      :schema="searchSchema"
      @update:model-value="handleSearchModelUpdate"
      @search="onSearch"
    />
    <ProTable ref="tableRef" :columns="columns" :load-data="loadData">
      <template #toolbar-left>
        <el-button v-permission="'activity:create'" type="primary" @click="goDetail('new')">新建活动</el-button>
      </template>
      <template #cover="{ row }">
        <el-image :src="row.cover" style="width: 56px; height: 56px; border-radius: 6px" />
      </template>
      <template #activity_status="{ row }">
        <StatusTag :dict="ACTIVITY_STATUS" :value="row.activity_status" />
      </template>
      <template #price="{ row }">¥ {{ fen2yuan(row.price) }}</template>
      <template #actions="{ row }">
        <el-space>
          <el-button link type="primary" @click="goDetail(row.id)">详情</el-button>
          <el-button v-permission="'activity:delete'" link type="danger" @click="handleDelete(row)">删除</el-button>
        </el-space>
      </template>
    </ProTable>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm from '@/components/SearchForm/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import { ACTIVITY_STATUS, STATUS_ONLINE } from '@/utils/enums'
import { fen2yuan } from '@/utils/price'
import { deleteActivity, getActivityList } from '@/api/activity'
import { useTable } from '@/hooks/useTable'

const router = useRouter()

const { tableRef, searchParams, loadData, onSearch } = useTable({
  loadApi: getActivityList,
  defaultParams: { keyword: '', status: '' },
})

const searchSchema = [
  { prop: 'keyword', label: '标题', type: 'input' },
  {
    prop: 'status',
    label: '上架',
    type: 'select',
    options: [
      { label: '上架', value: 1 },
      { label: '下架', value: 0 },
    ],
  },
]

const columns = [
  { prop: 'id', label: 'ID', width: 72 },
  { prop: 'cover', label: '封面', width: 90, slot: 'cover' },
  { prop: 'title', label: '标题', minWidth: 160 },
  { prop: 'activity_date', label: '活动日', width: 120 },
  { prop: 'activity_status', label: '状态', width: 110, slot: 'activity_status' },
  { prop: 'price', label: '票价', width: 110, slot: 'price' },
  { prop: 'enrolled_count', label: '已报名', width: 90 },
  { prop: 'limit_count', label: '限额', width: 90 },
  { prop: 'status', label: '上架', width: 90, dict: STATUS_ONLINE },
  { prop: 'actions', label: '操作', width: 160, fixed: 'right', slot: 'actions' },
]

function handleSearchModelUpdate(value) {
  Object.assign(searchParams, value || {})
}

function goDetail(id) {
  router.push(`/activity/detail/${id}`)
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
</script>
