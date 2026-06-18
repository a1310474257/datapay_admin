import request from './request'
import { fromBackendPage, makeRowMapper, toBackendParams, withAliases } from './adapter'

const rowMapper = makeRowMapper(withAliases)

// 列表：GET /api/admin/resources?keyword&resourceType&categoryId&status&page&size
export async function getResourceList(params = {}) {
  const backendParams = toBackendParams(params, {
    resourceType: params.resourceType ?? params.resource_type,
    categoryId: params.categoryId ?? params.category_id,
  })
  delete backendParams.resource_type
  delete backendParams.category_id
  delete backendParams.file_type // 后端不支持按文件类型筛选
  const page = await request.get('/admin/resources', { params: backendParams })
  return fromBackendPage(page, rowMapper)
}

// 详情：GET /api/admin/resources/{id}
export async function findResourceById(id) {
  const data = await request.get(`/admin/resources/${id}`)
  if (!data) throw new Error('资源不存在')
  return withAliases(data)
}

function toBackendPayload(data = {}) {
  return {
    resourceType: data.resourceType ?? data.resource_type,
    categoryId: data.categoryId ?? data.category_id,
    title: data.title,
    cover: data.cover || '',
    brief: data.brief || '',
    description: data.description || '',
    fileType: data.fileType ?? data.file_type ?? '',
    // fileUrl 传 objectKey（UploadFile use-object-key 模式返回），后端兼容完整 URL 自动提取
    fileUrl: data.fileUrl ?? data.file_url ?? '',
    fileSize: data.fileSize ?? data.file_size ?? '',
    pages: data.pages == null ? 0 : Number(data.pages),
    previewPages: data.previewPages ?? data.preview_pages ?? 0,
    // previewUrl 同样传 objectKey
    previewUrl: data.previewUrl ?? data.preview_url ?? '',
    extraFiles: data.extraFiles ?? data.extra_files ?? '[]',
    // 业务更新日期（非系统自动时间戳），需显式传给后端
    updateTime: data.updateTime ?? data.update_time ?? '',
    price: data.price == null ? 0 : Number(data.price),
    originalPrice: data.price == null ? 0 : Number(data.price),
    status: data.status === undefined ? 1 : Number(data.status),
  }
}

// 创建：POST /api/admin/resources
export async function createResource(data) {
  const id = await request.post('/admin/resources', toBackendPayload(data))
  return { id }
}

// 更新：PUT /api/admin/resources/{id}
export async function updateResource(id, data) {
  await request.put(`/admin/resources/${id}`, toBackendPayload(data))
  return { id }
}

// 删除：DELETE /api/admin/resources/{id}
export async function deleteResource(id) {
  return request.delete(`/admin/resources/${id}`)
}

// 上下架：PATCH /api/admin/resources/{id}/status
export async function changeResourceStatus(id, status) {
  return request.patch(`/admin/resources/${id}/status`, { status: Number(status) })
}
