import request from './request'
import { fromBackendPage, makeRowMapper, toBackendParams } from './adapter'

const rowMapper = makeRowMapper()

// 列表：GET /api/admin/system/admins?username&status&page&size
// 视图传入的 keyword 实际是“账号”模糊匹配，映射为 username。
export async function getAdminUserList(params = {}) {
  const backendParams = toBackendParams(params, {
    username: params.username || params.keyword,
  })
  delete backendParams.keyword
  const page = await request.get('/admin/system/admins', { params: backendParams })
  return fromBackendPage(page, rowMapper)
}

// 创建：POST /api/admin/system/admins
export async function createAdminUser(data = {}) {
  return request.post('/admin/system/admins', {
    username: data.username,
    password: data.password,
    nickname: data.nickname,
    phone: data.phone,
    email: data.email,
    avatar: data.avatar,
    role: data.role || 'ROLE_ADMIN',
    status: data.status === undefined ? 1 : Number(data.status),
  })
}

// 更新：PUT /api/admin/system/admins/{id}
// 若 payload 含 password，则额外调用 reset-password 接口。
export async function updateAdminUser(id, data = {}) {
  await request.put(`/admin/system/admins/${id}`, {
    nickname: data.nickname,
    phone: data.phone,
    email: data.email,
    avatar: data.avatar,
    role: data.role,
    status: data.status,
  })
  if (data.password) {
    await resetAdminPassword(id, data.password)
  }
  return true
}

// 删除：DELETE /api/admin/system/admins/{id}
export async function deleteAdminUser(id) {
  return request.delete(`/admin/system/admins/${id}`)
}

// 重置密码：POST /api/admin/system/admins/{id}/reset-password
export async function resetAdminPassword(id, newPassword) {
  return request.post(`/admin/system/admins/${id}/reset-password`, { newPassword })
}
