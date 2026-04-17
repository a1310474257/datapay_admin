export function seedProductSpecValue(db) {
  let id = 1
  db.productSpec.forEach((spec) => {
    const values = spec.name === '版本' ? ['基础版', '进阶版', '旗舰版'] : ['资料包', '答疑群', '直播回放']
    values.forEach((value, idx) => {
      db.productSpecValue.push({
        id,
        spec_id: spec.id,
        value,
        sort: idx + 1,
      })
      id += 1
    })
  })
}
