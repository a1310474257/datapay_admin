import { db } from '@/mock'
import { delay, mockApi } from './mockApi'

function resolveTargetTitle(type, targetId) {
  const id = Number(targetId)
  if (!id) return ''
  if (Number(type) === 1) return db.course.find((c) => Number(c.id) === id)?.title || ''
  if (Number(type) === 2) return db.activity.find((a) => Number(a.id) === id)?.title || ''
  if (Number(type) === 3) return db.product.find((p) => Number(p.id) === id)?.title || ''
  if (Number(type) === 4) {
    const r = db.resource.find((x) => Number(x.id) === id && Number(x.resource_type) === 1)
    return r?.title || ''
  }
  return ''
}

function decorate(row) {
  return {
    ...row,
    target_title: resolveTargetTitle(row.type, row.target_id),
  }
}

export async function getBannerList(params = {}) {
  const base = await mockApi.crud(db.banner, params, {
    filterFields: ['status', 'type'],
    defaultSort: 'sort,asc',
    searchFields: ['title'],
  })
  return { ...base, list: base.list.map(decorate) }
}

export async function createBanner(data) {
  return mockApi.create(db.banner, data)
}

export async function updateBanner(id, data) {
  return mockApi.update(db.banner, id, data)
}

export async function deleteBanner(id) {
  return mockApi.remove(db.banner, id)
}

export async function findBannerById(id) {
  const row = await mockApi.findById(db.banner, id)
  return row ? decorate(row) : null
}

// 供 TargetPicker 远程搜索：按类型拉取候选列表。
export async function searchBannerTargets(type, params = {}) {
  await delay()
  const keyword = String(params.keyword || '').trim()
  const page = Number(params.page || 1)
  const pageSize = Number(params.pageSize || 10)
  let rows = []
  const t = Number(type)
  if (t === 1) rows = db.course.filter((r) => r.deleted_at == null)
  else if (t === 2) rows = db.activity.filter((r) => r.deleted_at == null)
  else if (t === 3) rows = db.product.filter((r) => r.deleted_at == null)
  else if (t === 4) rows = db.resource.filter((r) => r.deleted_at == null && Number(r.resource_type) === 1)
  if (keyword) {
    rows = rows.filter((r) => String(r.title || '').includes(keyword))
  }
  rows = rows.sort((a, b) => Number(b.id) - Number(a.id))
  const total = rows.length
  const list = rows.slice((page - 1) * pageSize, page * pageSize).map((r) => ({ id: r.id, title: r.title }))
  return { list, total, page, pageSize }
}
