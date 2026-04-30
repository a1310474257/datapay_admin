import { getStorageValue } from '@/utils/storage'
import { ElMessage } from 'element-plus'

/** localStorage 中 token 的 key，与 stores/user.js 保持一致 */
const TOKEN_KEY = 'dp_token'

/**
 * 携带管理员 JWT，通过 fetch 下载受保护文件并在浏览器内触发保存。
 *
 * 使用 JS fetch 而非 <a href target="_blank">，是因为新标签页发起的请求
 * 不会携带 Authorization 请求头，导致 /api/file 接口返回 401。
 *
 * @param {string} url       - 文件请求地址（如 /api/file/encodedObjectKey）
 * @param {string} [filename] - 保存时的文件名；不传则从响应头 / URL 尾段自动提取
 */
export async function downloadWithAuth(url, filename) {
  const token = getStorageValue(TOKEN_KEY, '')
  let response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch (e) {
    ElMessage.error('网络异常，文件下载失败')
    throw e
  }

  if (!response.ok) {
    const msg = response.status === 401
      ? '登录已过期，请重新登录'
      : response.status === 403
        ? '权限不足，无法下载'
        : `下载失败（${response.status}）`
    ElMessage.error(msg)
    throw new Error(msg)
  }

  // 优先从 Content-Disposition 解析文件名，其次降级为 URL 尾段
  const disposition = response.headers.get('Content-Disposition') || ''
  const resolvedName = filename
    || parseFilenameFromDisposition(disposition)
    || decodeURIComponent(url.split('/').pop().split('?')[0] || 'file')

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = resolvedName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(objectUrl)
}

/**
 * 携带管理员 JWT 通过 fetch 拉取任意受保护文件，返回 Blob URL 和解析出的文件名。
 * 适用于视频预览、PDF 预览等需要在页面内内联展示的场景。
 * 调用方负责在不再使用时调用 revoke() 释放内存。
 *
 * @param {string} url - 文件请求地址
 * @returns {Promise<{ blobUrl: string, filename: string, revoke: () => void }>}
 */
export async function fetchBlobUrl(url) {
  const token = getStorageValue(TOKEN_KEY, '')
  let response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch (e) {
    ElMessage.error('网络异常，文件加载失败')
    throw e
  }

  if (!response.ok) {
    const msg = response.status === 401
      ? '登录已过期，请重新登录'
      : response.status === 403
        ? '权限不足，无法访问该文件'
        : `加载失败（${response.status}）`
    ElMessage.error(msg)
    throw new Error(msg)
  }

  const disposition = response.headers.get('Content-Disposition') || ''
  const filename = parseFilenameFromDisposition(disposition)
    || decodeURIComponent(url.split('/').pop().split('?')[0] || 'file')

  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)
  return {
    blobUrl,
    filename,
    revoke: () => URL.revokeObjectURL(blobUrl),
  }
}

/**
 * 从 Content-Disposition 响应头解析文件名。
 * 支持 filename*=UTF-8''xxx 和 filename="xxx" 两种格式。
 */
function parseFilenameFromDisposition(disposition) {
  if (!disposition) return ''
  // RFC 5987：filename*=UTF-8''encoded-name
  const rfc5987 = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
  if (rfc5987) {
    try { return decodeURIComponent(rfc5987[1].trim()) } catch { /* ignore */ }
  }
  // 普通 filename="xxx" 或 filename=xxx
  const plain = disposition.match(/filename\s*=\s*"?([^";]+)"?/i)
  if (plain) return plain[1].trim()
  return ''
}
