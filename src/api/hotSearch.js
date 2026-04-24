import request from './request'
import { fromBackendPage, makeRowMapper, withAliases } from './adapter'

// 热门搜索词：/api/admin/hot-searches
// 后端：pageNum / pageSize / keyword / status

const rowMapper = makeRowMapper(withAliases)

export async function getHotSearchList(params = {}) {
  const backendParams = {
    pageNum: params.page || 1,
    pageSize: params.pageSize || 10,
    keyword: params.keyword || undefined,
    status: params.status === '' || params.status === undefined ? undefined : Number(params.status),
  }
  Object.keys(backendParams).forEach((k) => {
    if (backendParams[k] === undefined || backendParams[k] === '') delete backendParams[k]
  })
  const page = await request.get('/admin/hot-searches', { params: backendParams })
  return fromBackendPage(page, rowMapper)
}

function toBackendPayload(data = {}) {
  return {
    keyword: data.keyword,
    sort: Number(data.sort ?? 0),
    status: data.status === undefined ? 1 : Number(data.status),
  }
}

export async function createHotSearch(data) {
  const id = await request.post('/admin/hot-searches', toBackendPayload(data))
  return { id }
}

export async function updateHotSearch(id, data) {
  await request.put(`/admin/hot-searches/${id}`, toBackendPayload(data))
  return { id }
}

export async function deleteHotSearch(id) {
  return request.delete(`/admin/hot-searches/${id}`)
}
