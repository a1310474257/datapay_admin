import { db } from '@/mock'
import { delay } from './mockApi'

// 支付流水：后端暂未提供 /api/admin/pay-records 接口，当前保留 Mock。
// 后续后端接入微信支付回单后可以切换为真实数据源。
export async function getPayRecordList(params = {}) {
  await delay()
  const page = Number(params.page || 1)
  const pageSize = Number(params.pageSize || 10)
  let rows = (db.payRecord || []).map((r) => ({
    ...r,
    transaction_id: r.wx_transaction_id || '',
    channel: '微信支付',
  }))
  if (params.order_no) {
    const t = String(params.order_no).trim()
    rows = rows.filter((r) => String(r.order_no || '').includes(t))
  }
  if (params.transaction_id) {
    const t = String(params.transaction_id).trim()
    rows = rows.filter((r) => String(r.transaction_id || '').includes(t))
  }
  if (params.status !== '' && params.status !== undefined) {
    rows = rows.filter((r) => Number(r.status) === Number(params.status))
  }
  if (params.paid_at?.length === 2) {
    const [start, end] = params.paid_at
    rows = rows.filter(
      (r) => String(r.paid_at) >= `${start} 00:00:00` && String(r.paid_at) <= `${end} 23:59:59`,
    )
  }
  rows.sort((a, b) => Number(b.id) - Number(a.id))
  const total = rows.length
  const list = rows.slice((page - 1) * pageSize, page * pageSize)
  return { list, total, page, pageSize }
}
