import dayjs from 'dayjs'
import { db } from '@/mock'
import { now } from '@/utils/date'
import { delay, mockApi } from './mockApi'

const exportTasks = {}
let exportId = 1

function computeActivityStatus(row) {
  const d = dayjs(row.activity_date).startOf('day')
  const today = dayjs().startOf('day')
  if (d.isAfter(today)) return 'upcoming'
  if (d.isBefore(today)) return 'ended'
  return 'enrolling'
}

function decorateActivity(row) {
  if (!row) return row
  return {
    ...row,
    activity_status: computeActivityStatus(row),
  }
}

export async function getActivityList(params = {}) {
  await delay()
  const base = await mockApi.crud(db.activity, params, {
    filterFields: ['status', 'category_id'],
    defaultSort: 'id,desc',
    searchFields: ['title'],
  })
  const keyword = String(params.keyword || '').trim()
  let rows = keyword
    ? base.list.filter((item) => String(item.title || '').includes(keyword))
    : base.list
  return { ...base, list: rows.map(decorateActivity) }
}

export async function findActivityById(id) {
  const row = await mockApi.findById(db.activity, id)
  if (!row) throw new Error('活动不存在')
  return decorateActivity(row)
}

export async function createActivity(data) {
  const row = await mockApi.create(db.activity, data)
  return decorateActivity(row)
}

export async function updateActivity(id, data) {
  const row = await mockApi.update(db.activity, id, data)
  return decorateActivity(row)
}

export async function deleteActivity(id) {
  return mockApi.remove(db.activity, id)
}

// 嘉宾列表。
export async function getActivitySpeakers(activityId) {
  await delay()
  return db.activitySpeaker
    .filter((s) => Number(s.activity_id) === Number(activityId))
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map((s) => ({ ...s }))
}

export async function saveActivitySpeaker(activityId, data) {
  const aid = Number(activityId)
  if (data?.id) {
    return mockApi.update(db.activitySpeaker, data.id, { ...data, activity_id: aid })
  }
  return mockApi.create(db.activitySpeaker, { ...data, activity_id: aid })
}

export async function deleteActivitySpeaker(id) {
  return mockApi.remove(db.activitySpeaker, id)
}

// 报名列表 + 统计。
export async function getActivityRegisterList(params = {}) {
  await delay()
  const page = Number(params.page || 1)
  const pageSize = Number(params.pageSize || 10)
  let rows = db.activityRegister.map((r) => {
    const act = db.activity.find((a) => Number(a.id) === Number(r.activity_id))
    const user = db.user.find((u) => Number(u.id) === Number(r.user_id))
    return {
      ...r,
      activity_title: act?.title || '—',
      user_nickname: user?.nickname || '—',
    }
  })
  if (params.activity_id) {
    rows = rows.filter((r) => Number(r.activity_id) === Number(params.activity_id))
  }
  if (params.register_status !== '' && params.register_status !== undefined) {
    rows = rows.filter((r) => Number(r.register_status) === Number(params.register_status))
  }
  if (params.keyword) {
    const kw = String(params.keyword).trim()
    rows = rows.filter(
      (r) =>
        String(r.name || '').includes(kw) ||
        String(r.phone || '').includes(kw) ||
        String(r.activity_title || '').includes(kw),
    )
  }
  if (params.created_at?.length === 2) {
    const [start, end] = params.created_at
    rows = rows.filter(
      (r) => String(r.created_at) >= `${start} 00:00:00` && String(r.created_at) <= `${end} 23:59:59`,
    )
  }
  rows.sort((a, b) => Number(b.id) - Number(a.id))
  const total = rows.length
  const list = rows.slice((page - 1) * pageSize, page * pageSize)
  return { list, total, page, pageSize }
}

export async function getRegisterStats(activityId) {
  await delay()
  const rows = db.activityRegister.filter((r) => Number(r.activity_id) === Number(activityId))
  const enrolled = rows.length
  const checked = rows.filter((r) => Number(r.register_status) === 2).length
  return {
    enrolled,
    checked,
    rate: enrolled ? Math.round((checked / enrolled) * 1000) / 10 : 0,
  }
}

export async function checkinRegister(id) {
  return mockApi.update(db.activityRegister, id, { register_status: 2 })
}

export async function batchCheckinRegister(ids = []) {
  await delay()
  ids.forEach((id) => {
    const row = db.activityRegister.find((r) => Number(r.id) === Number(id))
    if (row) row.register_status = 2
  })
  return { success: true }
}

// 模拟扫码：输入核销码（此处用 id 字符串匹配演示）。
export async function verifyRegisterCode(activityId, code) {
  await delay()
  const row = db.activityRegister.find(
    (r) => Number(r.activity_id) === Number(activityId) && String(r.id) === String(code).trim(),
  )
  if (!row) throw new Error('无效的核销码')
  row.register_status = 2
  row.updated_at = now()
  return row
}

// 异步导出：创建任务后轮询直至完成，前端下载 CSV。
export async function createRegisterExportTask(filters = {}) {
  await delay()
  const taskId = exportId
  exportId += 1
  exportTasks[taskId] = { status: 'processing', progress: 10 }
  setTimeout(() => {
    const rows = db.activityRegister.filter((r) => {
      if (filters.activity_id && Number(r.activity_id) !== Number(filters.activity_id)) return false
      return true
    })
    const header = 'id,activity_id,user_id,name,phone,register_status,created_at\n'
    const body = rows
      .map((r) =>
        [r.id, r.activity_id, r.user_id, r.name, r.phone, r.register_status, r.created_at].join(','),
      )
      .join('\n')
    const csv = `\ufeff${header}${body}`
    exportTasks[taskId] = {
      status: 'done',
      progress: 100,
      downloadText: csv,
      fileName: `activity-register-${taskId}.csv`,
    }
  }, 1500)
  return { taskId }
}

export async function getExportTask(taskId) {
  await delay()
  return exportTasks[Number(taskId)] || { status: 'failed', message: '任务不存在' }
}
