import dayjs from 'dayjs'
import request from './request'
import { fromBackendPage, makeRowMapper, withAliases } from './adapter'

// 活动相关 API 对接 /api/admin/activities（含嘉宾和报名）。
// 注意：后端 ActivityAdminQueryDTO 使用 pageNum/pageSize 而不是 page/size，
// 这里做特殊处理。

function computeActivityStatus(row) {
  if (!row?.activityDate && !row?.activity_date) return 'upcoming'
  const date = row.activityDate || row.activity_date
  const d = dayjs(date).startOf('day')
  const today = dayjs().startOf('day')
  if (d.isAfter(today)) return 'upcoming'
  if (d.isBefore(today)) return 'ended'
  return 'enrolling'
}

function decorate(row) {
  if (!row) return row
  const aliased = withAliases(row)
  return {
    ...aliased,
    activity_status: computeActivityStatus(aliased),
  }
}
const rowMapper = makeRowMapper(decorate)

// 列表：GET /api/admin/activities
export async function getActivityList(params = {}) {
  const [activityDateStart, activityDateEnd] = Array.isArray(params.activity_date) ? params.activity_date : []
  const backendParams = {
    pageNum: params.page || 1,
    pageSize: params.pageSize || 10,
    keyword: params.keyword || undefined,
    categoryId: params.category_id || params.categoryId || undefined,
    status: params.status === '' || params.status === undefined ? undefined : Number(params.status),
    activityDateStart,
    activityDateEnd,
  }
  Object.keys(backendParams).forEach((k) => {
    if (backendParams[k] === undefined || backendParams[k] === '') delete backendParams[k]
  })
  const page = await request.get('/admin/activities', { params: backendParams })
  return fromBackendPage(page, rowMapper)
}

export async function findActivityById(id) {
  const data = await request.get(`/admin/activities/${id}`)
  if (!data) throw new Error('活动不存在')
  return decorate(data)
}

function toBackendPayload(data = {}) {
  return {
    categoryId: data.category_id ?? data.categoryId ?? 0,
    title: data.title,
    cover: data.cover || '',
    description: data.description || '',
    activityDate: data.activity_date || data.activityDate,
    timeRange: data.time_range || data.timeRange,
    location: data.location,
    price: data.price == null ? 0 : Number(data.price),
    originalPrice: data.original_price ?? data.originalPrice ?? 0,
    limitCount: data.limit_count ?? data.limitCount ?? 0,
    agenda: typeof data.agenda === 'string' ? data.agenda : (data.agenda ? JSON.stringify(data.agenda) : ''),
    status: data.status === undefined ? 1 : Number(data.status),
  }
}

export async function createActivity(data) {
  const id = await request.post('/admin/activities', toBackendPayload(data))
  return { id }
}

export async function updateActivity(id, data) {
  await request.put(`/admin/activities/${id}`, toBackendPayload(data))
  return { id }
}

export async function deleteActivity(id) {
  return request.delete(`/admin/activities/${id}`)
}

// ------- 嘉宾：/api/admin/activities/{activityId}/speakers -------
export async function getActivitySpeakers(activityId) {
  // 后端是分页；业务实际不会很多，这里取第一页 100 条。
  const page = await request.get(`/admin/activities/${activityId}/speakers`, {
    params: { pageNum: 1, pageSize: 100 },
  })
  const normalized = fromBackendPage(page, makeRowMapper())
  return normalized.list
}

export async function saveActivitySpeaker(activityId, data) {
  const payload = {
    name: data.name,
    title: data.title || '',
    avatar: data.avatar || '',
    sort: Number(data.sort ?? 0),
  }
  if (data.id) {
    await request.put(`/admin/activities/${activityId}/speakers/${data.id}`, payload)
    return { id: data.id }
  }
  const id = await request.post(`/admin/activities/${activityId}/speakers`, payload)
  return { id }
}

export async function deleteActivitySpeaker(activityId, speakerId) {
  return request.delete(`/admin/activities/${activityId}/speakers/${speakerId}`)
}

