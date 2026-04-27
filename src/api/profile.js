import request from './request'

/**
 * 更新当前管理员昵称/头像。
 * 对应后端 PUT /api/admin/auth/me
 * @param {{ nickname?: string, avatar?: string }} payload
 * @returns {Promise<AdminInfoVO>}
 */
export async function updateProfile(payload = {}) {
  return request.put('/admin/auth/me', payload)
}

/**
 * 修改当前管理员密码。
 * 对应后端 POST /api/admin/auth/change-password
 * @param {{ oldPassword: string, newPassword: string }} payload
 * @returns {Promise<void>}
 */
export async function changePassword(payload = {}) {
  return request.post('/admin/auth/change-password', payload)
}
