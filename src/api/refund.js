import request from './request'
import { fromBackendPage, toBackendParams } from './adapter'
import { reviewOrderRefund } from './order'

// 后端当前尚未提供独立的“退款工单”表与列表接口。
// 前端页面以订单状态为轴聚合出一个简化版退款清单：
//  - 待审批(0) ← 订单 status=refunding
//  - 已通过(1) ← 订单 status=refunded
//  - 已拒绝(2) ← 后端未保留拒绝快照，返回空
//
// 审批动作统一转发到 /api/admin/orders/{orderNo}/refund/review。
// 未来若后端新增独立的退款单表，可在此无痛替换。

function mapRefundRow(order, refundStatusNum) {
  const orderNo = order.id || order.orderNo
  return {
    id: orderNo, // 前端用它作 :key 和审批依据
    refund_no: `REFUND-${orderNo}`,
    order_no: orderNo,
    user_nickname: order.userNickname || '—',
    user_phone: order.userPhone || '—',
    amount: order.totalPrice,
    reason: order.refundReason || '',
    status: refundStatusNum,
    created_at: order.createTime,
    refund_time: order.refundTime || '',
    remark: order.refundRemark || '',
    order_snapshot: {
      actual_pay: order.totalPrice,
      created_at: order.createTime,
    },
  }
}

function toRefundStatus(frontendStatus) {
  // 前端 tab 的 '0'/'1'/'2' 对应后端订单 status 枚举
  const key = String(frontendStatus)
  if (key === '0') return 'refunding'
  if (key === '1') return 'refunded'
  return null
}

export async function getRefundList(params = {}) {
  const target = toRefundStatus(params.status)
  if (!target) {
    return { list: [], total: 0, page: Number(params.page || 1), pageSize: Number(params.pageSize || 10) }
  }
  const [startDate, endDate] = Array.isArray(params.created_at) ? params.created_at : []
  const backendParams = toBackendParams(params, {
    status: target,
    startDate,
    endDate,
  })
  delete backendParams.keyword
  delete backendParams.order_id
  delete backendParams.created_at
  const page = await request.get('/admin/orders', { params: backendParams })
  const refundStatusNum = String(params.status) === '1' ? 1 : 0
  return fromBackendPage(page, (row) => mapRefundRow(row, refundStatusNum))
}

export async function getRefundDetail(orderNo) {
  const data = await request.get(`/admin/orders/${orderNo}`)
  if (!data) throw new Error('退款单不存在')
  const status = String(data.status)
  const refundStatusNum = status === 'refunded' ? 1 : status === 'refunding' ? 0 : 2
  return {
    ...mapRefundRow({
      id: data.id,
      userNickname: '',
      userPhone: '',
      totalPrice: data.totalPrice,
      createTime: data.createTime,
    }, refundStatusNum),
    order_snapshot: {
      actual_pay: data.totalPrice,
      created_at: data.createTime,
      items: data.items,
    },
  }
}

export async function approveRefund(orderNo, remark) {
  return reviewOrderRefund(orderNo, true, remark)
}

export async function rejectRefund(orderNo, remark) {
  return reviewOrderRefund(orderNo, false, remark)
}
