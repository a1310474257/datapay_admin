import request from './request'
import { fromBackendPage, makeRowMapper, withAliases } from './adapter'

// 公告管理：/api/admin/notices
// 后端：pageNum / pageSize / title / status / publishedStart / publishedEnd

function mapRow(row) {
  return {
    ...withAliases(row),
    link_url: row.linkUrl ?? row.link_url,
    published_at: row.publishedAt ?? row.published_at,
  }
}
const rowMapper = makeRowMapper(mapRow)

export async function getNoticeList(params = {}) {
  const [pubStart, pubEnd] = Array.isArray(params.published_at) ? params.published_at : []
  const backendParams = {
    pageNum: params.page || 1,
    pageSize: params.pageSize || 10,
    title: params.title || params.keyword || undefined,
    status: params.status === '' || params.status === undefined ? undefined : Number(params.status),
    publishedStart: pubStart,
    publishedEnd: pubEnd,
  }
  Object.keys(backendParams).forEach((k) => {
    if (backendParams[k] === undefined || backendParams[k] === '') delete backendParams[k]
  })
  const page = await request.get('/admin/notices', { params: backendParams })
  return fromBackendPage(page, rowMapper)
}

function toBackendPayload(data = {}) {
  return {
    title: data.title,
    image: data.image || '',
    linkUrl: data.link_url || data.linkUrl || '',
    content: data.content || '',
    status: data.status === undefined ? 1 : Number(data.status),
    publishedAt: data.published_at || data.publishedAt || undefined,
  }
}

export async function createNotice(data) {
  const id = await request.post('/admin/notices', toBackendPayload(data))
  return { id }
}

export async function updateNotice(id, data) {
  await request.put(`/admin/notices/${id}`, toBackendPayload(data))
  return { id }
}

export async function deleteNotice(id) {
  return request.delete(`/admin/notices/${id}`)
}

export async function findNoticeById(id) {
  const row = await request.get(`/admin/notices/${id}`)
  if (!row) throw new Error('公告不存在')
  return mapRow(row)
}
