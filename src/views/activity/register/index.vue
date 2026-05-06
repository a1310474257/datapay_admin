<template>
  <div class="dp-activity-register">
    <SearchForm
      :model-value="searchParams"
      :schema="searchSchema"
      @update:model-value="handleSearchModelUpdate"
      @search="onSearch"
    />

    <ProTable
      ref="tableRef"
      :columns="columns"
      :load-data="loadData"
      selectable
      @selection-change="onSel"
    >
      <template #toolbar-left>
        <el-select v-model="exportActivityId" clearable placeholder="导出：筛选活动" style="width: 220px">
          <el-option v-for="item in activityOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button type="primary" :loading="exporting" @click="handleExport">导出报名</el-button>
        <el-button type="success" :disabled="!selection.length" @click="batchCheck">批量签到</el-button>
      </template>
      <template #toolbar-right>
        <el-input v-model="verifyCode" clearable placeholder="核销码(报名ID)" style="width: 160px" />
        <el-button @click="verify">核销</el-button>
      </template>
      <template #register_status="{ row }">
        <StatusTag :dict="REGISTER_STATUS" :value="row.register_status" />
      </template>
      <template #actions="{ row }">
        <el-button
          v-if="Number(row.register_status) === 1"
          link
          type="primary"
          @click="oneCheck(row)"
        >
          签到
        </el-button>
      </template>
    </ProTable>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import SearchForm from '@/components/SearchForm/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import { REGISTER_STATUS } from '@/utils/enums'
import {
  batchCheckinRegister,
  checkinRegister,
  createRegisterExportTask,
  getActivityList,
  getActivityRegisterList,
  getExportTask,
  verifyRegisterCode,
} from '@/api/activity'
import { useTable } from '@/hooks/useTable'

const { tableRef, searchParams, loadData, onSearch } = useTable({
  loadApi: getActivityRegisterList,
  defaultParams: {
    activity_id: '',
    register_status: '',
    keyword: '',
    created_at: [],
  },
})

const activityOptions = ref([])
const exportActivityId = ref('')
const selection = ref([])
const verifyCode = ref('')
const exporting = ref(false)

const searchSchema = reactive([
  {
    prop: 'activity_id',
    label: '活动',
    type: 'select',
    options: [],
  },
  {
    prop: 'register_status',
    label: '状态',
    type: 'select',
    options: [
      { label: '已报名', value: 1 },
      { label: '已签到', value: 2 },
    ],
  },
  { prop: 'keyword', label: '关键字', type: 'input', placeholder: '姓名/手机' },
  { prop: 'created_at', label: '报名时间', type: 'daterange', span: 8 },
])

// 注：列表按 activity_id 严格过滤，每行同一活动，因此不再展示"活动"列。
// 后端 ActivityRegisterAdminVO 不返回 activity_title 字段，强行展示会出现整列空白。
const columns = [
  { prop: 'id', label: 'ID', width: 72 },
  { prop: 'name', label: '姓名', width: 100 },
  { prop: 'phone', label: '手机', width: 120 },
  { prop: 'company', label: '公司', minWidth: 140 },
  { prop: 'userNickname', label: '微信昵称', minWidth: 120 },
  { prop: 'register_status', label: '状态', width: 100, slot: 'register_status' },
  { prop: 'verifyCode', label: '核销码', width: 120 },
  { prop: 'created_at', label: '报名时间', minWidth: 170 },
  { prop: 'actions', label: '操作', width: 100, fixed: 'right', slot: 'actions' },
]

function handleSearchModelUpdate(value) {
  Object.assign(searchParams, value || {})
}

function onSel(rows) {
  selection.value = rows
}

async function oneCheck(row) {
  await checkinRegister(row)
  ElMessage.success('已签到')
  tableRef.value?.refresh()
}

async function batchCheck() {
  await batchCheckinRegister(selection.value)
  ElMessage.success('批量签到完成')
  tableRef.value?.refresh()
}

async function verify() {
  const aid = searchParams.activity_id || exportActivityId.value
  if (!aid) {
    ElMessage.warning('请先在筛选中选择活动')
    return
  }
  await verifyRegisterCode(aid, verifyCode.value)
  ElMessage.success('核销成功')
  tableRef.value?.refresh()
}

async function handleExport() {
  exporting.value = true
  try {
    const { taskId } = await createRegisterExportTask({
      activity_id: exportActivityId.value || searchParams.activity_id,
    })
    const poll = async () => {
      const task = await getExportTask(taskId)
      if (task.status === 'done' && task.downloadText) {
        const blob = new Blob([task.downloadText], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = task.fileName || 'export.csv'
        a.click()
        URL.revokeObjectURL(url)
        ElMessage.success('导出完成')
        exporting.value = false
      } else if (task.status === 'failed') {
        ElMessage.error(task.message || '导出失败')
        exporting.value = false
      } else {
        setTimeout(poll, 500)
      }
    }
    poll()
  } catch (e) {
    exporting.value = false
    ElMessage.error(e?.message || '导出失败')
  }
}

onMounted(async () => {
  // 真实活动下拉：之前误用了 @/mock 的内存 db，导致下拉里全是假活动，
  // 选中后 activityId 与库里的活动对不上，注册名单就显示为空（"异常"）。
  try {
    const { list } = await getActivityList({ page: 1, pageSize: 100 })
    activityOptions.value = (list || []).map((a) => ({ label: a.title, value: a.id }))
  } catch (e) {
    activityOptions.value = []
    ElMessage.warning('活动列表加载失败：' + (e?.message || '请稍后重试'))
  }
  const idx = searchSchema.findIndex((s) => s.prop === 'activity_id')
  if (idx >= 0) searchSchema[idx].options = activityOptions.value
  exportActivityId.value = searchParams.activity_id || ''
})
</script>
