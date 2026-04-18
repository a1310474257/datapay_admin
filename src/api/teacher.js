import { db } from '@/mock'
import { mockApi } from './mockApi'

// 讲师列表：支持关键字和状态筛选，默认按 id 倒序。
export async function getTeacherList(params = {}) {
  const base = await mockApi.crud(db.teacher, { ...params, sort: params.sort || 'id,desc' }, {
    filterFields: ['status'],
  })
  const keyword = String(params.keyword || '').trim()
  const rows = keyword
    ? base.list.filter((item) =>
      [item.name, item.title, item.intro, item.brief].some((field) => String(field || '').includes(keyword)))
    : base.list
  return { ...base, list: rows }
}

// 新增讲师：兼容 intro/brief 双字段，方便旧数据平滑过渡。
export async function createTeacher(data) {
  const brief = data.brief || data.intro || ''
  return mockApi.create(db.teacher, {
    ...data,
    brief,
    intro: brief,
    sort: Number(data.sort || 1),
  })
}

// 更新讲师：同步 brief 与 intro，避免列表展示不一致。
export async function updateTeacher(id, data) {
  const brief = data.brief || data.intro || ''
  return mockApi.update(db.teacher, id, {
    ...data,
    brief,
    intro: brief,
    sort: Number(data.sort || 1),
  })
}

// 删除讲师：软删/硬删由 mockApi.remove 内部策略决定。
export async function deleteTeacher(id) {
  return mockApi.remove(db.teacher, id)
}
