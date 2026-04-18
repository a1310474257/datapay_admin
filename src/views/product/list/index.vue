<template>
  <div class="dp-product-list">
    <SearchForm
      :model-value="searchParams"
      :schema="searchSchema"
      @update:model-value="handleSearchModelUpdate"
      @search="onSearch"
    />
    <ProTable ref="tableRef" :columns="columns" :load-data="loadData">
      <template #toolbar-left>
        <el-button v-permission="'product:create'" type="primary" @click="goDetail('new')">新建商品</el-button>
      </template>
      <template #cover="{ row }">
        <el-image :src="row.cover" style="width: 48px; height: 48px; border-radius: 6px" />
      </template>
      <template #price="{ row }">¥ {{ fen2yuan(row.price) }}</template>
      <template #actions="{ row }">
        <el-space>
          <el-button v-permission="'product:update'" link type="primary" @click="goDetail(row.id)">编辑</el-button>
          <el-button v-permission="'product:delete'" link type="danger" @click="handleDelete(row)">删除</el-button>
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
import { STATUS_ONLINE } from '@/utils/enums'
import { fen2yuan } from '@/utils/price'
import { deleteProduct, getProductList } from '@/api/product'
import { useTable } from '@/hooks/useTable'
import { useDictStore } from '@/stores/dict'
import { onMounted, ref } from 'vue'

const router = useRouter()
const dictStore = useDictStore()

const { tableRef, searchParams, loadData, onSearch } = useTable({
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
  { prop: 'stock', label: '库存', width: 90 },
  { prop: 'sales', label: '销量', width: 90 },
  { prop: 'status', label: '状态', width: 100, dict: STATUS_ONLINE },
  { prop: 'actions', label: '操作', width: 160, fixed: 'right', slot: 'actions' },
]

function handleSearchModelUpdate(value) {
  Object.assign(searchParams, value || {})
}

function goDetail(id) {
  router.push(`/product/detail/${id}`)
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
</script>
