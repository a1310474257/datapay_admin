<template>
  <div class="dp-refund-page">
    <el-card class="tab-card" shadow="never">
      <el-tabs v-model="activeTab" @tab-change="onTab">
        <el-tab-pane name="0">
          <template #label>
            <el-badge :value="badge0" :hidden="badge0 === 0" :max="99">待审批</el-badge>
          </template>
        </el-tab-pane>
        <el-tab-pane name="1">
          <template #label>
            <el-badge :value="badge1" :hidden="badge1 === 0" :max="99">已通过</el-badge>
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
      <template #amount="{ row }">¥ {{ fen2yuan(row.amount) }}</template>
      <template #status="{ row }">
        <StatusTag :dict="REFUND_STATUS" :value="row.status" />
      </template>
      <template #actions="{ row }">
        <el-space>
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button
            v-if="Number(row.status) === 0"
            v-permission="'refund:approve'"
            link
            type="success"
            @click="approve(row)"
          >
            同意
          </el-button>
          <el-button
            v-if="Number(row.status) === 0"
            v-permission="'refund:reject'"
            link
            type="danger"
            @click="reject(row)"
          >
            拒绝
          </el-button>
        </el-space>
      </template>
    </ProTable>

    <el-drawer v-model="drawerVisible" title="退款详情" size="520px" destroy-on-close @close="stopPoll">
      <el-descriptions v-if="detail" border :column="1">
        <el-descriptions-item label="退款单号">{{ detail.refund_no }}</el-descriptions-item>
        <el-descriptions-item label="订单号">{{ detail.order_no }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ detail.user_nickname }}</el-descriptions-item>
        <el-descriptions-item label="金额">¥ {{ fen2yuan(detail.amount) }}</el-descriptions-item>
        <el-descriptions-item label="原因">{{ detail.reason }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <StatusTag :dict="REFUND_STATUS" :value="detail.status" />
        </el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.remark || '—' }}</el-descriptions-item>
      </el-descriptions>
      <el-divider>订单快照</el-divider>
      <el-descriptions v-if="detail?.order_snapshot" border :column="1">
        <el-descriptions-item label="实付">¥ {{ fen2yuan(detail.order_snapshot.actual_pay) }}</el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ detail.order_snapshot.created_at }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm from '@/components/SearchForm/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import { REFUND_STATUS } from '@/utils/enums'
import { fen2yuan } from '@/utils/price'
import { approveRefund, getRefundDetail, getRefundList, rejectRefund } from '@/api/refund'
import { useTable } from '@/hooks/useTable'

const route = useRoute()
const activeTab = ref('0')
const badge0 = ref(0)
const badge1 = ref(0)

const { tableRef, searchParams, loadData, onSearch } = useTable({
  loadApi: getRefundList,
  defaultParams: {
    status: '0',
    keyword: '',
    created_at: [],
    order_id: undefined,
  },
})

const searchSchema = [
  { prop: 'keyword', label: '关键字', type: 'input', placeholder: '退款单号/订单号/用户' },
  { prop: 'created_at', label: '申请时间', type: 'daterange', span: 8 },
]

const columns = [
  { prop: 'refund_no', label: '退款单号', minWidth: 160 },
  { prop: 'order_no', label: '订单号', minWidth: 170 },
  { prop: 'user_nickname', label: '用户', minWidth: 120 },
  { prop: 'amount', label: '金额(元)', width: 110, slot: 'amount' },
  { prop: 'reason', label: '原因', minWidth: 160, showOverflowTooltip: true },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'created_at', label: '申请时间', minWidth: 170 },
  { prop: 'actions', label: '操作', minWidth: 200, fixed: 'right', slot: 'actions' },
]

const drawerVisible = ref(false)
const detail = ref(null)
let pollTimer = null
let listPoll = null

function handleSearchModelUpdate(value) {
  Object.assign(searchParams, value || {})
}

function onTab(name) {
  searchParams.status = name
  tableRef.value?.setParams({ ...searchParams, status: name })
  tableRef.value?.refresh()
}

async function loadBadges() {
  const [a, b] = await Promise.all([
    getRefundList({ status: '0', page: 1, pageSize: 1 }),
    getRefundList({ status: '1', page: 1, pageSize: 1 }),
  ])
  badge0.value = a.total
  badge1.value = b.total
}

async function openDetail(row) {
  detail.value = await getRefundDetail(row.id)
  drawerVisible.value = true
  startPoll(row.id)
}

function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function startPoll(id) {
  stopPoll()
  pollTimer = setInterval(async () => {
    try {
      const d = await getRefundDetail(id)
      detail.value = d
      if (![0, 3].includes(Number(d.status))) {
        stopPoll()
        tableRef.value?.refresh()
        loadBadges()
      }
    } catch {
      stopPoll()
    }
  }, 3000)
}

watch(drawerVisible, (v) => {
  if (!v) stopPoll()
})

async function approve(row) {
  try {
    await approveRefund(row.id)
    ElMessage.success('已提交审批')
    tableRef.value?.refresh()
    loadBadges()
    startListPoll()
  } catch (e) {
    ElMessage.error(e?.message || '操作失败')
  }
}

async function reject(row) {
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝退款', {
      inputPlaceholder: '原因',
      inputValidator: (v) => Boolean(String(v || '').trim()),
    })
    await rejectRefund(row.id, value)
    ElMessage.success('已提交审批')
    tableRef.value?.refresh()
    loadBadges()
    startListPoll()
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error(e?.message || '操作失败')
  }
}

function startListPoll() {
  if (listPoll) clearInterval(listPoll)
  listPoll = setInterval(async () => {
    const res = await getRefundList({ status: '0', page: 1, pageSize: 100 })
    const pending = (res.list || []).filter((r) => [0, 3].includes(Number(r.status)))
    if (pending.length === 0) {
      clearInterval(listPoll)
      listPoll = null
      tableRef.value?.refresh()
      loadBadges()
    } else {
      tableRef.value?.refresh()
      loadBadges()
    }
  }, 3000)
}

onMounted(() => {
  if (route.query.order_id) {
    searchParams.order_id = route.query.order_id
  }
  loadBadges()
  startListPoll()
})

onUnmounted(() => {
  stopPoll()
  if (listPoll) clearInterval(listPoll)
})
</script>

<style scoped>
.tab-card {
  margin-bottom: 12px;
}
</style>
