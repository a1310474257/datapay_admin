import { db } from '@/mock'
import { now } from '@/utils/date'
import { delay, mockApi } from './mockApi'

function categoryName(id) {
  const row = db.category.find((c) => Number(c.id) === Number(id))
  return row?.name || '—'
}

function decorateProduct(row) {
  if (!row) return row
  const specCount = db.productSpec.filter((s) => Number(s.product_id) === Number(row.id)).length
  return {
    ...row,
    category_name: categoryName(row.category_id),
    spec_count: specCount,
  }
}

export async function getProductList(params = {}) {
  await delay()
  const base = await mockApi.crud(db.product, params, {
    filterFields: ['status', 'category_id'],
    defaultSort: 'id,desc',
    searchFields: ['title'],
  })
  let rows = base.list
  return { ...base, list: rows.map(decorateProduct) }
}

export async function findProductById(id) {
  const row = await mockApi.findById(db.product, id)
  if (!row) throw new Error('商品不存在')
  const images = db.productImage
    .filter((img) => Number(img.product_id) === Number(id))
    .sort((a, b) => Number(a.sort) - Number(b.sort))
    .map((img) => img.image_url)
  const specs = db.productSpec
    .filter((s) => Number(s.product_id) === Number(id))
    .sort((a, b) => Number(a.sort) - Number(b.sort))
    .map((s) => ({
      id: s.id,
      name: s.name,
      sort: s.sort,
      values: db.productSpecValue
        .filter((v) => Number(v.spec_id) === Number(s.id))
        .sort((a, b) => Number(a.sort) - Number(b.sort))
        .map((v) => ({ id: v.id, value: v.value, sort: v.sort })),
    }))
  return { ...decorateProduct(row), images, specs }
}

export async function createProduct(data) {
  const row = await mockApi.create(db.product, data)
  return decorateProduct(row)
}

export async function updateProduct(id, data) {
  const row = await mockApi.update(db.product, id, data)
  return decorateProduct(row)
}

export async function deleteProduct(id) {
  return mockApi.remove(db.product, id)
}

// 轮播图：整表替换该商品的图片行。
export async function saveImages(productId, urls = []) {
  await delay()
  const pid = Number(productId)
  db.productImage = db.productImage.filter((img) => Number(img.product_id) !== pid)
  let nextId = db.productImage.reduce((m, r) => Math.max(m, Number(r.id || 0)), 0) + 1
  const stamp = now()
  urls.forEach((url, idx) => {
    db.productImage.push({
      id: nextId,
      product_id: pid,
      image_url: url,
      sort: idx + 1,
      created_at: stamp,
      updated_at: stamp,
    })
    nextId += 1
  })
  return { success: true }
}

// 规格：先删后插，保持与主表 price/stock 无 SKU 拆分的约定。
export async function saveSpecs(productId, specGroups = []) {
  await delay()
  const pid = Number(productId)
  const specIds = db.productSpec.filter((s) => Number(s.product_id) === pid).map((s) => s.id)
  db.productSpecValue = db.productSpecValue.filter((v) => !specIds.includes(Number(v.spec_id)))
  db.productSpec = db.productSpec.filter((s) => Number(s.product_id) !== pid)

  let nextSpecId = db.productSpec.reduce((m, r) => Math.max(m, Number(r.id || 0)), 0) + 1
  let nextValId = db.productSpecValue.reduce((m, r) => Math.max(m, Number(r.id || 0)), 0) + 1
  const stamp = now()
  specGroups.forEach((g, gi) => {
    const sid = nextSpecId
    nextSpecId += 1
    db.productSpec.push({
      id: sid,
      product_id: pid,
      name: g.name || `规格 ${gi + 1}`,
      sort: Number(g.sort ?? gi + 1),
    })
    const values = Array.isArray(g.values) ? g.values : []
    values.forEach((v, vi) => {
      db.productSpecValue.push({
        id: nextValId,
        spec_id: sid,
        value: v.value || `值 ${vi + 1}`,
        sort: Number(v.sort ?? vi + 1),
      })
      nextValId += 1
    })
  })
  return { success: true }
}
