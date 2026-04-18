import { db } from '@/mock'
import { mockApi } from './mockApi'

export async function getResourceList(params = {}) {
  const base = await mockApi.crud(db.resource, params, {
    filterFields: ['status', 'resource_type', 'file_type'],
    defaultSort: 'id,desc',
    searchFields: ['title'],
  })
  return base
}

export async function createResource(data) {
  return mockApi.create(db.resource, data)
}

export async function updateResource(id, data) {
  return mockApi.update(db.resource, id, data)
}

export async function deleteResource(id) {
  return mockApi.remove(db.resource, id)
}

export async function findResourceById(id) {
  const row = await mockApi.findById(db.resource, id)
  if (!row) throw new Error('资源不存在')
  return row
}
