import { db } from '@/mock'
import { mockApi } from './mockApi'

export async function getAdminUserList(params = {}) {
  return mockApi.crud(db.adminUser, params, {
    searchFields: ['username', 'nickname'],
    defaultSort: 'id,asc',
    filterFields: [],
  })
}

export async function createAdminUser(data) {
  return mockApi.create(db.adminUser, data)
}

export async function updateAdminUser(id, data) {
  return mockApi.update(db.adminUser, id, data)
}

export async function deleteAdminUser(id) {
  if (Number(id) === 1) throw new Error('不能删除主账号')
  return mockApi.remove(db.adminUser, id)
}
