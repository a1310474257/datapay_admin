import { db } from '@/mock'
import { now } from '@/utils/date'
import { delay, mockApi } from './mockApi'

// 课程列表：支持关键字、分类、讲师、状态筛选。
export async function getCourseList(params = {}) {
  const payload = { ...params, sort: params.sort || 'id,desc' }
  const base = await mockApi.crud(db.course, payload, {
    filterFields: ['category_id', 'teacher_id', 'status'],
  })
  const keyword = String(params.keyword || '').trim()
  const rows = keyword
    ? base.list.filter((item) => String(item.title || '').includes(keyword))
    : base.list
  return { ...base, list: rows }
}

// 新增课程。
export async function createCourse(data) {
  return mockApi.create(db.course, {
    ...data,
    chapter_count: Number(data.chapter_count || 0),
    sales: Number(data.sales || 0),
  })
}

// 更新课程。
export async function updateCourse(id, data) {
  return mockApi.update(db.course, id, data)
}

// 删除课程。
export async function deleteCourse(id) {
  return mockApi.remove(db.course, id)
}

// 按 id 查询课程详情。
export async function findCourseById(id) {
  const row = await mockApi.findById(db.course, id)
  if (!row) throw new Error('课程不存在')
  return row
}

// 上下架切换。
export async function toggleCourseStatus(id, status) {
  return mockApi.update(db.course, id, { status: Number(status) })
}

// 章节 + 课时树：按课程聚合章节与其下课时，供 ChapterLessonTree 使用。
export async function getChapters(courseId) {
  await delay()
  const cid = Number(courseId)
  const chapters = db.courseChapter
    .filter((row) => Number(row.course_id) === cid)
    .sort((a, b) => Number(a.sort) - Number(b.sort))
  return chapters.map((ch) => ({
    id: ch.id,
    course_id: cid,
    title: ch.title,
    sort: ch.sort,
    lessons: db.courseLesson
      .filter((les) => Number(les.chapter_id) === Number(ch.id))
      .sort((a, b) => Number(a.sort) - Number(b.sort))
      .map((les) => ({ ...les })),
  }))
}

// 批量保存章节树：先清理该课程旧数据，再写入新树并同步 chapter_count。
export async function saveChapters(courseId, tree) {
  await delay()
  const cid = Number(courseId)
  const oldChapterIds = db.courseChapter.filter((c) => Number(c.course_id) === cid).map((c) => c.id)
  db.courseLesson = db.courseLesson.filter((l) => !oldChapterIds.includes(Number(l.chapter_id)))
  db.courseChapter = db.courseChapter.filter((c) => Number(c.course_id) !== cid)

  let nextChapterId = db.courseChapter.reduce((m, r) => Math.max(m, Number(r.id || 0)), 0) + 1
  let nextLessonId = db.courseLesson.reduce((m, r) => Math.max(m, Number(r.id || 0)), 0) + 1
  const stamp = now()
  const list = Array.isArray(tree) ? tree : []
  list.forEach((ch, chIdx) => {
    const chapterId = nextChapterId
    nextChapterId += 1
    db.courseChapter.push({
      id: chapterId,
      course_id: cid,
      title: ch.title || `章节 ${chIdx + 1}`,
      sort: Number(ch.sort ?? chIdx + 1),
      created_at: stamp,
      updated_at: stamp,
    })
    const lessons = Array.isArray(ch.lessons) ? ch.lessons : []
    lessons.forEach((les, idx) => {
      db.courseLesson.push({
        id: nextLessonId,
        course_id: cid,
        chapter_id: chapterId,
        title: les.title || `课时 ${idx + 1}`,
        duration_sec: Number(les.duration_sec || 0),
        video_url: les.video_url || '',
        is_free: Number(les.is_free ?? 0),
        sort: Number(les.sort ?? idx + 1),
        created_at: stamp,
        updated_at: stamp,
      })
      nextLessonId += 1
    })
  })

  const course = db.course.find((c) => Number(c.id) === cid)
  if (course) {
    course.chapter_count = list.length
    course.updated_at = stamp
  }
  return { success: true }
}

// 配套资料列表。
export async function getMaterials(courseId) {
  await delay()
  return db.courseMaterial
    .filter((m) => Number(m.course_id) === Number(courseId))
    .sort((a, b) => Number(a.sort) - Number(b.sort))
    .map((m) => ({ ...m }))
}

// 新增或更新资料。
export async function saveMaterial(courseId, data) {
  const cid = Number(courseId)
  if (data?.id) {
    return mockApi.update(db.courseMaterial, data.id, { ...data, course_id: cid })
  }
  return mockApi.create(db.courseMaterial, { ...data, course_id: cid })
}

// 删除资料。
export async function deleteMaterial(id) {
  return mockApi.remove(db.courseMaterial, id)
}
