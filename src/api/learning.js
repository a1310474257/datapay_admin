import request from './request'
import { fromBackendPage, makeRowMapper, withAliases } from './adapter'

// 学习进度：/api/admin/lesson-progresses
// 后端返回按“课时”的进度记录；前端期望“按用户x课程汇总进度”。
// 这里做分组聚合：先拉取查询范围内的所有进度，再按 user+course 聚合。

// 后端限制 pageSize <= 100，这里统一使用 100，避免触发参数校验错误。
const LIST_SIZE = 100

async function fetchAllProgress({ userId, courseId }) {
  // 最多拉 2000 条，避免爆炸；真实生产应后端提供聚合接口。
  const all = []
  let page = 1
  // 维持“最多拉取约 2000 条”的上限：100 * 20 = 2000
  while (page <= 20) { // eslint-disable-line no-constant-condition
    // eslint-disable-next-line no-await-in-loop
    const res = await request.get('/admin/lesson-progresses', {
      params: { pageNum: page, pageSize: LIST_SIZE, userId, courseId },
    })
    const normalized = fromBackendPage(res)
    all.push(...normalized.list)
    if (all.length >= normalized.total || normalized.list.length === 0) break
    page += 1
  }
  return all
}

async function fetchUser(userId) {
  if (!userId) return null
  try {
    return await request.get(`/admin/users/${userId}`)
  } catch (_) { return null }
}

async function fetchCourse(courseId) {
  if (!courseId) return null
  try {
    return await request.get(`/admin/courses/${courseId}`)
  } catch (_) { return null }
}

export async function getStudyProgressList(params = {}) {
  const page = Number(params.page || 1)
  const pageSize = Number(params.pageSize || 10)
  const records = await fetchAllProgress({
    userId: params.user_id || params.userId,
    courseId: params.course_id || params.courseId,
  })

  // 按 user_id + course_id 聚合
  const map = new Map()
  records.forEach((r) => {
    const key = `${r.userId}|${r.courseId}`
    if (!map.has(key)) {
      map.set(key, {
        user_id: r.userId,
        course_id: r.courseId,
        finished: 0,
        total: 0,
        last_learn_at: '',
      })
    }
    const agg = map.get(key)
    agg.total += 1
    if (Number(r.isFinished) === 1) agg.finished += 1
    if (r.updatedAt && String(r.updatedAt) > String(agg.last_learn_at)) {
      agg.last_learn_at = r.updatedAt
    }
  })

  // 解析 user/course 名称
  const aggregated = Array.from(map.values())
  const userIds = Array.from(new Set(aggregated.map((a) => a.user_id)))
  const courseIds = Array.from(new Set(aggregated.map((a) => a.course_id)))
  const userMap = new Map()
  const courseMap = new Map()
  await Promise.all([
    ...userIds.map(async (id) => {
      const u = await fetchUser(id)
      if (u) userMap.set(id, u.nickname || `用户#${id}`)
    }),
    ...courseIds.map(async (id) => {
      const c = await fetchCourse(id)
      if (c) courseMap.set(id, c.title || `课程#${id}`)
    }),
  ])

  let rows = aggregated.map((a, idx) => {
    const progress_pct = a.total ? Math.round((a.finished / a.total) * 100) : 0
    return {
      id: idx + 1,
      user_id: a.user_id,
      user_nickname: userMap.get(a.user_id) || `用户#${a.user_id}`,
      course_id: a.course_id,
      course_title: courseMap.get(a.course_id) || `课程#${a.course_id}`,
      learned_sections: a.finished,
      progress_pct,
      last_learn_at: a.last_learn_at,
    }
  })

  const minP = params.progress_min === '' || params.progress_min == null ? null : Number(params.progress_min)
  const maxP = params.progress_max === '' || params.progress_max == null ? null : Number(params.progress_max)
  if (minP != null && !Number.isNaN(minP)) rows = rows.filter((r) => r.progress_pct >= minP)
  if (maxP != null && !Number.isNaN(maxP)) rows = rows.filter((r) => r.progress_pct <= maxP)
  rows.sort((a, b) => String(b.last_learn_at || '').localeCompare(String(a.last_learn_at || '')))

  const total = rows.length
  const list = rows.slice((page - 1) * pageSize, page * pageSize)
  return { list, total, page, pageSize }
}

export async function getStudyProgressLessons(userId, courseId) {
  const uid = Number(userId)
  const cid = Number(courseId)
  // 拉课时列表（从章节树获取）
  const chapters = await request.get(`/admin/courses/${cid}/chapters`, {
    params: { pageNum: 1, pageSize: 100 },
  })
  const chList = fromBackendPage(chapters).list
  const lessonsAll = []
  for (const ch of chList) {
    // eslint-disable-next-line no-await-in-loop
    const lesPage = await request.get(`/admin/courses/${cid}/chapters/${ch.id}/lessons`, {
      params: { pageNum: 1, pageSize: 100 },
    })
    lessonsAll.push(...fromBackendPage(lesPage).list)
  }
  lessonsAll.sort((a, b) => Number(a.sort) - Number(b.sort))

  const records = await fetchAllProgress({ userId: uid, courseId: cid })
  const progressMap = new Map(records.map((r) => [Number(r.lessonId), r]))

  return lessonsAll.map((les) => {
    const p = progressMap.get(Number(les.id)) || {}
    return {
      lesson_id: les.id,
      title: les.title,
      duration_sec: les.durationSec,
      watched_sec: p.watchedSec || 0,
      is_finished: Number(p.isFinished || 0),
      updated_at: p.updatedAt || '',
    }
  })
}

// 以下导出避免 lint 警告 withAliases/makeRowMapper 未使用
export const _helpers = { withAliases, makeRowMapper }