// ------- 报名：/api/admin/activities/{activityId}/registers -------
// 列表视图有 activity_id 筛选；后端要求 activityId 作为 path 参数，需要先选活动。
export async function getActivityRegisterList(params = {}) {
  const activityId = params.activity_id || params.activityId
  if (!activityId) {
    return { list: [], total: 0, page: Number(params.page || 1), pageSize: Number(params.pageSize || 10) }
  }
  const backendParams = {
    page: params.page || 1,
    size: params.pageSize || 10,
    keyword: params.keyword || undefined,
    registerStatus: params.register_status === '' || params.register_status === undefined
      ? undefined
      : Number(params.register_status),
  }
  Object.keys(backendParams).forEach((k) => {
    if (backendParams[k] === undefined || backendParams[k] === '') delete backendParams[k]
  })
  const page = await request.get(`/admin/activities/${activityId}/registers`, { params: backendParams })
  return fromBackendPage(page, makeRowMapper((row) => ({
    ...row,
    activity_id: row.activityId,
    user_id: row.userId,
    user_nickname: row.userNickname,
    register_status: row.registerStatus,
    register_status_label: row.registerStatusLabel,
    created_at: row.createTime,
  })))
}

export async function getRegisterStats(activityId) {
  if (!activityId) return { enrolled: 0, checked: 0, rate: 0 }
  // 简易统计：拉取所有报名分两次（限 100）。业务量大时应后端提供统计接口。
  const [all, checked] = await Promise.all([
    request.get(`/admin/activities/${activityId}/registers`, { params: { page: 1, size: 1 } }),
    request.get(`/admin/activities/${activityId}/registers`, { params: { page: 1, size: 1, registerStatus: 2 } }),
  ])
  const enrolled = Number(all?.total || 0)
  const checkedCnt = Number(checked?.total || 0)
  return {
    enrolled,
    checked: checkedCnt,
    rate: enrolled ? Math.round((checkedCnt / enrolled) * 1000) / 10 : 0,
  }
}

// 单条签到。为兼容视图层仅传 registerId 的历史写法：
//   checkinRegister(registerId, activityId?)
//   checkinRegister({ id, activity_id })
// 两种调用方式均能工作；若调用方传入整条行对象，则自动从 activity_id 字段取活动ID。
export async function checkinRegister(registerOrId, activityIdArg) {
  let registerId = registerOrId
  let activityId = activityIdArg
  if (registerOrId && typeof registerOrId === 'object') {
    registerId = registerOrId.id
    activityId = registerOrId.activity_id || registerOrId.activityId
  }
  if (!activityId) {
    throw new Error('签到需要活动ID，请在列表行对象中携带 activity_id')
  }
  return request.post(`/admin/activities/${activityId}/registers/${registerId}/check-in`)
}

// 批量签到。同时兼容 batchCheckinRegister(ids) 与 batchCheckinRegister(rows) 两种调用。
export async function batchCheckinRegister(rowsOrIds = [], activityIdArg) {
  const tasks = rowsOrIds.map((item) => {
    if (item && typeof item === 'object') {
      return checkinRegister(item)
    }
    return checkinRegister(item, activityIdArg)
  })
  await Promise.all(tasks)
  return { success: true }
}

export async function verifyRegisterCode(activityId, code) {
  // 扫码签到：前端使用报名 ID 作为核销码
  const id = Number(String(code).trim())
  if (!id) throw new Error('无效的核销码')
  await checkinRegister(activityId, id)
  return { success: true }
}

// 导出：后端暂未提供异步导出接口，保留本地化 CSV 生成。
const exportTasks = {}
let exportSeq = 1
export async function createRegisterExportTask(filters = {}) {
  const taskId = exportSeq
  exportSeq += 1
  exportTasks[taskId] = { status: 'processing', progress: 10 }
  try {
    const activityId = filters.activity_id
    let page = 1
    const rows = []
    while (true) { // eslint-disable-line no-constant-condition
      const res = await request.get(`/admin/activities/${activityId}/registers`, {
        params: { page, size: 200 },
      })
      const normalized = fromBackendPage(res)
      rows.push(...normalized.list)
      if (rows.length >= normalized.total || normalized.list.length === 0) break
      page += 1
    }
    const header = 'id,activityId,userId,name,phone,registerStatus,createTime\n'
    const body = rows.map((r) => [r.id, r.activityId, r.userId, r.name, r.phone, r.registerStatus, r.createTime].join(',')).join('\n')
    const csv = `\ufeff${header}${body}`
    exportTasks[taskId] = { status: 'done', progress: 100, downloadText: csv, fileName: `activity-register-${taskId}.csv` }
  } catch (e) {
    exportTasks[taskId] = { status: 'failed', message: e?.message || '导出失败' }
  }
  return { taskId }
}

export async function getExportTask(taskId) {
  return exportTasks[Number(taskId)] || { status: 'failed', message: '任务不存在' }
}
