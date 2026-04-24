import request from './request'
import { fromBackendPage, makeRowMapper, withAliases } from './adapter'

// Banner 管理：/api/admin/banners
// 后端命名：pageNum / pageSize / image / type / targetId / title / sort / status

function mapRow(row) {
  return {
    ...withAliases(row),
    target_id: row.targetId ?? row.target_id,
    target_title: '', // 后端未返回关联标题，候选列表里可从 searchBannerTargets 获取
  }
}
const rowMapper = makeRowMapper(mapRow)

export async function getBannerList(params = {}) {
  const backendParams = {
    pageNum: params.page || 1,
    pageSize: params.pageSize || 10,
    keyword: params.title || params.keyword || undefined,
    status: params.status === '' || params.status === undefined ? undefined : Number(params.status),
    type: params.type === '' || params.type === undefined ? undefined : Number(params.type),
  }
  Object.keys(backendParams).forEach((k) => {
    if (backendParams[k] === undefined || backendParams[k] === '') delete backendParams[k]
  })
  const page = await request.get('/admin/banners', { params: backendParams })
  return fromBackendPage(page, rowMapper)
}

function toBackendPayload(data = {}) {
  return {
    image: data.image,
    type: Number(data.type),
    targetId: Number(data.target_id ?? data.targetId ?? 0),
    title: data.title || '',
    sort: Number(data.sort ?? 0),
    status: data.status === undefined ? 1 : Number(data.status),
  }
}

export async function createBanner(data) {
  const id = await request.post('/admin/banners', toBackendPayload(data))
  return { id }
}

export async function updateBanner(id, data) {
  await request.put(`/admin/banners/${id}`, toBackendPayload(data))
  return { id }
}

export async function deleteBanner(id) {
  return request.delete(`/admin/banners/${id}`)
}

export async function findBannerById(id) {
  const row = await request.get(`/admin/banners/${id}`)
  return row ? mapRow(row) : null
}

// 目标候选：根据类型分别调对应的 admin 列表接口。
// type: 1-课程 2-活动 3-商品 4-HR工具（resource type=1）
export async function searchBannerTargets(type, params = {}) {
  const keyword = params.keyword || ''
  const page = params.page || 1
  const pageSize = params.pageSize || 10
  const t = Number(type)
  let url
  const query = { page, size: pageSize, keyword }
  if (t === 1) {
    url = '/admin/courses'
  } else if (t === 2) {
    url = '/admin/activities'
    // 活动接口使用 pageNum/pageSize
    delete query.page
    delete query.size
    query.pageNum = page
    query.pageSize = pageSize
  } else if (t === 3) {
    url = '/admin/products'
  } else if (t === 4) {
    url = '/admin/resources'
    query.resourceType = 1
  } else {
    return { list: [], total: 0, page, pageSize }
  }
  Object.keys(query).forEach((k) => {
    if (query[k] === undefined || query[k] === '') delete query[k]
  })
  const res = await request.get(url, { params: query }).catch(() => null)
  if (!res) return { list: [], total: 0, page, pageSize }
  const normalized = fromBackendPage(res, makeRowMapper((r) => ({
    id: r.id,
    title: r.title || r.name,
  })))
  return normalized
}
