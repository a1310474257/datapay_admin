import request from './request'
import { fromBackendPage, makeRowMapper, withAliases } from './adapter'

// 课程管理：/api/admin/courses
// 后端：pageNum / pageSize / title / categoryId / teacherId / status / createdStart / createdEnd

function mapCourseRow(row) {
  const aliased = withAliases(row)
  return {
    ...aliased,
    category_id: row.categoryId ?? row.category_id,
    teacher_id: row.teacherId ?? row.teacher_id,
    teacher_name: row.teacherName ?? row.teacher_name,
    total_duration: row.totalDuration ?? row.total_duration,
    original_price: row.originalPrice ?? row.original_price,
    chapter_count: row.chapterCount ?? row.chapter_count,
  }
}
const rowMapper = makeRowMapper(mapCourseRow)

export async function getCourseList(params = {}) {
  const backendParams = {
    pageNum: params.page || 1,
    pageSize: params.pageSize || 10,
    title: params.keyword || params.title || undefined,
    categoryId: params.category_id || params.categoryId || undefined,
    teacherId: params.teacher_id || params.teacherId || undefined,
    status: params.status === '' || params.status === undefined ? undefined : Number(params.status),
  }
  Object.keys(backendParams).forEach((k) => {
    if (backendParams[k] === undefined || backendParams[k] === '') delete backendParams[k]
  })
  const page = await request.get('/admin/courses', { params: backendParams })
  return fromBackendPage(page, rowMapper)
}

function toBackendPayload(data = {}) {
  return {
    categoryId: data.category_id ?? data.categoryId ?? 0,
    teacherId: data.teacher_id ?? data.teacherId ?? 0,
    title: data.title,
    cover: data.cover || '',
    brief: data.brief || '',
    description: data.description || '',
    totalDuration: data.total_duration || data.totalDuration || '',
    price: data.price == null ? 0 : Number(data.price),
    originalPrice: data.price == null ? 0 : Number(data.price),
    status: data.status === undefined ? 1 : Number(data.status),
  }
}

export async function createCourse(data) {
  const id = await request.post('/admin/courses', toBackendPayload(data))
  return { id }
}

export async function updateCourse(id, data) {
  await request.put(`/admin/courses/${id}`, toBackendPayload(data))
  return { id }
}

export async function updateCourseTotalDuration(id, totalDuration) {
  await request.put(`/admin/courses/${id}`, { totalDuration: totalDuration || '' })
  return { id }
}

export async function deleteCourse(id) {
  return request.delete(`/admin/courses/${id}`)
}

export async function findCourseById(id) {
  const row = await request.get(`/admin/courses/${id}`)
  if (!row) throw new Error('课程不存在')
  return mapCourseRow(row)
}

export async function toggleCourseStatus(id, status) {
  // 后端没有独立状态接口，复用 update。
  const current = await findCourseById(id)
  return updateCourse(id, { ...current, status: Number(status) })
}

// ------- 章节/课时（/api/admin/courses/{courseId}/chapters/...） -------
// 前端 ChapterLessonTree 以“树形”方式批量保存。

async function fetchChaptersRaw(courseId) {
  const page = await request.get(`/admin/courses/${courseId}/chapters`, {
    params: { pageNum: 1, pageSize: 100 },
  })
  return fromBackendPage(page).list
}

async function fetchLessonsRaw(courseId, chapterId) {
  const page = await request.get(`/admin/courses/${courseId}/chapters/${chapterId}/lessons`, {
    // TeacherQueryDTO / CourseLessonQueryDTO 均限制 pageSize <= 100
    params: { pageNum: 1, pageSize: 100 },
  })
  return fromBackendPage(page).list
}

