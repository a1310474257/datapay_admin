import request from './request'
import { fromBackendPage, makeRowMapper, withAliases } from './adapter'

// 讲师管理：/api/admin/teachers
// 后端没有 sort 字段；前端保持展示 intro/brief 兼容历史。

function mapRow(row) {
  const aliased = withAliases(row)
  return {
    ...aliased,
    brief: row.intro,
  }
}
const rowMapper = makeRowMapper(mapRow)

export async function getTeacherList(params = {}) {
  const backendParams = {
    pageNum: params.page || 1,
    pageSize: params.pageSize || 10,
    name: params.keyword || params.name || undefined,
    status: params.status === '' || params.status === undefined ? undefined : Number(params.status),
  }
  Object.keys(backendParams).forEach((k) => {
    if (backendParams[k] === undefined || backendParams[k] === '') delete backendParams[k]
  })
  const page = await request.get('/admin/teachers', { params: backendParams })
  return fromBackendPage(page, rowMapper)
}

function toBackendPayload(data = {}) {
  return {
    name: data.name,
    avatar: data.avatar || '',
    title: data.title || '',
    intro: data.intro || data.brief || '',
    status: data.status === undefined ? 1 : Number(data.status),
  }
}

export async function createTeacher(data) {
  const id = await request.post('/admin/teachers', toBackendPayload(data))
  return { id }
}

export async function updateTeacher(id, data) {
  await request.put(`/admin/teachers/${id}`, toBackendPayload(data))
  return { id }
}

export async function deleteTeacher(id) {
  return request.delete(`/admin/teachers/${id}`)
}

export async function findTeacherById(id) {
  const row = await request.get(`/admin/teachers/${id}`)
  return row ? mapRow(row) : null
}
