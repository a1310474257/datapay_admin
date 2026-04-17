export function seedProductSpec(db) {
  const names = ['版本', '附赠']
  let id = 1
  db.product.forEach((product) => {
    names.forEach((name, idx) => {
      db.productSpec.push({
        id,
        product_id: product.id,
        name,
        sort: idx + 1,
      })
      id += 1
    })
  })
}
