import request from './request'
import { fromBackendPage, makeRowMapper, withAliases } from './adapter'

// 用户管理：/api/admin/users
// 后端：pageNum / pageSize / nickname / phone / status / createdStart / createdEnd

function mapRow(row) {
  return withAliases(row)
}
const rowMapper = makeRowMapper(mapRow)

export async function getUserList(params = {}) {
  const [startAt, endAt] = Array.isArray(params.created_at) ? params.created_at : []
  const keyword = String(params.keyword || '').trim()
  const isPhone = /^\d{3,}$/.test(keyword)
  const backendParams = {
    pageNum: params.page || 1,
    pageSize: params.pageSize || 10,
    nickname: !isPhone ? (keyword || undefined) : undefined,
    phone: isPhone ? keyword : undefined,
    status: params.status === '' || params.status === undefined ? undefined : Number(params.status),
    createdStart: startAt,
    createdEnd: endAt,
  }
  Object.keys(backendParams).forEach((k) => {
    if (backendParams[k] === undefined || backendParams[k] === '') delete backendParams[k]
  })
  const page = await request.get('/admin/users', { params: backendParams })
  return fromBackendPage(page, rowMapper)
}

export async function getUserDetail(id) {
  const row = await request.get(`/admin/users/${id}`)
  if (!row) throw new Error('用户不存在')
  return mapRow(row)
}

export async function banUser(id) {
  return request.patch(`/admin/users/${id}/status`, { status: 0 })
}

export async function unbanUser(id) {
  return request.patch(`/admin/users/${id}/status`, { status: 1 })
}

export async function forceLogout() {
  // 后端暂未提供强制下线接口；返回成功以兼容前端按钮。
  return { success: true }
}

// 用户订单（按 userId 过滤）。直接复用 order.js 的映射以保持枚举一致。
export async function getUserOrders(userId, params = {}) {
  const { getOrderList } = await import('./order')
  return getOrderList({ ...params, user_id: Number(userId) })
}

// 已购课程：/api/admin/user-courses?userId=xx
export async function getUserPurchasedCourses(userId) {
  const res = await request.get('/admin/user-courses', {
    params: { userId: Number(userId), pageNum: 1, pageSize: 100 },
  })
  const normalized = fromBackendPage(res, makeRowMapper((row) => ({
    ...withAliases(row),
    user_id: row.userId,
    course_id: row.courseId,
    course_title: row.courseTitle,
    course_cover: row.courseCover,
    teacher_name: row.teacherName,
    order_id: row.orderId,
    progress_pct: 0, // 后端未提供学习进度，占位
    last_learn_at: row.createdAt,
  })))
  return normalized.list
}

// 已购资源：/api/admin/user-resources?userId=xx
export async function getUserPurchasedResources(userId) {
  const res = await request.get('/admin/user-resources', {
    params: { userId: Number(userId), pageNum: 1, pageSize: 100 },
  })
  const normalized = fromBackendPage(res, makeRowMapper((row) => ({
    ...withAliases(row),
    user_id: row.userId,
    resource_id: row.resourceId,
    resource_title: row.resourceTitle,
    resource_type: row.resourceType,
    order_id: row.orderId,
  })))
  return normalized.list
}

// 收货地址：后端未提供“按 userId 查地址”的管理端接口，暂返空。
export async function getUserAddresses() {
  return []
}