export async function getChapters(courseId) {
  const chapters = await fetchChaptersRaw(courseId)
  const sorted = chapters.sort((a, b) => Number(a.sort) - Number(b.sort))
  const results = await Promise.all(sorted.map(async (ch) => {
    const lessons = await fetchLessonsRaw(courseId, ch.id)
    return {
      id: ch.id,
      course_id: Number(courseId),
      title: ch.title,
      sort: ch.sort,
      lessons: lessons
        .sort((a, b) => Number(a.sort) - Number(b.sort))
        .map((les) => ({
          id: les.id,
          course_id: Number(courseId),
          chapter_id: ch.id,
          title: les.title || '',
          // durationSec 可能为 null，统一转为数字避免 el-input-number 显示 NaN
          duration_sec: Number(les.durationSec || 0),
          video_url: les.videoUrl || '',
          // 回显已存储的原始文件名（后端返回时带 videoName 则显示，否则降级为空）
          video_name: les.videoName || '',
          // isFree 后端为 Integer(0/1)，转为数字保证 el-switch 匹配 active-value="1"
          is_free: Number(les.isFree ?? 0),
          sort: Number(les.sort ?? 0),
        })),
    }
  }))
  return results
}

export async function saveChapters(courseId, tree) {
  const cid = Number(courseId)
  const list = Array.isArray(tree) ? tree : []
  await request.put(`/admin/courses/${cid}/chapters/tree`, {
    chapters: list.map((ch, i) => ({
      title: ch.title || `章节 ${i + 1}`,
      sort: Number(ch.sort ?? i + 1),
      lessons: (Array.isArray(ch.lessons) ? ch.lessons : []).map((les, j) => ({
        title: les.title || `课时 ${j + 1}`,
        durationSec: Number(les.duration_sec || 0),
        videoUrl: les.video_url || '',
        // 保存原始文件名，供下次回显时显示友好名称而非 BOS UUID
        videoName: les.video_name || '',
        isFree: Number(les.is_free ?? 0),
        sort: Number(les.sort ?? j + 1),
      })),
    })),
  })
  return { success: true }
}

// ------- 配套资料：/api/admin/courses/{courseId}/materials -------
export async function getMaterials(courseId) {
  const page = await request.get(`/admin/courses/${courseId}/materials`, {
    params: { pageNum: 1, pageSize: 100 },
  })
  return fromBackendPage(page).list
    .map((row) => ({
      id: row.id,
      course_id: Number(courseId),
      title: row.title,
      type: row.type,
      file_size: row.fileSize,
      url: row.url,
      // 原始文件名（后端字段 fileName），用于前端回显时显示友好名称而非 BOS UUID
      file_name: row.fileName || row.file_name || '',
      sort: row.sort,
    }))
    .sort((a, b) => Number(a.sort) - Number(b.sort))
}

function toBackendMaterial(data) {
  return {
    title: data.title,
    type: data.type || '',
    fileSize: data.file_size || data.fileSize || '',
    url: data.url,
    // 持久化原始文件名，下次回显时可由 UploadFile initName 显示友好名称而非 BOS UUID
    fileName: data.file_name || data.fileName || '',
    sort: Number(data.sort ?? 0),
  }
}

export async function saveMaterial(courseId, data) {
  if (data?.id) {
    await request.put(`/admin/courses/${courseId}/materials/${data.id}`, toBackendMaterial(data))
    return { id: data.id }
  }
  const id = await request.post(`/admin/courses/${courseId}/materials`, toBackendMaterial(data))
  return { id }
}

// deleteMaterial(id) 历史签名；为兼容视图层，沿用单参数调用。
// 通过保存一份最近材料所属课程的映射来解决 courseId 缺失的问题。
const _materialCourseMap = {}
const _origGetMaterials = getMaterials
// eslint-disable-next-line no-unused-vars
async function _cacheMaterials(courseId) {
  const list = await _origGetMaterials(courseId)
  list.forEach((m) => { _materialCourseMap[m.id] = courseId })
  return list
}
export async function deleteMaterial(idOrMaterial, courseIdArg) {
  let id = idOrMaterial
  let courseId = courseIdArg
  if (idOrMaterial && typeof idOrMaterial === 'object') {
    id = idOrMaterial.id
    courseId = idOrMaterial.course_id ?? idOrMaterial.courseId
  }
  courseId = courseId || _materialCourseMap[id]
  if (!courseId) throw new Error('缺少课程ID，无法删除资料')
  return request.delete(`/admin/courses/${courseId}/materials/${id}`)
}
