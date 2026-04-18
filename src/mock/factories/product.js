import { faker } from '@faker-js/faker'
import { dt, pic, richText } from './helpers'

export function seedProduct(db) {
  for (let i = 1; i <= 20; i += 1) {
    db.product.push({
      id: i,
      category_id: ((i - 1) % db.category.length) + 1,
      title: `Physical Product ${i}`,
      cover: pic(`product-${i}`),
      brief: `商品 ${i} 的一句话卖点，便于列表展示。`,
      description: richText(`Product ${i}`),
      price: faker.number.int({ min: 9900, max: 89900 }),
      original_price: faker.number.int({ min: 12900, max: 129900 }),
      stock: faker.number.int({ min: 50, max: 600 }),
      sales: faker.number.int({ min: 10, max: 800 }),
      status: 1,
      created_at: dt(),
      updated_at: dt(),
      deleted_at: null,
    })
  }
}
