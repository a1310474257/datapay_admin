<template>
  <div class="dp-order-list">
    <el-card class="status-card" shadow="never">
      <el-tabs v-model="activeStatusTab" @tab-change="handleTabChange">
        <el-tab-pane v-for="item in statusTabs" :key="item.value" :name="item.value">
          <template #label>
            <el-badge :value="badgeValue(item.value)" :hidden="item.value === ''">
              <span>{{ item.label }}</span>
            </el-badge>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <SearchForm
      :model-value="searchParams"
      :schema="searchSchema"
      @update:model-value="handleSearchModelUpdate"
      @search="onSearch"
    />

    <ProTable ref="tableRef" :columns="columns" :load-data="loadData">
      <template #expand="{ row }">
        <el-table :data="row.items || []" size="small" border>
          <el-table-column label="图片" width="80">
            <template #default="{ row: item }">
              <el-image :src="item.cover" style="width: 44px; height: 44px; border-radius: 6px" />
            </template>
          </el-table-column>
          <el-table-column prop="title" label="名称" min-width="180" />
          <el-table-column prop="spec" label="规格" min-width="140" />
          <el-table-column prop="quantity" label="数量" width="90" />
          <el-table-column label="单价" width="110">
            <template #default="{ row: item }">¥ {{ fen2yuan(item.price) }}</template>
          </el-table-column>
        </el-table>
      </template>
      <template #user="{ row }">
        <div>{{ row.user_nickname || '—' }}</div>
        <div class="sub-text">{{ maskPhone(row.user_phone) }}</div>
      </template>
      <template #orderType="{ row }">
        <StatusTag :dict="ORDER_TYPE" :value="row.order_type" />
      </template>
      <template #actualPay="{ row }">¥ {{ fen2yuan(row.actual_pay) }}</template>
      <template #actions="{ row }">
        <el-space>
          <el-button link type="primary" @click="goDetail(row)">详情</el-button>
          <el-button
            v-if="Number(row.status) === 0"
            v-permission="'order:cancel'"
            link
            type="danger"
            @click="handleCancel(row)"
          >
            取消
          </el-button>
          <el-button
            v-if="Number(row.status) === 1 && Number(row.order_type) === 5"
            v-permission="'order:ship'"
            link
            type="primary"
            @click="openShip(row)"
          >
            发货
          </el-button>
          <el-button
            v-if="Number(row.status) === 2 && Number(row.order_type) === 5"
            v-permission="'order:ship'"
            link
            @click="openShip(row, true)"
          >
            改运单
          </el-button>
          <el-button
            v-if="Number(row.status) === 4"
            link
            type="danger"
            @click="goRefund(row)"
          >
            查看退款
          </el-button>
          <el-button
            v-if="[0, 1, 2, 3].includes(Number(row.status))"
            v-permission="'order:remark'"
            link
            type="warning"
            @click="handleRemark(row)"
          >
            备注
          </el-button>
        </el-space>
      </template>
    </ProTable>

    <ShipOrderDialog
      v-model:visible="shipVisible"
      :order-id="shipTarget?.id"
      :initial-express-name="shipTarget?.express_company"
      :initial-express-no="shipTarget?.express_no"
      :edit-mode="shipEdit"
      @success="onShipSuccess"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm from '@/components/SearchForm/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import { ORDER_STATUS, ORDER_TYPE } from '@/utils/enums'
import { fen2yuan } from '@/utils/price'
import { cancelOrder, getOrderList, getOrderStatusCount, updateOrderRemark } from '@/api/order'
import { useTable } from '@/hooks/useTable'
import ShipOrderDialog from '@/views/order/components/ShipOrderDialog.vue'

const router = useRouter()
const shipVisible = ref(false)
const shipTarget = ref(null)
const shipEdit = ref(false)
const activeStatusTab = ref('')
const statusCountMap = reactive({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 })
const { tableRef, searchParams, loadData, onSearch } = useTable({
  loadApi: getOrderList,
  defaultParams: {
    status: '',
    keyword: '',
    order_type: '',
    order_no: '',
    user_id: '',
    created_at: [],
    pay_time: [],
  },
})

