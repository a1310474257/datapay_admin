/**
 * 将业务表中存储的 objectKey 或公网/data URL 转为前端可请求的预览地址。
 * 与首页轮播图约定一致：非 http(s)/data: 时走 `/api/file/*` 中转。
 *
 * @param {string} value - cover/image 等字段原始值
 * @returns {string}
 */
export function resolveMediaPreviewUrl(value) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value
  if (value.startsWith('image/')) return `/api/file/image?key=${value}`
  // 按路径段分别编码，保留 "/" 作为真实路径分隔符；
  // 如果对整个 objectKey 用 encodeURIComponent，"/" 会变成 "%2F"，
  // Spring Boot 默认拒绝路径变量中的编码斜杠，返回 400。
  return `/api/file/${value.split('/').map(encodeURIComponent).join('/')}`
}
