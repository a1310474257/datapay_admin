import request from './request'
import { fromBackendPage, makeRowMapper, toBackendParams } from './adapter'

// 分类字段映射：后端 scene ↔ 前端 business_type
function mapCategoryRow(row) {
  if (!row) return row
  return {
    ...row,
    business_type: row.scene,
  }
}
const rowMapper = makeRowMapper(mapCategoryRow)

// 列表：GET /api/admin/categories?keyword&scene&status&page&size
export async function getCategoryList(params = {}) {
  const backendParams = toBackendParams(params, {
    // 前端传 business_type → 后端 scene
    scene: params.business_type,
  })
  // 移除前端独有字段
  delete backendParams.business_type
  // 关键字参数：前端 keyword → 后端 keyword（保持一致）
  const page = await request.get('/admin/categories', { params: backendParams })
  return fromBackendPage(page, rowMapper)
}

function toBackendPayload(data = {}) {
  return {
    name: data.name,
    scene: data.business_type ?? data.scene,
    icon: data.icon || '',
    sort: Number(data.sort || 0),
    status: data.status === undefined ? 1 : Number(data.status),
  }
}

// 创建：POST /api/admin/categories
export async function createCategory(data) {
  return request.post('/admin/categories', toBackendPayload(data))
}

// 更新：PUT /api/admin/categories/{id}
export async function updateCategory(id, data) {
  return request.put(`/admin/categories/${id}`, toBackendPayload(data))
}

// 删除：DELETE /api/admin/categories/{id}
export async function deleteCategory(id) {
  return request.delete(`/admin/categories/${id}`)
}

// 启/禁用：PATCH /api/admin/categories/{id}/status
export async function changeCategoryStatus(id, status) {
  return request.patch(`/admin/categories/${id}/status`, { status: Number(status) })
}
