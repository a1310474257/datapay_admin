import { pic } from './helpers'

export function seedProductImage(db) {
  let id = 1
  db.product.forEach((product) => {
    for (let i = 1; i <= 4; i += 1) {
      db.productImage.push({
        id,
        product_id: product.id,
        image_url: pic(`product-${product.id}-${i}`),
        sort: i,
      })
      id += 1
    }
  })
}
