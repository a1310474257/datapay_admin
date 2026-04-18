import { db } from '@/mock'
import { now } from '@/utils/date'
import { delay, mockApi } from './mockApi'

function inRange(dateText, range = []) {
  if (!Array.isArray(range) || range.length !== 2 || !dateText) return true
  const [start, end] = range
  return String(dateText) >= `${start} 00:00:00` && String(dateText) <= `${end} 23:59:59`
}

function withUser(order) {
  const user = db.user.find((item) => Number(item.id) === Number(order.user_id))
  return {
    ...order,
    user_nickname: user?.nickname || '—',
    user_phone: user?.phone || '—',
  }
}

// 订单列表：支持 tab 状态、筛选条件与关键字。
export async function getOrderList(params = {}) {
  await delay()
  const page = Number(params.page || 1)
  const pageSize = Number(params.pageSize || 10)
  let rows = db.order.filter((item) => item.deleted_at == null).map(withUser)

  if (params.status !== '' && params.status !== undefined) {
    rows = rows.filter((item) => Number(item.status) === Number(params.status))
  }
  if (params.order_type !== '' && params.order_type !== undefined) {
    rows = rows.filter((item) => Number(item.order_type) === Number(params.order_type))
  }
  if (params.order_no) {
    rows = rows.filter((item) => String(item.order_no).includes(String(params.order_no)))
  }
  if (params.user_id) {
    rows = rows.filter((item) => Number(item.user_id) === Number(params.user_id))
  }
  if (params.keyword) {
    const keyword = String(params.keyword).trim()
    rows = rows.filter((item) =>
      [item.order_no, item.user_nickname, item.user_phone].some((field) => String(field || '').includes(keyword)))
  }
  if (params.created_at?.length) {
    rows = rows.filter((item) => inRange(item.created_at, params.created_at))
  }
  if (params.pay_time?.length) {
    rows = rows.filter((item) => inRange(item.pay_time, params.pay_time))
  }

  const sort = String(params.sort || 'id,desc')
  const [field, order] = sort.split(',')
  rows.sort((a, b) => {
    if (a[field] === b[field]) return 0
    return order === 'asc' ? (a[field] > b[field] ? 1 : -1) : (a[field] > b[field] ? -1 : 1)
  })

  const total = rows.length
  const list = rows.slice((page - 1) * pageSize, page * pageSize).map((row) => ({
    ...row,
    items: db.orderItem.filter((item) => Number(item.order_id) === Number(row.id)),
  }))
  return { list, total, page, pageSize }
}

// 获取订单状态数量（供 Tab 徽标展示）。
export async function getOrderStatusCount() {
  await delay()
  const result = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  db.order.forEach((item) => {
    if (item.deleted_at != null) return
    result[item.status] = Number(result[item.status] || 0) + 1
  })
  return result
}

// 获取订单详情：聚合用户、商品与支付流水。
export async function getOrderDetail(id) {
  const order = await mockApi.findById(db.order, id)
  if (!order) throw new Error('订单不存在')
  const user = db.user.find((item) => Number(item.id) === Number(order.user_id)) || null
  const items = db.orderItem.filter((item) => Number(item.order_id) === Number(order.id))
  const payRecords = db.payRecord.filter((item) => Number(item.order_id) === Number(order.id))
  return { ...order, user, items, payRecords }
}

// 取消订单（P0 仅支持待付款状态）。
export async function cancelOrder(id, reason) {
  return mockApi.update(db.order, id, {
    status: 6,
    cancel_reason: reason || '',
    cancel_time: now(),
  })
}

// 更新订单备注。
export async function updateOrderRemark(id, remark) {
  return mockApi.update(db.order, id, { remark: remark || '' })
}

// 发货：实物订单付款后流转为已发货，并写入物流信息。
export async function shipOrder(id, { express_company, express_no }) {
  await delay()
  const order = db.order.find((item) => Number(item.id) === Number(id))
  if (!order) throw new Error('订单不存在')
  if (Number(order.status) !== 1) throw new Error('当前状态不可发货')
  if (Number(order.order_type) !== 5) throw new Error('非实物订单无需发货')
  return mockApi.update(db.order, id, {
    status: 2,
    express_company: express_company || '',
    express_no: express_no || '',
    ship_time: now(),
  })
}

// 已发货订单仅更新物流信息。
export async function updateOrderExpress(id, { express_company, express_no }) {
  await delay()
  const order = db.order.find((item) => Number(item.id) === Number(id))
  if (!order) throw new Error('订单不存在')
  if (Number(order.status) !== 2) throw new Error('仅已发货订单可修改运单')
  return mockApi.update(db.order, id, {
    express_company: express_company || '',
    express_no: express_no || '',
  })
}