const statusTabs = [
  { label: '全部', value: '' },
  { label: '待付款', value: '0' },
  { label: '已付款', value: '1' },
  { label: '已发货', value: '2' },
  { label: '已完成', value: '3' },
  { label: '退款中', value: '4' },
  { label: '已退款', value: '5' },
  { label: '已取消', value: '6' },
]

const searchSchema = [
  {
    prop: 'order_type',
    label: '订单类型',
    type: 'select',
    options: Object.entries(ORDER_TYPE).map(([value, item]) => ({ value: Number(value), label: item.label })),
  },
  { prop: 'order_no', label: '订单号', type: 'input', placeholder: '请输入订单号' },
  { prop: 'keyword', label: '用户', type: 'input', placeholder: '昵称/手机号' },
  { prop: 'created_at', label: '下单时间', type: 'daterange', span: 8 },
  { prop: 'pay_time', label: '付款时间', type: 'daterange', span: 8 },
]

const columns = [
  { type: 'expand', width: 54, slot: 'expand' },
  { prop: 'order_no', label: '订单号', minWidth: 190 },
  { prop: 'user', label: '用户', minWidth: 140, slot: 'user' },
  { prop: 'order_type', label: '类型', minWidth: 100, slot: 'orderType' },
  { prop: 'status', label: '状态', minWidth: 100, dict: ORDER_STATUS },
  { prop: 'actual_pay', label: '实付金额', minWidth: 110, slot: 'actualPay' },
  { prop: 'created_at', label: '下单时间', minWidth: 170 },
  { prop: 'pay_time', label: '付款时间', minWidth: 170 },
  { prop: 'actions', label: '操作', minWidth: 220, fixed: 'right', slot: 'actions' },
]

function badgeValue(status) {
  return statusCountMap[status] || 0
}

function maskPhone(phone) {
  const text = String(phone || '')
  if (text.length !== 11) return text || '—'
  return `${text.slice(0, 3)}****${text.slice(7)}`
}

function handleSearchModelUpdate(value) {
  Object.assign(searchParams, value || {})
}

function handleTabChange(status) {
  searchParams.status = status
  tableRef.value?.setParams({ ...searchParams, status })
  tableRef.value?.refresh()
}

function goDetail(row) {
  router.push(`/order/detail/${row.id}`)
}

function openShip(row, edit = false) {
  shipTarget.value = row
  shipEdit.value = Boolean(edit)
  shipVisible.value = true
}

function onShipSuccess() {
  loadStatusCount()
  tableRef.value?.refresh()
}

function goRefund(row) {
  router.push({ path: '/order/refund', query: { order_id: row.id } })
}

async function handleCancel(row) {
  try {
    const { value } = await ElMessageBox.prompt('请输入取消原因', '取消订单', {
      inputPlaceholder: '如：用户主动取消',
      inputValidator: (val) => Boolean(String(val || '').trim()),
      inputErrorMessage: '取消原因不能为空',
    })
    await cancelOrder(row.id, value)
    ElMessage.success('订单已取消')
    await loadStatusCount()
    tableRef.value?.refresh()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || '取消失败')
    }
  }
}

async function handleRemark(row) {
  try {
    const { value } = await ElMessageBox.prompt('请输入备注内容', '订单备注', {
      inputPlaceholder: '备注将用于客服跟进',
      inputValue: row.remark || '',
    })
    await updateOrderRemark(row.id, value)
    ElMessage.success('备注更新成功')
    tableRef.value?.refresh()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || '备注失败')
    }
  }
}

async function loadStatusCount() {
  try {
    const data = await getOrderStatusCount()
    Object.assign(statusCountMap, data)
  } catch (error) {
    ElMessage.error(error?.message || '状态统计加载失败')
  }
}

onMounted(() => {
  loadStatusCount()
})
</script>

<style scoped>
.status-card {
  margin-bottom: 12px;
}

.sub-text {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
