import { dt } from './helpers'

function pickByType(db, orderType, index) {
  if (orderType === 1) return db.course[index % db.course.length]
  if (orderType === 2 || orderType === 3) return db.resource[index % db.resource.length]
  if (orderType === 4) return db.activity[index % db.activity.length]
  return db.product[index % db.product.length]
}

export function seedOrderItem(db) {
  let id = 1
  for (let i = 0; i < 600; i += 1) {
    const order = db.order[i % db.order.length]
    const item = pickByType(db, order.order_type, i)
    db.orderItem.push({
      id,
      order_id: order.id,
      item_id: item.id,
      title: item.title,
      cover: item.cover,
      spec: order.order_type === 5 ? '旗舰版 / 资料包' : '',
      price: item.price || 0,
      quantity: order.order_type === 5 ? ((i % 3) + 1) : 1,
      created_at: dt(),
    })
    id += 1
  }
}
