<template>
  <div class="dp-product-list">
    <el-card class="page-header" shadow="never">
      <div class="header-bar">
        <div class="header-title">
          <span class="title">商品管理</span>
          <span class="subtitle">商品上架、库存与价格维护</span>
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
          <div class="stat-label">上架商品</div>
          <div class="stat-value">{{ stats.online }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">低库存</div>
          <div class="stat-value">{{ stats.lowStock }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">售罄</div>
          <div class="stat-value">{{ stats.outOfStock }}</div>
        </div>
      </div>
    </el-card>

    <ProTable ref="tableRef" :columns="columns" :load-data="loadData">
      <template #toolbar-left>
        <el-button v-permission="'product:create'" type="primary" @click="goDetail('new')">新建商品</el-button>
      </template>
      <template #cover="{ row }">
        <el-image
          :src="resolveMediaPreviewUrl(row.cover)"
          style="width: 56px; height: 56px; border-radius: 6px"
          fit="cover"
          :preview-src-list="row.cover ? [resolveMediaPreviewUrl(row.cover)] : []"
          preview-teleported
          hide-on-click-modal
        />
      </template>
      <template #price="{ row }">¥ {{ fen2yuan(row.price) }}</template>
      <template #originalPrice="{ row }">¥ {{ fen2yuan(row.original_price) }}</template>
      <template #stock="{ row }">
        <span :class="{ 'stock-danger': Number(row.stock || 0) === 0 }">{{ row.stock ?? 0 }}</span>
      </template>
      <template #statusSwitch="{ row }">
        <el-switch
          :model-value="normalizeStatus(row.status)"
          :active-value="1"
          :inactive-value="0"
          :disabled="!row?.id"
          @change="(value) => handleStatusChange(row, value)"
        />
      </template>
      <template #actions="{ row }">
        <el-space>
          <el-button v-permission="'product:update'" link type="primary" @click="goDetail(row.id)">编辑</el-button>
          <el-button v-permission="'product:update'" link type="primary" @click="handleStatusChange(row, row.status === 1 ? 0 : 1)">
            {{ Number(row.status) === 1 ? '下架' : '上架' }}
          </el-button>
          <el-button v-permission="'product:delete'" link type="danger" @click="handleDelete(row)">删除</el-button>
        </el-space>
      </template>
    </ProTable>
  </div>
</template>

<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm from '@/components/SearchForm/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import { STATUS_ONLINE } from '@/utils/enums'
import { fen2yuan } from '@/utils/price'
import { resolveMediaPreviewUrl } from '@/utils/mediaUrl'
import { changeProductStatus, deleteProduct, getProductList } from '@/api/product'
import { useTable } from '@/hooks/useTable'
import { useDictStore } from '@/stores/dict'

const router = useRouter()
const route = useRoute()
const dictStore = useDictStore()
const pageRows = ref([])

const { tableRef, searchParams, onSearch } = useTable({
  loadApi: getProductList,
  defaultParams: {
    keyword: '',
    status: '',
    category_id: '',
  },
})

const searchSchema = ref([
  { prop: 'keyword', label: '标题', type: 'input', placeholder: '商品标题' },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '上架', value: 1 },
      { label: '下架', value: 0 },
    ],
  },
  {
    prop: 'category_id',
    label: '分类',
    type: 'select',
    options: [],
  },
])

const columns = [
  { prop: 'id', label: 'ID', width: 72 },
  { prop: 'cover', label: '封面', width: 90, slot: 'cover' },
  { prop: 'title', label: '标题', minWidth: 160 },
  { prop: 'category_name', label: '分类', minWidth: 100 },
  { prop: 'spec_count', label: '规格数', width: 90 },
  { prop: 'price', label: '售价', width: 110, slot: 'price' },
  { prop: 'original_price', label: '原价', width: 110, slot: 'originalPrice' },
  { prop: 'stock', label: '库存', width: 90, slot: 'stock' },
  { prop: 'sales', label: '销量', width: 90 },
  { prop: 'status', label: '状态', width: 100, dict: STATUS_ONLINE },
  { prop: 'statusSwitch', label: '上下架', width: 100, slot: 'statusSwitch' },
  { prop: 'actions', label: '操作', width: 160, fixed: 'right', slot: 'actions' },
]

const stats = computed(() => {
  const rows = pageRows.value
  const total = rows.length
  const online = rows.filter((item) => Number(item.status) === 1).length
  const lowStock = rows.filter((item) => Number(item.stock || 0) > 0 && Number(item.stock || 0) <= 10).length
  const outOfStock = rows.filter((item) => Number(item.stock || 0) === 0).length
  return { total, online, lowStock, outOfStock }
})

function handleSearchModelUpdate(value) {
  Object.assign(searchParams, value || {})
}

async function loadData(params) {
  const result = await getProductList({ ...searchParams, ...params })
  pageRows.value = result?.list || []
  return result
}

function goDetail(id) {
  router.push(`/product/detail/${id}`)
}

async function handleStatusChange(row, status) {
  if (!row?.id) return
  try {
    await changeProductStatus(row.id, Number(status))
    ElMessage.success(Number(status) === 1 ? '已上架' : '已下架')
    tableRef.value?.refresh()
  } catch (e) {
    ElMessage.error(e?.message || '状态更新失败')
    tableRef.value?.refresh()
  }
}

function normalizeStatus(status) {
  return Number(status) === 1 ? 1 : 0
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.title}」？`, '提示', { type: 'warning' })
    await deleteProduct(row.id)
    ElMessage.success('已删除')
    tableRef.value?.refresh()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.message || '删除失败')
  }
}

onMounted(async () => {
  await dictStore.loadCategory()
  const idx = searchSchema.value.findIndex((s) => s.prop === 'category_id')
  if (idx >= 0) {
    searchSchema.value[idx].options = (dictStore.category || []).map((c) => ({ label: c.name, value: c.id }))
  }
})

// 列表页被 keep-alive 缓存：从详情页返回时不会触发 onMounted，
// 用 onActivated 在再次激活时刷新一次，保证编辑/新建后能看到最新数据。
onActivated(() => {
  tableRef.value?.refresh()
})

watch(
  () => route.query.t,
  (value) => {
    if (value) tableRef.value?.refresh()
  },
)
</script>

<style scoped>
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

.stock-danger {
  color: var(--el-color-danger);
  font-weight: 600;
}

@media (max-width: 960px) {
  .stats-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
