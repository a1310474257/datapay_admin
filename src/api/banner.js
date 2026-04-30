import request from './request'
import { fromBackendPage, makeRowMapper, withAliases } from './adapter'

// Banner 管理：/api/admin/banners
// 后端命名：pageNum / pageSize / image / type / targetId / title / sort / status

function mapRow(row) {
  return {
    ...withAliases(row),
    target_id: row.targetId ?? row.target_id,
    resource_type: row.resourceType ?? row.resource_type ?? null,
    target_title: '', // 后端未返回关联标题，候选列表里可从 searchBannerTargets 获取
  }
}
const rowMapper = makeRowMapper(mapRow)

/**
 * 根据轮播类型与目标ID请求详情接口，兜底获取目标标题。
 * 说明：
 * 1. 后端 Banner 列表当前未返回 targetTitle；
 * 2. 前端列表展示需要目标名称，因此在列表接口后追加一次按行补全；
 * 3. 任意一条补全失败时静默降级，避免影响主列表渲染。
 */
async function fetchTargetTitleByRow(row) {
  const type = Number(row.type)
  const targetId = Number(row.target_id ?? row.targetId)
  if (!type || !targetId) return ''
  let detailUrl = ''
  if (type === 1) {
    detailUrl = `/admin/courses/${targetId}`
  } else if (type === 2) {
    detailUrl = `/admin/resources/${targetId}`
  } else if (type === 3) {
    detailUrl = `/admin/products/${targetId}`
  } else if (type === 4) {
    detailUrl = `/admin/activities/${targetId}`
  } else {
    return ''
  }
  const detail = await request.get(detailUrl).catch(() => null)
  return detail?.title || detail?.name || ''
}

async function fillBannerTargetTitles(list = []) {
  const tasks = list.map(async (row) => {
    if (row.target_title) return row
    const targetTitle = await fetchTargetTitleByRow(row)
    return {
      ...row,
      target_title: targetTitle,
    }
  })
  return Promise.all(tasks)
}

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
  const normalized = fromBackendPage(page, rowMapper)
  const list = await fillBannerTargetTitles(normalized.list || [])
  return {
    ...normalized,
    list,
  }
}

function toBackendPayload(data = {}) {
  const type = Number(data.type)
  const rawResourceType = data.resource_type ?? data.resourceType
  return {
    image: data.image,
    type,
    targetId: Number(data.target_id ?? data.targetId ?? 0),
    // 仅在“资源”类型下提交 resourceType，避免污染其他类型参数
    resourceType: type === 2 && rawResourceType !== null && rawResourceType !== undefined ? Number(rawResourceType) : undefined,
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
// type: 1-课程 2-资源 3-商品 4-活动
// 注意：各列表 Query 参数不一致（课程用 pageNum/pageSize/title，资源/商品用 page/size/keyword，
// 活动用 pageNum/pageSize/keyword），需与各模块 api 保持一致。
export async function searchBannerTargets(type, params = {}) {
  const keyword = params.keyword || ''
  const page = params.page || 1
  const pageSize = params.pageSize || 10
  const resourceType = params.resourceType === undefined ? undefined : Number(params.resourceType)
  const t = Number(type)
  let url
  /** @type {Record<string, unknown>} */
  let query = {}
  if (t === 1) {
    // 与 src/api/course.js getCourseList 一致（CourseQueryDTO）
    url = '/admin/courses'
    query = {
      pageNum: page,
      pageSize,
      ...(keyword ? { title: keyword } : {}),
    }
  } else if (t === 2) {
    url = '/admin/resources'
    query = { page, size: pageSize, ...(keyword ? { keyword } : {}) }
    if (resourceType !== undefined && resourceType !== null && !Number.isNaN(resourceType)) {
      query.resourceType = resourceType
    }
  } else if (t === 3) {
    url = '/admin/products'
    query = { page, size: pageSize, ...(keyword ? { keyword } : {}) }
  } else if (t === 4) {
    url = '/admin/activities'
    query = {
      pageNum: page,
      pageSize,
      ...(keyword ? { keyword } : {}),
    }
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
