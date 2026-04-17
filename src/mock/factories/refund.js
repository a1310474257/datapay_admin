import { dt } from './helpers'

export function seedRefund(db) {
  const candidates = db.order.filter((item) => [1, 4, 5].includes(item.status)).slice(0, 15)
  candidates.forEach((order, i) => {
    const status = i % 3
    db.refund.push({
      id: i + 1,
      order_id: order.id,
      user_id: order.user_id,
      amount: Math.min(order.actual_pay, 49900),
      reason: `退款申请原因 ${i + 1}`,
      status,
      remark: status === 2 ? '不符合退款条件' : '',
      refund_time: status === 1 ? dt() : null,
      created_at: dt(),
      updated_at: dt(),
    })
  })
}
