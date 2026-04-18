import { db } from '@/mock'
import { mockApi } from './mockApi'

export async function getNoticeList(params = {}) {
  return mockApi.crud(db.notice, params, {
    filterFields: ['status'],
    defaultSort: 'id,desc',
    searchFields: ['title'],
  })
}

export async function createNotice(data) {
  return mockApi.create(db.notice, data)
}

export async function updateNotice(id, data) {
  return mockApi.update(db.notice, id, data)
}

export async function deleteNotice(id) {
  return mockApi.remove(db.notice, id)
}

export async function findNoticeById(id) {
  const row = await mockApi.findById(db.notice, id)
  if (!row) throw new Error('公告不存在')
  return row
}
