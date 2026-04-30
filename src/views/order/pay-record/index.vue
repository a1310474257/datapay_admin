<template>
  <div class="dp-pay-record">
    <SearchForm
      :model-value="searchParams"
      :schema="searchSchema"
      @update:model-value="handleSearchModelUpdate"
      @search="onSearch"
    />
    <ProTable ref="tableRef" :columns="columns" :load-data="loadData">
      <template #amount="{ row }">¥ {{ fen2yuan(row.amount) }}</template>
      <template #status="{ row }">
        <StatusTag :dict="PAY_RECORD_STATUS" :value="row.status" />
      </template>
    </ProTable>
  </div>
</template>

<script setup>
import SearchForm from '@/components/SearchForm/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import { PAY_RECORD_STATUS } from '@/utils/enums'
import { fen2yuan } from '@/utils/price'
import { getPayRecordList } from '@/api/payRecord'
import { useTable } from '@/hooks/useTable'

const { tableRef, searchParams, loadData, onSearch } = useTable({
  loadApi: getPayRecordList,
  defaultParams: {
    order_no: '',
    transaction_id: '',
    status: '',
    paid_at: [],
  },
})

const searchSchema = [
  { prop: 'order_no', label: '订单号', type: 'input' },
  { prop: 'transaction_id', label: '交易号', type: 'input' },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '已支付', value: 1 },
      { label: '已退款', value: 2 },
    ],
  },
  { prop: 'paid_at', label: '支付时间', type: 'daterange', span: 8 },
]

const columns = [
  { prop: 'id', label: 'ID', width: 72 },
  { prop: 'order_no', label: '订单号', minWidth: 180 },
  { prop: 'transaction_id', label: '交易号', minWidth: 220 },
  { prop: 'channel', label: '渠道', width: 100 },
  { prop: 'amount', label: '金额(元)', width: 110, slot: 'amount' },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'paid_at', label: '支付时间', minWidth: 170 },
]

function handleSearchModelUpdate(value) {
  Object.assign(searchParams, value || {})
}
</script>
