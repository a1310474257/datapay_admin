import { db } from '@/mock'
import { now } from '@/utils/date'
import { delay, mockApi } from './mockApi'

function withJoin(row) {
  if (!row) return row
  const order = db.order.find((o) => Number(o.id) === Number(row.order_id))
  const user = db.user.find((u) => Number(u.id) === Number(row.user_id))
  return {
    ...row,
    order_no: order?.order_no || '',
    user_nickname: user?.nickname || '—',
    user_phone: user?.phone || '—',
  }
}

export async function getRefundList(params = {}) {
  await delay()
  const page = Number(params.page || 1)
  const pageSize = Number(params.pageSize || 10)
  let rows = db.refund.map(withJoin)
  if (params.status !== '' && params.status !== undefined) {
    const s = Number(params.status)
    if (s === 0) {
      rows = rows.filter((r) => [0, 3].includes(Number(r.status)))
    } else {
      rows = rows.filter((r) => Number(r.status) === s)
    }
  }
  if (params.order_id) {
    rows = rows.filter((r) => Number(r.order_id) === Number(params.order_id))
  }
  if (params.keyword) {
    const kw = String(params.keyword).trim()
    rows = rows.filter(
      (r) =>
        String(r.refund_no || '').includes(kw) ||
        String(r.order_no || '').includes(kw) ||
        String(r.user_nickname || '').includes(kw),
    )
  }
  if (params.created_at?.length === 2) {
    const [start, end] = params.created_at
    rows = rows.filter(
      (r) => String(r.created_at) >= `${start} 00:00:00` && String(r.created_at) <= `${end} 23:59:59`,
    )
  }
  rows.sort((a, b) => Number(b.id) - Number(a.id))
  const total = rows.length
  const list = rows.slice((page - 1) * pageSize, page * pageSize)
  return { list, total, page, pageSize }
}

export async function getRefundDetail(id) {
  await delay()
  const row = db.refund.find((r) => Number(r.id) === Number(id))
  if (!row) throw new Error('退款单不存在')
  const order = db.order.find((o) => Number(o.id) === Number(row.order_id))
  const user = db.user.find((u) => Number(u.id) === Number(row.user_id))
  const items = order ? db.orderItem.filter((it) => Number(it.order_id) === Number(order.id)) : []
  return {
    ...withJoin(row),
    order_snapshot: order ? { ...order, items } : null,
    user,
  }
}

function scheduleFinal(id, patch) {
  setTimeout(() => {
    const target = db.refund.find((r) => Number(r.id) === Number(id))
    if (!target) return
    Object.assign(target, patch, { updated_at: now() })
  }, 3000)
}

// 同意退款：先进入审批中，3 秒后变为已通过。
export async function approveRefund(id) {
  await delay()
  const row = db.refund.find((r) => Number(r.id) === Number(id))
  if (!row) throw new Error('退款单不存在')
  if (Number(row.status) !== 0) throw new Error('当前状态不可审批')
  Object.assign(row, { status: 3, updated_at: now() })
  scheduleFinal(id, { status: 1, refund_time: now() })
  return withJoin(row)
}

// 拒绝退款。
export async function rejectRefund(id, remark) {
  await delay()
  const row = db.refund.find((r) => Number(r.id) === Number(id))
  if (!row) throw new Error('退款单不存在')
  if (Number(row.status) !== 0) throw new Error('当前状态不可审批')
  Object.assign(row, { status: 3, updated_at: now() })
  scheduleFinal(id, { status: 2, remark: remark || '已拒绝' })
  return withJoin(row)
}
