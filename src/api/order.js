import request from './request'
import { fromBackendPage, toBackendParams, withAliases } from './adapter'

// ---------- 枚举映射 ----------
// 后端使用字符串枚举，前端历史 UI 使用 0..6 / 1..5 数字枚举。
// 这里在 API 层做双向翻译，使视图无需改动。
const STATUS_STR_TO_NUM = {
  pending: 0,
  paid: 1,
  shipped: 2,
  completed: 3,
  refunding: 4,
  refunded: 5,
  cancelled: 6,
}
const STATUS_NUM_TO_STR = Object.entries(STATUS_STR_TO_NUM)
  .reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {})

const TYPE_STR_TO_NUM = {
  course: 1,
  'hr-tool': 2,
  'research-report': 3,
  activity: 4,
  product: 5,
}
const TYPE_NUM_TO_STR = Object.entries(TYPE_STR_TO_NUM)
  .reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {})

function statusToNum(s) {
  return s === null || s === undefined ? s : (STATUS_STR_TO_NUM[s] ?? Number(s))
}
function typeToNum(t) {
  return t === null || t === undefined ? t : (TYPE_STR_TO_NUM[t] ?? Number(t))
}
function statusToStr(n) {
  if (n === '' || n === null || n === undefined) return undefined
  return STATUS_NUM_TO_STR[Number(n)] || String(n)
}
function typeToStr(n) {
  if (n === '' || n === null || n === undefined) return undefined
  return TYPE_NUM_TO_STR[Number(n)] || String(n)
}

// 把后端订单列表条目（字符串枚举 + camelCase）转成前端期望的形态（数字枚举 + snake_case）。
function mapOrderRow(row) {
  if (!row) return row
  const aliased = withAliases(row)
  // 后端 id 就是 orderNo 字符串
  const orderNo = row.id || row.orderNo
  return {
    ...aliased,
    // 供 row.id 作为 Vue :key 使用
    id: orderNo,
    order_no: orderNo,
    orderNo,
    order_type: typeToNum(row.type),
    status: statusToNum(row.status),
    status_raw: row.status,
    type_raw: row.type,
    actual_pay: row.totalPrice,
    created_at: row.createTime,
    pay_time: row.payTime,
    ship_time: row.shipTime,
  }
}

// ---------- 列表 ----------
// 列表：GET /api/admin/orders
export async function getOrderList(params = {}) {
  const [startDate, endDate] = Array.isArray(params.created_at) ? params.created_at : []
  const backendParams = toBackendParams(params, {
    orderNo: params.order_no || params.orderNo,
    userId: params.user_id,
    type: typeToStr(params.order_type),
    status: statusToStr(params.status),
    startDate,
    endDate,
  })
  delete backendParams.order_type
  delete backendParams.order_no
  delete backendParams.user_id
  delete backendParams.created_at
  delete backendParams.pay_time
  delete backendParams.keyword // 后端暂不支持昵称/手机模糊
  delete backendParams.sort
  const page = await request.get('/admin/orders', { params: backendParams })
  const normalized = fromBackendPage(page, mapOrderRow)
  // 列表视图的可展开子表依赖 items 字段；后端列表仅返回概要，这里兜底空数组。
  normalized.list = normalized.list.map((row) => ({
    ...row,
    items: row.items || [],
  }))
  return normalized
}

// 状态统计（用于 Tab 角标）：后端没有专门接口，用 /statistics 里的 statusDistribution 组装。
export async function getOrderStatusCount() {
  try {
    const stats = await request.get('/admin/orders/statistics')
    const result = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    const dist = stats?.statusDistribution || {}
    Object.entries(dist).forEach(([statusStr, count]) => {
      const num = STATUS_STR_TO_NUM[statusStr]
      if (num !== undefined) result[num] = Number(count || 0)
    })
    return result
  } catch (_e) {
    return { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  }
}

// ---------- 详情 ----------
// 前端路由 :id 实际是 orderNo 字符串。
export async function getOrderDetail(orderNo) {
  const data = await request.get(`/admin/orders/${orderNo}`)
  if (!data) throw new Error('订单不存在')
  const priceDetail = data.priceDetail || {}
  const items = (data.items || []).map((it) => ({
    ...it,
    item_id: it.itemId,
  }))
  let addressSnap = null
  if (data.address) {
    try { addressSnap = JSON.parse(data.address) } catch { addressSnap = null }
  }
  return {
    id: data.id,
    order_no: data.id,
    order_type: typeToNum(data.type),
    status: statusToNum(data.status),
    created_at: data.createTime,
    pay_time: data.payTime,
    ship_time: data.shipTime,
    finish_time: data.finishTime,
    express_company: data.expressCompany,
    express_no: data.expressNo,
    goods_total: priceDetail.goodsTotal,
    discount: priceDetail.discount,
    freight: priceDetail.freight,
    actual_pay: priceDetail.actualPay ?? data.totalPrice,
    items,
    address_snap: addressSnap,
    user: null, // 后端详情未返回 user，后续可通过 /api/admin/users/{id} 单独查
    payRecords: [], // 后端详情不返回支付流水
    remark: '', // 后端暂未开放备注
  }
}

// ---------- 写操作 ----------
// 取消订单：POST /api/admin/orders/{orderNo}/cancel
export async function cancelOrder(orderNo /* , _reason */) {
  await request.post(`/admin/orders/${orderNo}/cancel`)
  return { success: true }
}

// 备注：后端尚未提供，暂时本地返回成功，避免 UI 崩溃。
export async function updateOrderRemark(_orderNo, _remark) {
  return { success: true, local: true }
}

// 发货：POST /api/admin/orders/{orderNo}/ship
export async function shipOrder(orderNo, { express_company, express_no } = {}) {
  await request.post(`/admin/orders/${orderNo}/ship`, {
    expressCompany: express_company,
    expressNo: express_no,
  })
  return { success: true }
}

// 修改运单：后端暂无，退化为重新调用发货接口（/ship 幂等更新）。
export async function updateOrderExpress(orderNo, { express_company, express_no } = {}) {
  return shipOrder(orderNo, { express_company, express_no })
}

// 退款审核：POST /api/admin/orders/{orderNo}/refund/review
export async function reviewOrderRefund(orderNo, approve, remark) {
  await request.post(`/admin/orders/${orderNo}/refund/review`, {
    approve: Boolean(approve),
    remark: remark || '',
  })
  return { success: true }
}

// 订单统计（Dashboard 使用）：GET /api/admin/orders/statistics?startDate&endDate
export async function getOrderStatistics(params = {}) {
  const data = await request.get('/admin/orders/statistics', { params })
  return data || {}
}
