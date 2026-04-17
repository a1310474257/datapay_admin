<template>
  <div class="dp-pro-table">
    <div class="toolbar">
      <div class="toolbar-left">
        <slot name="toolbar-left" />
      </div>
      <div class="toolbar-right">
        <slot name="toolbar-right" />
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="tableData"
      :row-key="rowKey"
      :border="border"
      :stripe="stripe"
      :default-sort="defaultSort"
      @sort-change="handleSortChange"
      @selection-change="handleSelectionChange"
    >
      <el-table-column v-if="selectable" type="selection" width="48" />

      <el-table-column
        v-for="column in columns"
        :key="`col-${column.prop || column.slot}`"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth"
        :align="column.align || 'left'"
        :fixed="column.fixed"
        :sortable="column.sortable ? 'custom' : false"
      >
        <template #default="scope">
          <slot
            v-if="column.slot"
            :name="column.slot"
            :row="scope.row"
            :$index="scope.$index"
          />
          <StatusTag
            v-else-if="column.dict"
            :dict="column.dict"
            :value="scope.row[column.prop]"
          />
          <span v-else-if="column.formatter">
            {{ column.formatter(scope.row, column, scope.row[column.prop]) }}
          </span>
          <span v-else>
            {{ scope.row[column.prop] ?? '—' }}
          </span>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="load"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import StatusTag from '@/components/StatusTag/index.vue'

const props = defineProps({
  columns: {
    type: Array,
    default: () => [],
  },
  loadData: {
    type: Function,
    required: true,
  },
  selectable: {
    type: Boolean,
    default: false,
  },
  rowKey: {
    type: String,
    default: 'id',
  },
  defaultSort: {
    type: Object,
    default: () => ({}),
  },
  border: {
    type: Boolean,
    default: true,
  },
  stripe: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['selection-change'])

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const sort = ref('')
const extraParams = ref({})

function normalizeSort() {
  if (!props.defaultSort?.prop || !props.defaultSort?.order) return ''
  const order = props.defaultSort.order === 'ascending' ? 'asc' : 'desc'
  return `${props.defaultSort.prop},${order}`
}

sort.value = normalizeSort()

async function load() {
  loading.value = true
  try {
    const payload = {
      page: page.value,
      pageSize: pageSize.value,
      sort: sort.value,
      ...extraParams.value,
    }
    const result = await props.loadData(payload)
    tableData.value = result?.list || []
    total.value = Number(result?.total || 0)
    page.value = Number(result?.page || page.value)
    pageSize.value = Number(result?.pageSize || pageSize.value)
  } catch (error) {
    ElMessage.error(error?.message || '列表加载失败')
  } finally {
    loading.value = false
  }
}

function refresh() {
  page.value = 1
  load()
}

function setParams(params = {}) {
  extraParams.value = { ...params }
}

function handleSortChange({ prop, order }) {
  if (!prop || !order) {
    sort.value = ''
  } else {
    sort.value = `${prop},${order === 'ascending' ? 'asc' : 'desc'}`
  }
  page.value = 1
  load()
}

function handleSizeChange() {
  page.value = 1
  load()
}

function handleSelectionChange(rows) {
  emit('selection-change', rows)
}

defineExpose({
  refresh,
  setParams,
  load,
})

onMounted(() => {
  load()
})
</script>

<style scoped>
.dp-pro-table {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  min-height: 32px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
