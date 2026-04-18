import { db } from '@/mock'
import { mockApi } from './mockApi'

export async function getHotSearchList(params = {}) {
  return mockApi.crud(db.hotSearch, params, {
    filterFields: ['status'],
    defaultSort: 'sort,asc',
    searchFields: ['keyword'],
  })
}

export async function createHotSearch(data) {
  return mockApi.create(db.hotSearch, {
    ...data,
    hits: data.hits ?? 0,
  })
}

export async function updateHotSearch(id, data) {
  return mockApi.update(db.hotSearch, id, data)
}

export async function deleteHotSearch(id) {
  return mockApi.remove(db.hotSearch, id)
}
