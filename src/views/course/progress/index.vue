<template>
  <div class="dp-course-progress">
    <SearchForm
      :model-value="searchParams"
      :schema="searchSchema"
      @update:model-value="handleSearchModelUpdate"
      @search="onSearch"
    />
    <ProTable ref="tableRef" :columns="columns" :load-data="loadData">
      <template #progress_pct="{ row }">{{ row.progress_pct }}%</template>
      <template #actions="{ row }">
        <el-button link type="primary" @click="openDrawer(row)">课时明细</el-button>
      </template>
    </ProTable>

    <el-drawer v-model="drawerVisible" title="课时进度" size="520px" destroy-on-close>
      <el-table v-loading="lessonLoading" :data="lessonRows" border size="small">
        <el-table-column prop="title" label="课时" min-width="160" />
        <el-table-column label="观看(秒)" width="100">
          <template #default="{ row }">{{ row.watched_sec }} / {{ row.duration_sec }}</template>
        </el-table-column>
        <el-table-column prop="is_finished" label="完成" width="80">
          <template #default="{ row }">{{ row.is_finished ? '是' : '否' }}</template>
        </el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import SearchForm from '@/components/SearchForm/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import { getStudyProgressList, getStudyProgressLessons } from '@/api/learning'
import { useDictStore } from '@/stores/dict'
import { useTable } from '@/hooks/useTable'

const dictStore = useDictStore()

const { tableRef, searchParams, loadData, onSearch } = useTable({
  loadApi: getStudyProgressList,
  defaultParams: {
    course_id: '',
    user_id: '',
    progress_min: '',
    progress_max: '',
  },
})

const searchSchema = ref([
  { prop: 'user_id', label: '用户ID', type: 'input' },
  { prop: 'course_id', label: '课程', type: 'select', options: [] },
  { prop: 'progress_min', label: '进度≥', type: 'input' },
  { prop: 'progress_max', label: '进度≤', type: 'input' },
])

const columns = [
  { prop: 'user_nickname', label: '用户', minWidth: 120 },
  { prop: 'course_title', label: '课程', minWidth: 160 },
  { prop: 'learned_sections', label: '已学章节数', width: 120 },
  { prop: 'progress_pct', label: '进度', width: 100, slot: 'progress_pct' },
  { prop: 'last_learn_at', label: '最近学习', minWidth: 170 },
  { prop: 'actions', label: '操作', width: 120, fixed: 'right', slot: 'actions' },
]

const drawerVisible = ref(false)
const lessonLoading = ref(false)
const lessonRows = ref([])
const currentRow = ref(null)

function handleSearchModelUpdate(value) {
  Object.assign(searchParams, value || {})
}

async function openDrawer(row) {
  currentRow.value = row
  drawerVisible.value = true
  lessonLoading.value = true
  try {
    lessonRows.value = await getStudyProgressLessons(row.user_id, row.course_id)
  } finally {
    lessonLoading.value = false
  }
}

onMounted(async () => {
  await dictStore.loadCategory()
  const courses = window.__db?.course || []
  const idx = searchSchema.value.findIndex((s) => s.prop === 'course_id')
  if (idx >= 0) {
    searchSchema.value[idx].options = courses.map((c) => ({ label: c.title, value: c.id }))
  }
})
</script>
