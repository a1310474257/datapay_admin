import { db } from '@/mock'
import { delay, mockApi } from './mockApi'

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

// 已购课程：user_course 关联课程标题与进度（由课时完成情况估算）。
export async function getUserPurchasedCourses(userId) {
  await delay()
  const uid = Number(userId)
  const rows = db.userCourse.filter((uc) => Number(uc.user_id) === uid)
  return rows.map((uc) => {
    const course = db.course.find((c) => Number(c.id) === Number(uc.course_id))
    const lessons = db.courseLesson.filter((l) => Number(l.course_id) === Number(uc.course_id))
    const progresses = db.lessonProgress.filter(
      (p) => Number(p.user_id) === uid && Number(p.course_id) === Number(uc.course_id),
    )
    const finished = progresses.filter((p) => Number(p.is_finished) === 1).length
    const total = lessons.length || 1
    const progress_pct = Math.min(100, Math.round((finished / total) * 100))
    const lastLearn = progresses.reduce((max, p) => (String(p.updated_at) > String(max) ? p.updated_at : max), '')
    return {
      ...uc,
      course_title: course?.title || '—',
      progress_pct,
      last_learn_at: lastLearn || uc.created_at,
    }
  })
}

// 已购资源。
export async function getUserPurchasedResources(userId) {
  await delay()
  const uid = Number(userId)
  return db.userResource
    .filter((ur) => Number(ur.user_id) === uid)
    .map((ur) => {
      const res = db.resource.find((r) => Number(r.id) === Number(ur.resource_id))
      return {
        ...ur,
        resource_title: res?.title || '—',
      }
    })
}

// 收货地址。
export async function getUserAddresses(userId) {
  await delay()
  return db.userAddress.filter((a) => Number(a.user_id) === Number(userId) && a.deleted_at == null)
}

// 用户订单列表（管理端）。
export async function getUserOrders(userId, params = {}) {
  await delay()
  const page = Number(params.page || 1)
  const pageSize = Number(params.pageSize || 10)
  let rows = db.order.filter((o) => Number(o.user_id) === Number(userId) && o.deleted_at == null)
  rows = rows.sort((a, b) => Number(b.id) - Number(a.id))
  const total = rows.length
  const list = rows.slice((page - 1) * pageSize, page * pageSize)
  return { list, total, page, pageSize }
}
