import { db } from '@/mock'
import { mockApi } from './mockApi'

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
