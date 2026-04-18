import { db } from '@/mock'
import { delay } from './mockApi'

// 更新个人信息：mock 中只更新 adminUser 首条记录。
export async function updateProfile(payload = {}) {
  await delay()
  const admin = db.adminUser[0]
  if (!admin) throw new Error('管理员信息不存在')
  admin.nickname = payload.nickname || admin.nickname
  admin.avatar = payload.avatar || admin.avatar || ''
  return {
    id: admin.id,
    username: admin.username,
    nickname: admin.nickname,
    avatar: admin.avatar || '',
    role: '超级管理员',
  }
}

// 修改密码：按文档要求只校验旧密码是否为 admin。
export async function changePassword(payload = {}) {
  await delay()
  if (payload.oldPassword !== 'admin') {
    throw new Error('原密码错误')
  }
  return { success: true }
}
