import { faker } from '@faker-js/faker'
import { dt, EXPRESS_COMPANIES } from './helpers'
import { genOrderNo } from '@/utils/orderNo'

function buildAddress(i) {
  return {
    name: `Receiver ${i}`,
    phone: `138${String(10000000 + i).slice(-8)}`,
    detail: `Demo Street ${(i % 50) + 1}`,
  }
}

export function seedOrder(db) {
  for (let i = 1; i <= 400; i += 1) {
    const orderType = ((i - 1) % 5) + 1
    const status = (i - 1) % 7
    const goodsTotal = faker.number.int({ min: 9900, max: 189900 })
    const freight = orderType === 5 ? faker.number.int({ min: 0, max: 1200 }) : 0
    const discount = faker.number.int({ min: 0, max: 3000 })
    const actualPay = Math.max(0, goodsTotal + freight - discount)
    const paid = [1, 2, 3, 4, 5].includes(status)
    db.order.push({
      id: i,
      order_no: genOrderNo(),
      user_id: ((i - 1) % db.user.length) + 1,
      order_type: orderType,
      status,
      goods_total: goodsTotal,
      freight,
      discount,
      actual_pay: actualPay,
      address_snap: orderType === 5 ? buildAddress(i) : null,
      express_company: status >= 2 && orderType === 5 ? EXPRESS_COMPANIES[i % EXPRESS_COMPANIES.length] : '',
      express_no: status >= 2 && orderType === 5 ? `SF${faker.string.numeric(12)}` : '',
      pay_time: paid ? dt() : null,
      ship_time: status >= 2 ? dt() : null,
      finish_time: status === 3 ? dt() : null,
      cancel_time: status === 6 ? dt() : null,
      pay_expire_at: status === 0 ? dt() : null,
      created_at: dt(),
      updated_at: dt(),
      deleted_at: null,
    })
  }
}
