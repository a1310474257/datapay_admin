<template>
  <div class="dp-course-list">
    <SearchForm
      :model-value="searchParams"
      :schema="searchSchema"
      @update:model-value="handleSearchModelUpdate"
      @search="onSearch"
    />
    <ProTable ref="tableRef" :columns="columns" :load-data="loadData">
      <template #toolbar-left>
        <el-button v-permission="'course:create'" type="primary" @click="goCreate">新建课程</el-button>
      </template>
      <template #cover="{ row }">
        <el-image :src="row.cover" fit="cover" style="width: 72px; height: 42px; border-radius: 6px" />
      </template>
      <template #category="{ row }">
        {{ getCategoryName(row.category_id) }}
      </template>
      <template #price="{ row }">
        ¥ {{ fen2yuan(row.price) }}
      </template>
      <template #originalPrice="{ row }">
        ¥ {{ fen2yuan(row.original_price) }}
      </template>
      <template #actions="{ row }">
        <el-space>
          <el-button v-permission="'course:update'" link type="primary" @click="goEdit(row)">编辑</el-button>
          <el-button
            v-permission="'course:publish'"
            link
            type="warning"
            @click="toggleStatus(row)"
          >
            {{ Number(row.status) === 1 ? '下架' : '上架' }}
          </el-button>
          <el-button v-permission="'course:delete'" link type="danger" @click="handleDelete(row)">删除</el-button>
        </el-space>
      </template>
    </ProTable>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm from '@/components/SearchForm/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import { STATUS_ONLINE } from '@/utils/enums'
import { fen2yuan } from '@/utils/price'
import { deleteCourse, getCourseList, toggleCourseStatus } from '@/api/course'
import { useTable } from '@/hooks/useTable'
import { useDictStore } from '@/stores/dict'

const router = useRouter()
const dictStore = useDictStore()
const { tableRef, searchParams, loadData, onSearch } = useTable({
  loadApi: getCourseList,
  defaultParams: {
    keyword: '',
    category_id: '',
    teacher_id: '',
    status: '',
  },
})

const searchSchema = [
  { prop: 'keyword', label: '关键词', type: 'input', placeholder: '课程标题' },
  { prop: 'category_id', label: '分类', type: 'dict-select', dictKey: 'category' },
  { prop: 'teacher_id', label: '讲师', type: 'dict-select', dictKey: 'teacher' },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '上架', value: 1 },
      { label: '下架', value: 0 },
    ],
  },
]

const columns = [
  { prop: 'cover', label: '封面', width: 100, slot: 'cover' },
  { prop: 'title', label: '课程名称', minWidth: 200 },
  { prop: 'category_id', label: '分类', minWidth: 120, slot: 'category' },
  { prop: 'teacher_name', label: '讲师', minWidth: 130 },
  { prop: 'price', label: '售价', minWidth: 100, slot: 'price' },
  { prop: 'original_price', label: '原价', minWidth: 100, slot: 'originalPrice' },
  { prop: 'sales', label: '销量', width: 90 },
  { prop: 'status', label: '状态', width: 100, dict: STATUS_ONLINE },
  { prop: 'created_at', label: '创建时间', minWidth: 170 },
  { prop: 'actions', label: '操作', minWidth: 230, fixed: 'right', slot: 'actions' },
]

const categoryMap = computed(() =>
  (dictStore.category || []).reduce((acc, item) => {
    acc[item.id] = item.name
    return acc
  }, {}))

function getCategoryName(categoryId) {
  return categoryMap.value[categoryId] || '—'
}

function handleSearchModelUpdate(value) {
  Object.assign(searchParams, value || {})
}

function goCreate() {
  router.push('/course/detail/new')
}

function goEdit(row) {
  router.push(`/course/detail/${row.id}`)
}

async function toggleStatus(row) {
  try {
    const nextStatus = Number(row.status) === 1 ? 0 : 1
    await toggleCourseStatus(row.id, nextStatus)
    ElMessage.success(nextStatus === 1 ? '课程已上架' : '课程已下架')
    tableRef.value?.refresh()
  } catch (error) {
    ElMessage.error(error?.message || '状态更新失败')
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除课程“${row.title}”吗？`, '删除确认', { type: 'warning' })
    await deleteCourse(row.id)
    ElMessage.success('删除成功')
    tableRef.value?.refresh()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

onMounted(() => {
  dictStore.loadCategory()
  dictStore.loadTeacher()
})
</script>
