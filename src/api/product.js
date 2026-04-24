import request from './request'
import { fromBackendPage, makeRowMapper, toBackendParams, withAliases } from './adapter'

// 行映射：前端历史字段保持兼容（category_id / original_price 等）
function mapProductRow(row) {
  if (!row) return row
  return withAliases(row)
}
const rowMapper = makeRowMapper(mapProductRow)

// 列表：GET /api/admin/products?keyword&categoryId&status&page&size
export async function getProductList(params = {}) {
  const backendParams = toBackendParams(params, {
    categoryId: params.categoryId ?? params.category_id,
  })
  delete backendParams.category_id
  const page = await request.get('/admin/products', { params: backendParams })
  const normalized = fromBackendPage(page, rowMapper)
  // 视图列展示 category_name / spec_count，后端列表层不返回这些字段。
  // 这里给个占位，避免 UI 报错；若需要真实分类名，后续可在详情页或字典中解析。
  normalized.list = normalized.list.map((row) => ({
    ...row,
    category_name: row.category_name || '',
    spec_count: row.spec_count ?? 0,
  }))
  return normalized
}

// 详情：GET /api/admin/products/{id}
export async function findProductById(id) {
  const data = await request.get(`/admin/products/${id}`)
  if (!data) throw new Error('商品不存在')
  const row = withAliases(data)
  // 后端 images: [{id,imageUrl,sort}]，历史前端约定为 URL 字符串数组，二者都保留，兼容老组件。
  const imageUrls = (data.images || []).map((img) => img.imageUrl).filter(Boolean)
  const specs = (data.specs || []).map((s) => ({
    id: s.id,
    name: s.name,
    sort: s.sort,
    values: (s.values || []).map((v) => ({ id: v.id, value: v.value, sort: v.sort })),
  }))
  return {
    ...row,
    brief: row.brief || '',
    images: imageUrls,
    images_raw: data.images || [],
    specs,
  }
}

function toBackendImages(urls = []) {
  return (urls || []).map((url, idx) => ({ imageUrl: url, sort: idx }))
}

function toBackendSpecs(groups = []) {
  return (groups || []).map((g, gi) => ({
    name: g.name || `规格 ${gi + 1}`,
    sort: Number(g.sort ?? gi + 1),
    values: (g.values || []).map((v, vi) => ({
      value: v.value || `值 ${vi + 1}`,
      sort: Number(v.sort ?? vi + 1),
    })),
  }))
}

function toBackendPayload(data = {}, { includeImagesSpecs = false } = {}) {
  const payload = {
    categoryId: data.categoryId ?? data.category_id,
    title: data.title,
    cover: data.cover,
    description: data.description,
    price: data.price === undefined ? undefined : Number(data.price),
    originalPrice: data.originalPrice ?? data.original_price,
    stock: data.stock === undefined ? undefined : Number(data.stock),
    status: data.status === undefined ? undefined : Number(data.status),
  }
  if (includeImagesSpecs) {
    if (Array.isArray(data.images)) payload.images = toBackendImages(data.images)
    if (Array.isArray(data.specs)) payload.specs = toBackendSpecs(data.specs)
  }
  return payload
}

// 创建：POST /api/admin/products
export async function createProduct(data) {
  const payload = toBackendPayload(data, { includeImagesSpecs: true })
  // 创建时 originalPrice 若未填则置 0，防止后端校验失败
  if (payload.originalPrice == null) payload.originalPrice = 0
  const id = await request.post('/admin/products', payload)
  return { id }
}

// 更新：PUT /api/admin/products/{id}
export async function updateProduct(id, data) {
  const payload = toBackendPayload(data)
  await request.put(`/admin/products/${id}`, payload)
  return { id }
}

// 删除：DELETE /api/admin/products/{id}
export async function deleteProduct(id) {
  return request.delete(`/admin/products/${id}`)
}

// 保存轮播图：复用 PUT /{id} 的 images 整体覆盖能力
export async function saveImages(productId, urls = []) {
  await request.put(`/admin/products/${productId}`, {
    images: toBackendImages(urls),
  })
  return { success: true }
}

// 保存规格：复用 PUT /{id} 的 specs 整体覆盖能力
export async function saveSpecs(productId, specGroups = []) {
  await request.put(`/admin/products/${productId}`, {
    specs: toBackendSpecs(specGroups),
  })
  return { success: true }
}

// 上下架：PATCH /api/admin/products/{id}/status
export async function changeProductStatus(id, status) {
  return request.patch(`/admin/products/${id}/status`, { status: Number(status) })
}
