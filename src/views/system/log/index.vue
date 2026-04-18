<template>
  <div class="dp-system-log">
    <ProTable ref="tableRef" :columns="columns" :load-data="loadData" />
  </div>
</template>

<script setup>
import ProTable from '@/components/ProTable/index.vue'
import { useTable } from '@/hooks/useTable'

const logs = [
  { id: 1, admin: 'admin', action: '登录后台', ip: '127.0.0.1', created_at: '2026-04-18 09:12:01' },
  { id: 2, admin: 'admin', action: '更新订单备注 #1024', ip: '127.0.0.1', created_at: '2026-04-18 10:03:22' },
  { id: 3, admin: 'admin', action: '审批退款 RF100001', ip: '127.0.0.1', created_at: '2026-04-18 11:20:44' },
]

const { tableRef, searchParams, loadData } = useTable({
  loadApi: async (params) => {
    const page = Number(params.page || 1)
    const pageSize = Number(params.pageSize || 10)
    const total = logs.length
    const list = logs.slice((page - 1) * pageSize, page * pageSize)
    return { list, total, page, pageSize }
  },
  defaultParams: {},
})

const columns = [
  { prop: 'id', label: 'ID', width: 72 },
  { prop: 'admin', label: '操作人', width: 120 },
  { prop: 'action', label: '动作', minWidth: 220 },
  { prop: 'ip', label: 'IP', width: 130 },
  { prop: 'created_at', label: '时间', minWidth: 170 },
]
</script>
