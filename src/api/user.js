import { db } from '@/mock'
import { mockApi } from './mockApi'

// 根据用户 id 生成稳定的扩展信息（mock 没有建表时用该函数补足详情字段）。
function buildUserExtra(user) {
  const id = Number(user?.id || 0)
  return {
    gender: id % 3 === 0 ? '女' : '男',
    birthday: `199${id % 10}-0${(id % 9) + 1}-1${id % 9}`,
    last_login_at: user?.updated_at || user?.created_at || '',
  }
}

// 用户列表：支持关键字（昵称/手机/openid）与状态筛选。
export async function getUserList(params = {}) {
  const base = await mockApi.crud(db.user, params, {
    filterFields: ['status'],
  })
  const keyword = String(params.keyword || '').trim()
  const rows = keyword
    ? base.list.filter((item) =>
      [item.nickname, item.phone, item.openid].some((field) => String(field || '').includes(keyword)))
    : base.list
  return { ...base, list: rows }
}

// 获取用户详情：P0 只返回基础信息字段。
export async function getUserDetail(id) {
  const user = await mockApi.findById(db.user, id)
  if (!user) throw new Error('用户不存在')
  return { ...user, ...buildUserExtra(user) }
}

// 封禁用户。
export async function banUser(id) {
  return mockApi.update(db.user, id, { status: 0 })
}

// 解封用户。
export async function unbanUser(id) {
  return mockApi.update(db.user, id, { status: 1 })
}

// 强制下线：mock 里仅保留成功态，便于前端流程联调。
export async function forceLogout() {
  return { success: true }
}
