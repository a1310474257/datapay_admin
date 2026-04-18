import { db } from '@/mock'
import { delay } from './mockApi'

// 学习进度列表：按用户课程聚合进度百分比与最近学习时间。
export async function getStudyProgressList(params = {}) {
  await delay()
  const page = Number(params.page || 1)
  const pageSize = Number(params.pageSize || 10)
  const minP =
    params.progress_min !== '' && params.progress_min !== undefined && params.progress_min != null
      ? Number(params.progress_min)
      : null
  const maxP =
    params.progress_max !== '' && params.progress_max !== undefined && params.progress_max != null
      ? Number(params.progress_max)
      : null

  let rows = []
  db.userCourse.forEach((uc) => {
    const uid = Number(uc.user_id)
    const cid = Number(uc.course_id)
    const user = db.user.find((u) => Number(u.id) === uid)
    const course = db.course.find((c) => Number(c.id) === cid)
    const lessons = db.courseLesson.filter((l) => Number(l.course_id) === cid)
    const progresses = db.lessonProgress.filter((p) => Number(p.user_id) === uid && Number(p.course_id) === cid)
    const finished = progresses.filter((p) => Number(p.is_finished) === 1).length
    const total = lessons.length || 1
    const progress_pct = Math.min(100, Math.round((finished / total) * 100))
    const last = progresses.reduce(
      (max, p) => (String(p.updated_at) > String(max) ? p.updated_at : max),
      '',
    )
    rows.push({
      id: uc.id,
      user_id: uid,
      user_nickname: user?.nickname || '—',
      course_id: cid,
      course_title: course?.title || '—',
      learned_sections: finished,
      progress_pct,
      last_learn_at: last || uc.created_at,
    })
  })

  if (params.user_id) rows = rows.filter((r) => Number(r.user_id) === Number(params.user_id))
  if (params.course_id) rows = rows.filter((r) => Number(r.course_id) === Number(params.course_id))
  if (minP != null && !Number.isNaN(minP)) rows = rows.filter((r) => r.progress_pct >= minP)
  if (maxP != null && !Number.isNaN(maxP)) rows = rows.filter((r) => r.progress_pct <= maxP)

  rows.sort((a, b) => Number(b.last_learn_at || 0) - Number(a.last_learn_at || 0))
  const total = rows.length
  const list = rows.slice((page - 1) * pageSize, page * pageSize)
  return { list, total, page, pageSize }
}

// 某用户某课程下的课时进度明细。
export async function getStudyProgressLessons(userId, courseId) {
  await delay()
  const uid = Number(userId)
  const cid = Number(courseId)
  const lessons = db.courseLesson.filter((l) => Number(l.course_id) === cid).sort((a, b) => Number(a.sort) - Number(b.sort))
  return lessons.map((les) => {
    const p =
      db.lessonProgress.find(
        (x) => Number(x.user_id) === uid && Number(x.lesson_id) === Number(les.id),
      ) || {}
    return {
      lesson_id: les.id,
      title: les.title,
      duration_sec: les.duration_sec,
      watched_sec: p.watched_sec || 0,
      is_finished: Number(p.is_finished || 0),
      updated_at: p.updated_at || '',
    }
  })
}
