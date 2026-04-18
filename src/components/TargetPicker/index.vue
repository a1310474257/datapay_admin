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
import { computed, ref, watch } from 'vue'
import { searchBannerTargets } from '@/api/banner'

const id = defineModel('id', { type: [Number, String], default: null })
const title = defineModel('title', { type: String, default: '' })

const props = defineProps({
  /** 1 课程 2 活动 3 商品 4 HR工具 */
  type: { type: Number, required: true },
})

const visible = ref(false)
const keyword = ref('')
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const dialogTitle = computed(() => {
  const map = { 1: '选择课程', 2: '选择活动', 3: '选择商品', 4: '选择 HR 工具资源' }
  return map[props.type] || '选择目标'
})

watch(
  () => props.type,
  () => {
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
