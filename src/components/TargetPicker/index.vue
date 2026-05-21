<template>
  <div class="dp-target-picker">
    <el-input :model-value="title" readonly placeholder="点击选择跳转目标" @click="open">
      <template #append>
        <el-button @click="open">选择</el-button>
      </template>
    </el-input>

    <el-dialog v-model="visible" :title="dialogTitle" width="720px" destroy-on-close @open="onOpen">
      <div class="toolbar">
        <el-input v-model="keyword" clearable placeholder="搜索标题" @keyup.enter="refresh" />
        <el-button type="primary" @click="refresh">搜索</el-button>
      </div>
      <el-table :data="list" border height="360" @row-click="handleRowClick">
        <el-table-column prop="id" label="ID" width="72" />
        <el-table-column prop="title" label="标题" min-width="220" />
      </el-table>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        layout="total, prev, pager, next"
        :total="total"
        small
        @current-change="load"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { searchBannerTargets } from '@/api/banner'

const id = defineModel('id', { type: [Number, String], default: null })
const title = defineModel('title', { type: String, default: '' })

const props = defineProps({
  /** 1-课程 2-资源 3-商品 4-活动 */
  type: { type: Number, required: true },
  /** 资源子类型：1-HR工具 2-调研报告，仅在 type=2 时生效 */
  resourceType: { type: [Number, null], default: null },
})

const visible = ref(false)
const keyword = ref('')
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const dialogTitle = computed(() => {
  const resourceTitleMap = { 1: '选择 HR 工具', 2: '选择调研报告' }
  const map = { 1: '选择课程', 2: resourceTitleMap[Number(props.resourceType)] || '选择资源', 3: '选择商品', 4: '选择活动' }
  return map[props.type] || '选择目标'
})

// 仅在类型或资源子类型发生变化时清空已选目标，避免错绑。
// mounted 之前为 false，防止在 Dialog 打开时由初始 props 赋值触发误清空。
const _isMounted = ref(false)
onMounted(() => { _isMounted.value = true })

watch(
  () => [props.type, props.resourceType],
  () => {
    if (!_isMounted.value) return
    id.value = null
    title.value = ''
  },
)

function open() {
  visible.value = true
}

function onOpen() {
  keyword.value = ''
  page.value = 1
  load()
}

async function load() {
  const res = await searchBannerTargets(props.type, {
    keyword: keyword.value,
    page: page.value,
    pageSize: pageSize.value,
    resourceType: props.resourceType,
  })
  list.value = res.list || []
  total.value = res.total || 0
}

function refresh() {
  page.value = 1
  load()
}

function handleRowClick(row) {
  id.value = row.id
  title.value = row.title
  visible.value = false
}
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
</style>
