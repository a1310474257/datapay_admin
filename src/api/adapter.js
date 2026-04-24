// 后端接口适配工具
// ----------------------------------------------------------------
// 前端历史代码基于 mock 数据形成了一套约定：
//   - 分页响应：{ list, total, page, pageSize }
//   - 字段：snake_case（如 created_at、business_type）
//   - 分页参数：page, pageSize
//
// 真实后端 datapay_server 约定：
//   - 分页响应（MyBatis-Plus Page）：{ records, total, current, size }
//   - 字段：camelCase（如 createdAt, scene）
//   - 分页参数：page, size
//
// 为保持视图最小改动，在 API 层统一进行双向适配。

/**
 * 把 MyBatis-Plus 分页（{records,total,current,size}）转为前端约定
 * 的 {list,total,page,pageSize}；并对每条记录调用 rowMapper 做字段映射。
 *
 * @param {object} page       后端 Page 对象
 * @param {function} rowMapper  记录映射函数，默认原样返回
 */
export function fromBackendPage(page, rowMapper = (row) => row) {
  const p = page || {}
  const records = Array.isArray(p.records) ? p.records : []
  return {
    list: records.map(rowMapper),
    total: Number(p.total || 0),
    page: Number(p.current || 1),
    pageSize: Number(p.size || records.length || 10),
  }
}

/**
 * 把前端分页参数 {page, pageSize} 转换为后端参数 {page, size}，
 * 并去掉空字符串和 undefined，其他参数原样透传。
 */
export function toBackendParams(params = {}, extra = {}) {
  const result = {}
  Object.entries({ ...params, ...extra }).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    if (k === 'pageSize') {
      result.size = v
    } else {
      result[k] = v
    }
  })
  // 兜底默认分页
  if (!result.page) result.page = 1
  if (!result.size) result.size = 10
  return result
}

/**
 * 驼峰 -> 下划线（仅顶层 key），保留值不变。
 */
export function camelToSnake(obj) {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return obj
  const out = {}
  Object.entries(obj).forEach(([k, v]) => {
    const snake = k.replace(/([A-Z])/g, (_, c) => `_${c.toLowerCase()}`)
    out[snake] = v
  })
  return out
}

/**
 * 下划线 -> 驼峰（仅顶层 key），保留值不变。
 */
export function snakeToCamel(obj) {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return obj
  const out = {}
  Object.entries(obj).forEach(([k, v]) => {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    out[camel] = v
  })
  return out
}

/**
 * 常见字段名映射：把后端 camelCase 补一份 snake_case 别名，
 * 这样既兼容旧视图（snake_case），也兼容新组件（camelCase）。
 */
const COMMON_ALIAS_MAP = [
  ['createdAt', 'created_at'],
  ['updatedAt', 'updated_at'],
  ['categoryId', 'category_id'],
  ['categoryName', 'category_name'],
  ['teacherId', 'teacher_id'],
  ['teacherName', 'teacher_name'],
  ['userId', 'user_id'],
  ['userNickname', 'user_nickname'],
  ['userPhone', 'user_phone'],
  ['orderNo', 'order_no'],
  ['orderType', 'order_type'],
  ['originalPrice', 'original_price'],
  ['activityDate', 'activity_date'],
  ['activityStatus', 'activity_status'],
  ['timeRange', 'time_range'],
  ['chapterCount', 'chapter_count'],
  ['resourceType', 'resource_type'],
  ['downloadUrl', 'download_url'],
  ['filePath', 'file_path'],
  ['linkUrl', 'link_url'],
  ['targetId', 'target_id'],
  ['targetTitle', 'target_title'],
  ['expressCompany', 'express_company'],
  ['expressNo', 'express_no'],
  ['payTime', 'pay_time'],
  ['shipTime', 'ship_time'],
  ['finishTime', 'finish_time'],
  ['cancelTime', 'cancel_time'],
  ['payExpireAt', 'pay_expire_at'],
  ['goodsTotal', 'goods_total'],
  ['actualPay', 'actual_pay'],
  ['limitCount', 'limit_count'],
  ['enrolledCount', 'enrolled_count'],
  ['registerStatus', 'register_status'],
  ['fileUrl', 'file_url'],
  ['fileSize', 'file_size'],
  ['durationSec', 'duration_sec'],
  ['videoUrl', 'video_url'],
  ['isFree', 'is_free'],
  ['isFinished', 'is_finished'],
  ['watchedSec', 'watched_sec'],
  ['courseId', 'course_id'],
  ['courseTitle', 'course_title'],
  ['courseCover', 'course_cover'],
  ['courseStatus', 'course_status'],
  ['resourceId', 'resource_id'],
  ['resourceTitle', 'resource_title'],
  ['previewPages', 'preview_pages'],
  ['orderId', 'order_id'],
  ['lessonId', 'lesson_id'],
  ['publishedAt', 'published_at'],
  ['totalDuration', 'total_duration'],
  ['registerStatusLabel', 'register_status_label'],
  ['statusLabel', 'status_label'],
  ['typeLabel', 'type_label'],
  ['lastLoginAt', 'last_login_at'],
]

/**
 * 给一个对象补齐常用 snake_case 别名，方便老视图直接读取。
 */
export function withAliases(row) {
  if (!row || typeof row !== 'object') return row
  const copy = { ...row }
  COMMON_ALIAS_MAP.forEach(([camel, snake]) => {
    if (copy[camel] !== undefined && copy[snake] === undefined) {
      copy[snake] = copy[camel]
    }
    if (copy[snake] !== undefined && copy[camel] === undefined) {
      copy[camel] = copy[snake]
    }
  })
  return copy
}

/**
 * 把 rowMapper 和别名补齐串起来，既执行自定义映射，又补齐 snake_case 别名。
 */
export function makeRowMapper(customMapper) {
  return (row) => withAliases(customMapper ? customMapper(row) : row)
}
