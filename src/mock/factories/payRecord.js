import { faker } from '@faker-js/faker'
import { dt } from './helpers'

export function seedPayRecord(db) {
  const paidOrders = db.order.filter((item) => [1, 2, 3, 4, 5].includes(item.status))
  for (let i = 1; i <= 320; i += 1) {
    const order = paidOrders[(i - 1) % paidOrders.length]
    db.payRecord.push({
      id: i,
      order_id: order.id,
      order_no: order.order_no,
      user_id: order.user_id,
      amount: order.actual_pay,
      wx_prepay_id: `prepay_${faker.string.alphanumeric(18)}`,
      wx_transaction_id: i % 6 === 0 ? '' : `wx_${faker.string.alphanumeric(24)}_${i}`,
      status: i % 9 === 0 ? 2 : 1,
      paid_at: dt(),
      created_at: dt(),
      updated_at: dt(),
    })
  }
}
